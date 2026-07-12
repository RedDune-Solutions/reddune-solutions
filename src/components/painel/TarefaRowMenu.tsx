"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreVertical, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Projeto } from "@/types/projeto";
import { safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  projeto: Projeto;
  /** "icon-btn" = botão ⋯ do protótipo (ficha do projecto); default = ghost compacto (tabelas). */
  variant?: "default" | "icon-btn";
};

export function TarefaRowMenu({ projeto, variant = "default" }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const pathname = usePathname() ?? "";
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: Event) {
    e.preventDefault();
    const ok = await confirm({
      title: `Apagar "${projeto.titulo}"?`,
      description: "Apaga o projecto e todas as tarefas associadas. Não pode ser desfeito.",
      confirmLabel: "Apagar projecto",
      tone: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    const res = await safeDelete(`/api/projetos/${encodeURIComponent(projeto.id)}`);
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Erro a apagar projecto", description: res.error, variant: "destructive" });
      return;
    }
    if (pathname.includes(`/projetos/${projeto.id}`)) {
      startTransition(() => router.push("/painel/projetos"));
    } else {
      startTransition(() => router.refresh());
    }
  }

  const isBusy = busy || pending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon-btn" ? (
          <button
            type="button"
            className="icon-btn"
            title="Mais ações"
            aria-label="Acções"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="ic animate-spin" aria-hidden="true" />
            ) : (
              <MoreHorizontal className="ic" aria-hidden="true" />
            )}
          </button>
        ) : (
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
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Apagar projeto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
