"use client";

import { useEffect, useRef, useState } from "react";

type SparkSpec = {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
  transform: string;
};

const SPARK_COUNT = 30;

function buildSpark(id: number): SparkSpec {
  return {
    id,
    left: `${Math.random() * 100}%`,
    top: `${70 + Math.random() * 20}%`,
    duration: `${10 + Math.random() * 12}s`,
    delay: `${-Math.random() * 14}s`,
    transform: `scale(${0.5 + Math.random() * 1.5})`,
  };
}

/**
 * Sparks — generates 30 drifting embers within a `.sparks` container. Direct
 * port of `design-handoff/project/site/scripts.js` lines 1-14.
 *
 * Each spark is positioned and animated via inline styles; the `.spark` class
 * in `globals.css` owns the actual `drift` keyframe animation.
 *
 * Respects `prefers-reduced-motion`: when reduced motion is requested,
 * the component returns null (nothing renders, no animation cost).
 *
 * Cleanup is automatic: sparks are children of this component's container, so
 * they disappear when the component unmounts.
 */
export function Sparks() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sparks, setSparks] = useState<SparkSpec[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return; // early-return: render null

    const next = Array.from({ length: SPARK_COUNT }, (_, i) => buildSpark(i));
    setSparks(next);
  }, []);

  if (!sparks) return null;

  return (
    <div ref={containerRef} className="sparks" aria-hidden="true">
      {sparks.map((s) => (
        <span
          key={s.id}
          className="spark"
          style={{
            left: s.left,
            top: s.top,
            animationDuration: s.duration,
            animationDelay: s.delay,
            transform: s.transform,
          }}
        />
      ))}
    </div>
  );
}

export default Sparks;
