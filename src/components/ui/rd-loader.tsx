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
  const sunId = `rd-sun-${uid}`;
  const clipId = `rd-clip-${uid}`;

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
            <radialGradient id={sunId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b3f" stopOpacity="1" />
              <stop offset="55%" stopColor="#d6422a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#d6422a" stopOpacity="0" />
            </radialGradient>
            <clipPath id={clipId}>
              <circle cx="100" cy="100" r="92" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            {/* Sun (rises + breathes) */}
            <circle cx="100" cy="130" r="36" fill={`url(#${sunId})`}>
              <animate
                attributeName="cy"
                values="135;118;135"
                dur="4.4s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="34;38;34"
                dur="3.2s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="100" cy="130" r="20" fill="#ff6b3f" opacity="0.85">
              <animate
                attributeName="cy"
                values="135;118;135"
                dur="4.4s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                repeatCount="indefinite"
              />
            </circle>

            {/* Far dune */}
            <path fill="#a8201a" opacity="0.55">
              <animate
                attributeName="d"
                dur="7.2s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                values="M0 130 C 40 110, 80 100, 120 110 S 200 120, 200 120 L 200 200 L 0 200 Z; M0 122 C 50 130, 90 96, 130 108 S 200 132, 200 132 L 200 200 L 0 200 Z; M0 130 C 40 110, 80 100, 120 110 S 200 120, 200 120 L 200 200 L 0 200 Z"
                repeatCount="indefinite"
              />
            </path>

            {/* Mid dune */}
            <path fill="#5a0e0e" opacity="0.85">
              <animate
                attributeName="d"
                dur="6s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                values="M0 150 C 50 140, 80 158, 120 148 S 200 142, 200 145 L 200 200 L 0 200 Z; M0 155 C 40 160, 90 138, 130 150 S 200 156, 200 152 L 200 200 L 0 200 Z; M0 150 C 50 140, 80 158, 120 148 S 200 142, 200 145 L 200 200 L 0 200 Z"
                repeatCount="indefinite"
              />
            </path>

            {/* Near dune */}
            <path fill="#2a1410">
              <animate
                attributeName="d"
                dur="5s"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                values="M0 175 C 50 170, 100 182, 150 172 S 200 170, 200 175 L 200 200 L 0 200 Z; M0 178 C 60 184, 110 168, 160 178 S 200 178, 200 180 L 200 200 L 0 200 Z; M0 175 C 50 170, 100 182, 150 172 S 200 170, 200 175 L 200 200 L 0 200 Z"
                repeatCount="indefinite"
              />
            </path>
          </g>

          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="#a8201a"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
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
