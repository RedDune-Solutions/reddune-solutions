"use client";

import { useEffect, useRef } from "react";

/**
 * DuneBackground — three morphing SVG dune layers with a sun-warm gradient
 * palette, plus a subtle mouse-parallax effect on desktop.
 *
 * Direct port of the `.dune-bg-svg` markup from
 * `design-handoff/project/site/index.html` (lines 27-36) and the parallax
 * handler from `scripts.js` (lines 32-37).
 *
 * Parallax is intentionally **disabled** when:
 *   - the viewport is below 980px wide (mobile/tablet), or
 *   - the user prefers reduced motion.
 *
 * The morphing `morph1`/`morph2`/`morph3` keyframes still run via CSS unless
 * disabled by the global reduced-motion override in `globals.css`.
 */
export function DuneBackground() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const wideEnough = window.matchMedia("(min-width: 980px)").matches;
    if (reduced || !wideEnough) return;

    const svg = svgRef.current;
    if (!svg) return;
    const blobs = svg.querySelectorAll<SVGPathElement>(".dune-blob");
    if (blobs.length === 0) return;

    let rafId = 0;
    let pendingX = 0;
    let scheduled = false;

    const apply = () => {
      scheduled = false;
      blobs.forEach((b, i) => {
        b.style.transform = `translateX(${pendingX * (i + 1) * 6}px)`;
      });
    };

    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX / window.innerWidth - 0.5;
      if (!scheduled) {
        scheduled = true;
        rafId = window.requestAnimationFrame(apply);
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId) window.cancelAnimationFrame(rafId);
      blobs.forEach((b) => {
        b.style.transform = "";
      });
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="dune-bg-svg"
      viewBox="0 0 1920 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="duneA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e89968" />
          <stop offset="1" stopColor="#c97045" />
        </linearGradient>
        <linearGradient id="duneB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6422a" />
          <stop offset="1" stopColor="#a8201a" />
        </linearGradient>
        <linearGradient id="duneC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a1410" />
          <stop offset="1" stopColor="#3a0a08" />
        </linearGradient>
      </defs>
      <path
        className="dune-blob b1"
        d="M 0 380 C 200 320, 400 410, 700 360 C 900 320, 1100 400, 1400 350 C 1600 320, 1800 380, 1920 360 L 1920 600 L 0 600 Z"
        fill="url(#duneA)"
        opacity="0.7"
      />
      <path
        className="dune-blob b2"
        d="M 0 440 C 250 380, 480 460, 800 410 C 1080 370, 1300 450, 1600 400 C 1750 380, 1850 420, 1920 410 L 1920 600 L 0 600 Z"
        fill="url(#duneB)"
        opacity="0.85"
      />
      <path
        className="dune-blob b3"
        d="M 0 510 C 300 460, 600 530, 1000 490 C 1300 460, 1600 520, 1920 500 L 1920 600 L 0 600 Z"
        fill="url(#duneC)"
      />
    </svg>
  );
}

export default DuneBackground;
