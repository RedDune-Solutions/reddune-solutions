"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import {
  PAINEL_NAV_DEFAULT,
  PAINEL_CATEGORIAS,
  applyTabOrder,
  groupByCategoria,
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

  // Move só DENTRO da categoria (o alvo tem de ser da mesma categoria).
  function move(item: PainelNavItem, dir: -1 | 1) {
    const idx = nav.findIndex((n) => n.href === item.href);
    const target = idx + dir;
    if (target < 0 || target >= nav.length) return;
    if (nav[target]!.category !== item.category) return; // limite da categoria
    const next = [...nav];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    const regrouped = groupByCategoria(next);
    setNav(regrouped);
    writeTabOrder(regrouped.map((n) => n.href));
  }

  function reset() {
    clearTabOrder();
    setNav(groupByCategoria(PAINEL_NAV_DEFAULT));
  }

  return (
    <>
      <div className="space-y-3">
        {PAINEL_CATEGORIAS.map((cat) => {
          const itens = nav.filter((n) => n.category === cat.id);
          if (itens.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="plabel">{cat.label}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {itens.map((item, i) => {
                  const { Icon } = item;
                  return (
                    <span key={item.href} className="chip">
                      <Icon className="ic" aria-hidden="true" style={{ width: 13, height: 13 }} />
                      {item.label}
                      <button
                        type="button"
                        onClick={() => move(item, -1)}
                        disabled={i === 0}
                        style={{ ...moveBtnStyle, opacity: i === 0 ? 0.35 : 1 }}
                        aria-label={`Mover ${item.label} para trás`}
                      >
                        <ChevronUp size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(item, 1)}
                        disabled={i === itens.length - 1}
                        style={{ ...moveBtnStyle, opacity: i === itens.length - 1 ? 0.35 : 1 }}
                        aria-label={`Mover ${item.label} para a frente`}
                      >
                        <ChevronDown size={12} aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
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
