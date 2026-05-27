"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Cpu, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Projeto } from "@/types/projeto";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  projeto: Projeto;
};

export function HardwareSection({ projeto }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const hw = projeto.hardware ?? {};
  const hasData = !!(hw.marca || hw.modelo || hw.serial || hw.acessoriosEntregues);
  const [open, setOpen] = useState(hasData);
  const [marca, setMarca] = useState(hw.marca ?? "");
  const [modelo, setModelo] = useState(hw.modelo ?? "");
  const [serial, setSerial] = useState(hw.serial ?? "");
  const [acessorios, setAcessorios] = useState(hw.acessoriosEntregues ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    marca !== (hw.marca ?? "") ||
    modelo !== (hw.modelo ?? "") ||
    serial !== (hw.serial ?? "") ||
    acessorios !== (hw.acessoriosEntregues ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    const hardware =
      marca.trim() || modelo.trim() || serial.trim() || acessorios.trim()
        ? {
            marca: marca.trim() || undefined,
            modelo: modelo.trim() || undefined,
            serial: serial.trim() || undefined,
            acessoriosEntregues: acessorios.trim() || undefined,
          }
        : null;
    const res = await safeJsonPost("/api/projetos/upsert", {
      id: projeto.id,
      titulo: projeto.titulo,
      status: projeto.status,
      hardware,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      toast({ title: "Erro a guardar hardware", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2"
      >
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          Hardware
          {hasData && !open && (
            <span className="font-mono text-[10px] normal-case tracking-normal text-foreground/60">
              {[hw.marca, hw.modelo].filter(Boolean).join(" ")}
            </span>
          )}
        </p>
        {dirty && open && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              save();
            }}
            disabled={saving}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />}
            Guardar
          </Button>
        )}
      </button>

      {open && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hw-marca">Marca</Label>
              <Input
                id="hw-marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hw-modelo">Modelo</Label>
              <Input
                id="hw-modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="hw-serial">Número de série</Label>
              <Input
                id="hw-serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="hw-aces">Acessórios entregues</Label>
              <Textarea
                id="hw-aces"
                value={acessorios}
                onChange={(e) => setAcessorios(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="ex: carregador, cabo, mala"
                disabled={saving}
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
