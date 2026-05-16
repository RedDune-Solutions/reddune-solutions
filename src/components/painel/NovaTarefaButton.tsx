"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

export function NovaTarefaButton({ projeto, clientes = [], label, variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = !!projeto;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className={
            variant === "primary"
              ? "rounded-btn bg-ink text-cream hover:bg-ember"
              : "rounded-btn"
          }
          variant={variant === "ghost" ? "ghost" : "default"}
        >
          {!isEdit && <Plus className="h-4 w-4 mr-1" aria-hidden="true" />}
          {label ?? (isEdit ? "Editar" : "Novo projeto")}
        </Button>
      </SheetTrigger>
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
