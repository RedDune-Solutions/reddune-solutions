"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABELS,
  PROJETO_STATUS_FLUXO,
  isProjetoIdeia,
  type Projeto,
  type ProjetoStatus,
} from "@/types/projeto";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  projeto: Projeto;
};

export function EditProjetoActions({ projeto }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [proxOpen, setProxOpen] = useState(false);
  const [proxValue, setProxValue] = useState(projeto.proximaAccao ?? "");
  const [success, setSuccess] = useState<string | null>(null);

  async function submitEdit(
    field: "status" | "proximaAccao",
    newValue: string
  ) {
    setError(null);
    setSuccess(null);
    const res = await safeJsonPost("/api/projetos/edit", {
      projetoId: projeto.id,
      field,
      newValue,
    });
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a actualizar", description: res.error, variant: "destructive" });
      return;
    }
    setSuccess(
      field === "status" ? "Estado actualizado." : "Próxima acção actualizada."
    );
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            Mudar estado
          </Label>
          <Select
            value={isProjetoIdeia(projeto.status) ? undefined : projeto.status}
            onValueChange={(v) => submitEdit("status", v)}
            disabled={pending || isProjetoIdeia(projeto.status)}
          >
            <SelectTrigger className="w-[200px] bg-white/70 border-dune-deep/15 rounded-btn focus:ring-ember">
              <SelectValue placeholder={isProjetoIdeia(projeto.status) ? "— (é uma ideia)" : "Estado"} />
            </SelectTrigger>
            <SelectContent>
              {PROJETO_STATUS_FLUXO.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s as ProjetoStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                className="accent-ember"
                checked={projeto.status === "ideia-interna"}
                onChange={(e) => submitEdit("status", e.target.checked ? "ideia-interna" : "proximo")}
                disabled={pending}
              />
              Ideia interna
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                className="accent-ember"
                checked={projeto.status === "ideia-cliente"}
                onChange={(e) => submitEdit("status", e.target.checked ? "ideia-cliente" : "proximo")}
                disabled={pending}
              />
              Ideia de cliente
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
            Próxima acção
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setProxOpen((v) => !v)}
            disabled={pending}
            className="h-10 rounded-btn bg-white/70 border-dune-deep/15 text-ink-soft hover:text-ember hover:border-ember/30"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            {proxOpen ? "Fechar" : "Editar"}
          </Button>
        </div>
      </div>

      {proxOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitEdit("proximaAccao", proxValue.trim());
            setProxOpen(false);
          }}
          className="rounded-card border border-dune-deep/10 bg-sand-warm/70 p-4 space-y-3 shadow-warm"
        >
          <Label htmlFor="proximaAccao" className="text-sm text-ink-soft">
            Nova próxima acção
          </Label>
          <Input
            id="proximaAccao"
            value={proxValue}
            onChange={(e) => setProxValue(e.target.value)}
            placeholder="Escreve a frase exacta do próximo passo..."
            disabled={pending}
            maxLength={500}
            autoFocus
            className="bg-white/80 border-dune-deep/15 rounded-btn focus-visible:ring-ember"
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={pending}
              className="rounded-btn bg-ink text-cream hover:bg-ember"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="ml-1">Guardar</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setProxOpen(false);
                setProxValue(projeto.proximaAccao ?? "");
              }}
              className="text-ink-soft hover:text-ember"
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="text-xs text-dune bg-dune/10 px-3 py-2 rounded-btn border border-dune/20"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-700 bg-emerald-500/10 px-3 py-2 rounded-btn border border-emerald-500/20">
          {success}
        </p>
      )}
    </div>
  );
}
