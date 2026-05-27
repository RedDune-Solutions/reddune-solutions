"use client";

import { useEffect, useState } from "react";
import { RdLoader } from "./rd-loader";

/**
 * First-paint overlay loader. Shows while React hydrates, fades after first
 * render. Mounted at top of root layout body. Hides itself; no parent needed
 * to control state.
 */
export function RdLoaderFirstPaint() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Pequeno delay para o loader respirar e cobrir hydration jank
    const t = setTimeout(() => setHidden(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden={hidden}
      style={{
        opacity: hidden ? 0 : 1,
        visibility: hidden ? "hidden" : "visible",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <RdLoader variant="page" size={240} />
    </div>
  );
}
