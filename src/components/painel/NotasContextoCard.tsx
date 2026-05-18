"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Projeto } from "@/types/projeto";

type Props = {
  projeto: Projeto;
};

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NotasContextoCard({ projeto }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [bodyMd, setBodyMd] = useState(projeto.bodyMd ?? "");
  const [adding, setAdding] = useState(false);
  const [novaNota, setNovaNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = bodyMd !== (projeto.bodyMd ?? "");

  async function persist(nextBody: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/projetos/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projeto.id,
          titulo: projeto.titulo,
          status: projeto.status,
          bodyMd: nextBody || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `HTTP ${res.status}`);
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    await persist(bodyMd);
  }

  async function appendNota() {
    const txt = novaNota.trim();
    if (!txt) {
      setAdding(false);
      return;
    }
    const stamp = timestamp();
    const sep = bodyMd ? "\n\n" : "";
    const next = `${bodyMd}${sep}## ${stamp}\n${txt}`;
    setBodyMd(next);
    const ok = await persist(next);
    if (ok) {
      setNovaNota("");
      setAdding(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Notas / Contexto
        </p>
        <div className="flex items-center gap-2">
          {!adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)} disabled={saving}>
              <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Adicionar nota
            </Button>
          )}
          {dirty && !adding && (
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <Textarea
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            rows={3}
            placeholder="Nova nota… (timestamp adicionado automaticamente)"
            disabled={saving}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNovaNota("");
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={appendNota} disabled={saving || !novaNota.trim()}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />}
              Acrescentar
            </Button>
          </div>
        </div>
      )}

      <Textarea
        value={bodyMd}
        onChange={(e) => setBodyMd(e.target.value)}
        rows={8}
        placeholder="Markdown livre — contexto, decisões, histórico…"
        className="font-mono text-xs"
        disabled={saving}
      />

      {error && (
        <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
          {error}
        </p>
      )}
    </section>
  );
}
