"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, FolderKanban, UserPlus, ListChecks, Receipt } from "lucide-react";
import { NovaTarefaButton } from "./NovaTarefaButton";
import { NovoClienteButton } from "./NovoClienteButton";
import { NovaTarefaGlobalButton } from "./NovaTarefaGlobalButton";
import { DespesaFormSheet } from "./DespesaFormSheet";
import type { Projeto } from "@/types/projeto";
import type { Cliente } from "@/types/cliente";

type Props = {
  projetos: Projeto[];
  clientes: Cliente[];
};

/**
 * Botão "Novo" do dashboard — dropdown com 4 acções (Novo projeto / Novo
 * cliente / Nova tarefa / Nova despesa). Reutiliza os sheets existentes em modo controlado
 * (`open` + `hideTrigger`), por isso os formulários são exactamente os de
 * produção. Fecha ao clicar fora e com Escape. Classes .novo-menu/.novo-pop
 * já existem em painel.css (handoff 2026-07).
 */
export function NovoMenu({ projetos, clientes }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [projetoOpen, setProjetoOpen] = useState(false);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tarefaOpen, setTarefaOpen] = useState(false);
  const [despesaOpen, setDespesaOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Mesma ordem do select de projecto dos relatórios: mais recentes primeiro.
  const projetoOptions = useMemo(
    () =>
      [...projetos]
        .sort((a, b) => (b.dataCriado ?? "").localeCompare(a.dataCriado ?? ""))
        .map((p) => ({ id: p.id, titulo: p.titulo })),
    [projetos]
  );

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function pick(openSheet: (o: boolean) => void) {
    setMenuOpen(false);
    openSheet(true);
  }

  return (
    <div className="novo-menu" ref={rootRef}>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <Plus className="ic" aria-hidden="true" />
        Novo
      </button>

      {menuOpen && (
        <div className="novo-pop" role="menu" aria-label="Criar novo">
          <button type="button" role="menuitem" onClick={() => pick(setProjetoOpen)}>
            <FolderKanban className="ic" aria-hidden="true" />
            Novo projeto
          </button>
          <button type="button" role="menuitem" onClick={() => pick(setClienteOpen)}>
            <UserPlus className="ic" aria-hidden="true" />
            Novo cliente
          </button>
          <button type="button" role="menuitem" onClick={() => pick(setTarefaOpen)}>
            <ListChecks className="ic" aria-hidden="true" />
            Nova tarefa
          </button>
          <button type="button" role="menuitem" onClick={() => pick(setDespesaOpen)}>
            <Receipt className="ic" aria-hidden="true" />
            Nova despesa
          </button>
        </div>
      )}

      {/* Sheets existentes em modo controlado, sem trigger próprio */}
      <NovaTarefaButton clientes={clientes} open={projetoOpen} onOpenChange={setProjetoOpen} hideTrigger />
      <NovoClienteButton open={clienteOpen} onOpenChange={setClienteOpen} hideTrigger />
      <NovaTarefaGlobalButton projetos={projetos} open={tarefaOpen} onOpenChange={setTarefaOpen} hideTrigger />
      <DespesaFormSheet projetos={projetoOptions} open={despesaOpen} onOpenChange={setDespesaOpen} hideTrigger />
    </div>
  );
}
