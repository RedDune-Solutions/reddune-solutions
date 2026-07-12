"use client";

import { useState, type ReactNode } from "react";

type Props = { projeto: ReactNode; dados?: ReactNode };

/**
 * Tabs do cartão principal do portal (Projeto / Os seus dados). Os dois painéis
 * ficam empilhados na mesma célula da grelha (o inativo só fica invisible) para
 * o cartão manter altura constante ao trocar de tab — requisito do design.
 */
export function PortalTabs({ projeto, dados }: Props) {
  const [ativa, setAtiva] = useState<"projeto" | "dados">("projeto");

  if (dados === undefined) return <>{projeto}</>;

  const tabs = [
    { id: "projeto" as const, label: "Projeto", painel: projeto },
    { id: "dados" as const, label: "Os seus dados", painel: dados },
  ];

  return (
    <div>
      <div
        role="tablist"
        className="mb-5 inline-flex gap-1 rounded-full bg-[rgba(90,14,14,0.07)] p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={ativa === t.id}
            aria-controls={`painel-${t.id}`}
            onClick={() => setAtiva(t.id)}
            className={`rounded-full px-[18px] py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors [transition-duration:350ms] ease-oasis ${
              ativa === t.id
                ? "bg-white text-ember shadow-[0_2px_10px_rgba(90,14,14,0.10)]"
                : "text-ink-mute hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid">
        {tabs.map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`painel-${t.id}`}
            aria-labelledby={`tab-${t.id}`}
            className={`col-start-1 row-start-1 ${ativa === t.id ? "visible" : "invisible"}`}
          >
            {t.painel}
          </div>
        ))}
      </div>
    </div>
  );
}
