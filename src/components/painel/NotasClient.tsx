"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Nota } from "@/types/nota";

type Props = {
  notas: Nota[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function NotasClient({ notas }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nota | null>(null);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setTitulo("");
    setCorpo("");
    setOpen(true);
  }

  function openEdit(nota: Nota) {
    setEditing(nota);
    setTitulo(nota.titulo);
    setCorpo(nota.corpo);
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/notas/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          titulo: titulo.trim() || "Sem título",
          corpo,
          criadoEm: editing?.criadoEm,
        }),
      });
      setOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/notas/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {notas.length} nota{notas.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          Nova nota
        </Button>
      </div>

      {notas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Sem notas ainda. Cria a primeira.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notas.map((nota) => (
            <div
              key={nota.id}
              onClick={() => openEdit(nota)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEdit(nota);
                }
              }}
              role="button"
              tabIndex={0}
              className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {nota.titulo}
                </h3>
                <button
                  type="button"
                  onClick={(e) => handleDelete(nota.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
                  aria-label="Apagar nota"
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {nota.corpo || "Sem conteúdo."}
              </p>
              <p className="mt-3 text-[10px] text-muted-foreground/60 font-mono">
                {formatDate(nota.atualizadoEm)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar nota" : "Nova nota"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col gap-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="nota-titulo">Título</Label>
              <Input
                id="nota-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título da nota..."
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="flex-1 flex flex-col space-y-1.5">
              <Label htmlFor="nota-corpo">Conteúdo</Label>
              <textarea
                id="nota-corpo"
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Escreve aqui o conteúdo da nota..."
                className="flex-1 min-h-[300px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Guardar"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
