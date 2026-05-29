"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  label?: string | null;
  variant?: "inline" | "page";
  className?: string;
};

/**
 * RD Loader — sun rising over animated dunes. Brand-aligned loading indicator.
 *
 * - `variant="page"` → fixed fullscreen overlay with cream background.
 * - `variant="inline"` → centered flex block, sizes from parent.
 * - IDs generated via useId() to avoid SVG conflicts when multiple loaders
 *   coexist on the same page.
 * - Respects `prefers-reduced-motion`: SVG fades, only label remains.
 */
export function RdLoader({
  size = 200,
  label = "A carregar",
  variant = "inline",
  className,
}: Props) {
  const rawId = useId();
  // useId returns ":r0:" which is invalid in CSS url(#...) refs — sanitize.
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const pathId = `rd-path-${uid}`;
  const heartId = `rd-heart-${uid}`;

  // SandFlow palette (Oasis tokens)
  const PAL = { flame: "#ff6b3f", ember: "#d6422a", apricot: "#e89968", ring: "#a8201a" };
  const GRAIN_COUNT = 14;
  const SAND_PATH = "M 30 130 C 50 60, 150 60, 170 130 S 130 200, 100 170 S 50 200, 30 130 Z";

  const wrapperClass =
    variant === "page"
      ? cn(
          "rd-loader rd-loader--page",
          "fixed inset-0 z-[9999]",
          "flex flex-col items-center justify-center gap-[18px]",
          "transition-opacity duration-500",
          className
        )
      : cn(
          "rd-loader",
          "inline-flex flex-col items-center justify-center gap-[18px]",
          className
        );

  const pageBg =
    variant === "page"
      ? {
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,153,104,0.20), transparent 70%), #faf4e3",
        }
      : undefined;

  return (
    <div
      className={wrapperClass}
      style={pageBg}
      role="status"
      aria-live="polite"
      aria-label={label ?? "A carregar"}
    >
      <div
        className="rd-loader__art block motion-reduce:hidden"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <path id={pathId} d={SAND_PATH} />
            <radialGradient id={heartId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={PAL.flame} stopOpacity="0.65" />
              <stop offset="100%" stopColor={PAL.ember} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Guide arc */}
          <use
            href={`#${pathId}`}
            fill="none"
            stroke={PAL.ring}
            strokeWidth="0.8"
            strokeOpacity="0.25"
            strokeDasharray="2 4"
          />

          {/* Heart glow */}
          <circle cx="100" cy="125" r="30" fill={`url(#${heartId})`}>
            <animate
              attributeName="r"
              values="24;34;24"
              dur="2.8s"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              repeatCount="indefinite"
            />
          </circle>

          {/* Grains flowing along the path */}
          {Array.from({ length: GRAIN_COUNT }).map((_, i) => {
            const t = i / GRAIN_COUNT;
            const color = i % 3 === 0 ? PAL.flame : i % 3 === 1 ? PAL.ember : PAL.apricot;
            const r = 1.4 + (i % 4) * 0.4;
            const begin = `-${(t * 4.5).toFixed(2)}s`;
            return (
              <circle key={i} r={r} fill={color}>
                <animateMotion dur="4.5s" repeatCount="indefinite" begin={begin}>
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="4.5s"
                  begin={begin}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </svg>
      </div>

      {label && (
        <span
          className={cn(
            "rd-loader__label",
            "inline-flex items-center gap-2",
            "font-mono text-[11px] uppercase tracking-[0.32em]",
            "text-ink-mute"
          )}
        >
          <span
            className="block h-[5px] w-[5px] rounded-full bg-ember motion-safe:animate-[rd-pulse_1.4s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          {label}
        </span>
      )}

      <style jsx>{`
        @keyframes rd-pulse {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}
