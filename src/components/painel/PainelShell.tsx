"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

const COLLAPSE_KEY = "painel.sidebar.collapsed";

type Props = {
  user: { name?: string | null; email?: string | null };
  /** Contagens reais para os badges da sidebar/bottom-nav (keyed por href). */
  counts?: Record<string, number>;
  children: ReactNode;
};

/**
 * PainelShell — frame `.app` do protótipo (grid: sidebar 248px + conteúdo).
 * Client component porque o estado "recolhida" da sidebar vive no CSS via
 * `.app.collapsed` (grid-template-columns 72px 1fr) e persiste em localStorage.
 * O `.content` é quem faz o scroll (overflow-y no painel.css) — o body não
 * volta a fazer scroll porque `.app` fica limitado a 100vh de conteúdo.
 */
export function PainelShell({ user, counts, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    setMounted(true);
  }, []);

  // Só aplica depois do mount — evita mismatch de hidratação com localStorage.
  const isCollapsed = mounted && collapsed;

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  return (
    <div className={cn("app", isCollapsed && "collapsed")}>
      <Sidebar
        user={user}
        counts={counts}
        collapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="content">
        <main className="main">{children}</main>
      </div>
      <BottomNav counts={counts} />
    </div>
  );
}
