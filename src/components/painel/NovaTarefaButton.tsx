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
import type { TarefaPublic } from "@/types/tarefa";

type Props = {
  tarefa?: TarefaPublic;
  label?: string;
  variant?: "primary" | "ghost";
};

export function NovaTarefaButton({ tarefa, label, variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = !!tarefa;

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
          {label ?? (isEdit ? "Editar" : "Nova tarefa")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar tarefa" : "Nova tarefa"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Actualiza os campos desta tarefa." : "Cria uma tarefa nova manualmente."}
          </SheetDescription>
        </SheetHeader>
        <TarefaForm
          tarefa={tarefa}
          onSaved={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
