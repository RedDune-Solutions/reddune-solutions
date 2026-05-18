"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PAINEL_NAV_DEFAULT,
  applyTabOrder,
  readTabOrder,
  writeTabOrder,
  clearTabOrder,
  type PainelNavItem,
} from "@/lib/painel-nav";

export function TabOrderSettings() {
  const [nav, setNav] = useState<PainelNavItem[]>(PAINEL_NAV_DEFAULT);

  useEffect(() => {
    setNav(applyTabOrder(readTabOrder()));
  }, []);

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= nav.length) return;
    const next = [...nav];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setNav(next);
    writeTabOrder(next.map((n) => n.href));
  }

  function reset() {
    clearTabOrder();
    setNav(PAINEL_NAV_DEFAULT);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {nav.map((item, idx) => {
          const { Icon } = item;
          return (
            <li
              key={item.href}
              className="flex items-center gap-3 rounded-md border border-border-strong bg-background px-3 py-2"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="h-7 w-7 p-0"
                  aria-label={`Mover ${item.label} para cima`}
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => move(idx, 1)}
                  disabled={idx === nav.length - 1}
                  className="h-7 w-7 p-0"
                  aria-label={`Mover ${item.label} para baixo`}
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end pt-2">
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Repor ordem inicial
        </Button>
      </div>
    </div>
  );
}
