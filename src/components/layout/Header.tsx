"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Nav } from "@/components/chrome/Nav";

/**
 * Header — skip link + Oasis pill nav (`Nav` / `nav.top`).
 *
 * On `/loja`, the pill slides off when scrolling down past 200px (filter bar
 * clearance) and returns when scrolling up.
 */

const HIDE_THRESHOLD_PX = 200;

export function Header() {
  const pathname = usePathname() ?? "/";
  const [hidden, setHidden] = useState(false);
  const slideUpEnabled = pathname.startsWith("/loja");

  useEffect(() => {
    if (!slideUpEnabled) {
      setHidden(false);
      return;
    }
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      if (goingDown && y > HIDE_THRESHOLD_PX) {
        setHidden(true);
      } else if (!goingDown) {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slideUpEnabled]);

  return (
    <>
      <a
        href="#main"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:left-3 focus:top-3 focus:z-[110]",
          "focus:rounded-btn focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-cream",
          "focus:shadow-warm",
        )}
      >
        Saltar para conteúdo
      </a>
      <header role="banner" className="contents">
        <Nav pillHidden={slideUpEnabled && hidden} />
      </header>
    </>
  );
}
