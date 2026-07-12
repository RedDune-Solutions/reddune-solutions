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
import { ClienteForm } from "./ClienteForm";
import type { Cliente } from "@/types/cliente";

type Props = {
  cliente?: Cliente;
  /** Controlo externo do sheet (ex.: NovoMenu). Sem esta prop gere o próprio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Esconde o botão trigger — o sheet passa a abrir apenas via `open` controlado. */
  hideTrigger?: boolean;
};

export function NovoClienteButton({ cliente, open: openProp, onOpenChange, hideTrigger = false }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const isEdit = !!cliente;

  function setOpen(o: boolean) {
    onOpenChange?.(o);
    if (openProp === undefined) setInternalOpen(o);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button type="button" className={isEdit ? "btn-ghost" : "btn-primary"}>
            {!isEdit && <Plus className="ic" aria-hidden="true" />}
            {isEdit ? "Editar" : "Novo cliente"}
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar cliente" : "Novo cliente"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Actualiza os dados deste cliente." : "Adiciona um novo cliente à base de dados."}
          </SheetDescription>
        </SheetHeader>
        <ClienteForm
          cliente={cliente}
          onSaved={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
