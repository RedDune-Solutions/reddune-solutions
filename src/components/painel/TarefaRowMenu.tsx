"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TarefaPublic } from "@/types/tarefa";

type Props = {
  tarefa: TarefaPublic;
};

export function TarefaRowMenu({ tarefa }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: Event) {
    e.preventDefault();
    if (!confirm(`Apagar "${tarefa.titulo}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tarefas/${encodeURIComponent(tarefa.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erro: ${data.error ?? res.status}`);
        return;
      }
      if (pathname.includes(`/tarefas/${tarefa.id}`)) {
        startTransition(() => router.push("/painel/tarefas"));
      } else {
        startTransition(() => router.refresh());
      }
    } finally {
      setBusy(false);
    }
  }

  const isBusy = busy || pending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="Acções"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isBusy}
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Apagar tarefa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
