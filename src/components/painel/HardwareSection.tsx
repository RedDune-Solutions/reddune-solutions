"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Cpu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <section className={cn("card", open && "hw-open")}>
      <button
        type="button"
        className="card-label"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
          margin: 0,
          textAlign: "left",
        }}
      >
        <ChevronRight className="ic chev" aria-hidden="true" />
        <Cpu className="ic" aria-hidden="true" />
        Hardware
        {hasData && !open && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-mute)",
              letterSpacing: ".04em",
              textTransform: "none",
            }}
          >
            {[hw.marca, hw.modelo].filter(Boolean).join(" ")}
          </span>
        )}
      </button>

      <div className="hw-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <div className="field">
            <label htmlFor="hw-marca">Marca</label>
            <input
              id="hw-marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
          </div>
          <div className="field">
            <label htmlFor="hw-modelo">Modelo</label>
            <input
              id="hw-modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="hw-serial">Número de série</label>
          <input
            id="hw-serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            maxLength={100}
            disabled={saving}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="hw-aces">Acessórios entregues</label>
          <textarea
            id="hw-aces"
            value={acessorios}
            onChange={(e) => setAcessorios(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="ex: carregador, cabo, mala"
            disabled={saving}
          />
        </div>
        {error && (
          <p style={{ fontSize: 12, color: "var(--ember)", margin: "10px 0 0" }}>{error}</p>
        )}
        {dirty && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" className="btn-primary" onClick={save} disabled={saving}>
              {saving && (
                <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} aria-hidden="true" />
              )}
              Guardar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
