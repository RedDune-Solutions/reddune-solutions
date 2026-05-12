"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type PropsWithChildren,
} from "react";

type Props = PropsWithChildren<{
  /**
   * Element to render. Defaults to `div`.
   */
  as?: ElementType;
  className?: string;
  /**
   * Optional delay (ms) before adding the `.in` class once the element
   * enters the viewport. Useful for staggered reveals.
   */
  delayMs?: number;
}>;

/**
 * Reveal — IntersectionObserver wrapper that toggles a `.reveal` element into
 * its `.in` state once (one-shot). Pairs with the `.reveal` / `.reveal.in` CSS
 * defined in `globals.css` (Oasis design system).
 *
 * Respects `prefers-reduced-motion`: when reduced motion is requested, the
 * element is rendered already in its final state (no observer, no transition).
 */
export function Reveal({
  children,
  as = "div",
  className,
  delayMs = 0,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // Start visible-on-server / reduced-motion friendly. We add `.reveal` only
  // when we know we will actually animate, to avoid the initial-hidden flash
  // when reduced motion is on or JS hasn't booted yet.
  const [animateIn, setAnimateIn] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return; // early-return: stay visible, no observer

    const node = ref.current;
    if (!node) return;

    setEnabled(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (delayMs > 0) {
            window.setTimeout(() => setAnimateIn(true), delayMs);
          } else {
            setAnimateIn(true);
          }
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  const composedClassName = [
    className,
    enabled ? "reveal" : undefined,
    enabled && animateIn ? "in" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(
    as,
    { ref, className: composedClassName || undefined },
    children
  );
}

export default Reveal;
