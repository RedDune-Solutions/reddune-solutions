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
import { ClienteForm } from "./ClienteForm";
import type { Cliente } from "@/types/cliente";

type Props = {
  cliente?: Cliente;
};

export function NovoClienteButton({ cliente }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = !!cliente;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="rounded-btn bg-ink text-cream hover:bg-ember">
          {!isEdit && <Plus className="h-4 w-4 mr-1" aria-hidden="true" />}
          {isEdit ? "Editar" : "Novo cliente"}
        </Button>
      </SheetTrigger>
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
