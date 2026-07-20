"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { Projeto } from "@/types/projeto";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPrazo: string | null;
  defaultPrazoHora: string | null;
  projetos: Projeto[];
};

export function QuickLembreteModal({
  open,
  onOpenChange,
  defaultPrazo,
  defaultPrazoHora,
  projetos,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [prazo, setPrazo] = useState(defaultPrazo ?? "");
  const [prazoHora, setPrazoHora] = useState(defaultPrazoHora ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrazo(defaultPrazo ?? "");
      setPrazoHora(defaultPrazoHora ?? "");
      setTitulo("");
      setError(null);
    }
  }, [open, defaultPrazo, defaultPrazoHora]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !projetoId) {
      setError("Título e projecto obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await safeJsonPost("/api/lembretes/upsert", {
      projetoId,
      titulo: titulo.trim(),
      feita: false,
      prazo: prazo || null,
      prazoHora: prazoHora || null,
      notas: null,
      ordem: 0,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a criar lembrete", description: res.error, variant: "destructive" });
      return;
    }
    onOpenChange(false);
    startTransition(() => router.refresh());
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo lembrete</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="qt-titulo">Título *</Label>
            <Input
              id="qt-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
              maxLength={300}
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1">
            <Label>Projecto *</Label>
            <Select
              value={projetoId || "__none"}
              onValueChange={(v) => setProjetoId(v === "__none" ? "" : v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="— Selecciona projecto —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Selecciona —</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="qt-prazo">Prazo</Label>
              <Input
                id="qt-prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qt-hora">Hora</Label>
              <Input
                id="qt-hora"
                type="time"
                value={prazoHora}
                onChange={(e) => setPrazoHora(e.target.value)}
                disabled={saving || !prazo}
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />}
              Criar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
