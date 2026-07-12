"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import {
  PAINEL_NAV_DEFAULT,
  applyTabOrder,
  readTabOrder,
  writeTabOrder,
  clearTabOrder,
  type PainelNavItem,
} from "@/lib/painel-nav";

const moveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 1,
  borderRadius: 4,
  background: "none",
  border: 0,
  color: "inherit",
  cursor: "pointer",
};

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
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {nav.map((item, idx) => {
          const { Icon } = item;
          return (
            <span key={item.href} className="chip">
              <Icon className="ic" aria-hidden="true" style={{ width: 13, height: 13 }} />
              {item.label}
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                style={{ ...moveBtnStyle, opacity: idx === 0 ? 0.35 : 1 }}
                aria-label={`Mover ${item.label} para trás`}
              >
                <ChevronUp size={12} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === nav.length - 1}
                style={{ ...moveBtnStyle, opacity: idx === nav.length - 1 ? 0.35 : 1 }}
                aria-label={`Mover ${item.label} para a frente`}
              >
                <ChevronDown size={12} aria-hidden="true" />
              </button>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-ghost" onClick={reset}>
          <RotateCcw aria-hidden="true" style={{ width: 14, height: 14 }} />
          Repor ordem inicial
        </button>
      </div>
    </>
  );
}
