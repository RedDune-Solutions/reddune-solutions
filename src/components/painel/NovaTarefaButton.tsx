"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TarefaForm } from "./TarefaForm";
import type { Projeto } from "@/types/projeto";
import type { Cliente } from "@/types/cliente";

type Props = {
  projeto?: Projeto;
  clientes?: Cliente[];
  label?: string;
  variant?: "primary" | "ghost";
  /** Controlo externo do sheet (ex.: NovoMenu). Sem esta prop gere o próprio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Esconde o botão trigger — o sheet passa a abrir apenas via `open` controlado. */
  hideTrigger?: boolean;
};

export function NovaTarefaButton({
  projeto,
  clientes = [],
  label,
  variant = "primary",
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const isEdit = !!projeto;

  function setOpen(o: boolean) {
    onOpenChange?.(o);
    if (openProp === undefined) setInternalOpen(o);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button
            type="button"
            className={variant === "primary" ? "btn-primary" : "btn-ghost"}
          >
            {!isEdit && <Plus className="ic" aria-hidden="true" />}
            {label ?? (isEdit ? "Editar" : "Novo projeto")}
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar projeto" : "Novo projeto"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Actualiza os campos deste projeto." : "Cria um projeto novo."}
          </SheetDescription>
        </SheetHeader>
        <TarefaForm
          projeto={projeto}
          clientes={clientes}
          onSaved={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
