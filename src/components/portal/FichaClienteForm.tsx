"use client";

import { useState } from "react";
import type { PortalClienteDTO } from "@/lib/portal-dto";

type Props = { token: string; cliente: PortalClienteDTO };

const CAMPOS: { key: keyof PortalClienteDTO; label: string; type?: string; placeholder: string }[] = [
  { key: "nome", label: "Nome", placeholder: "O teu nome" },
  { key: "email", label: "Email", type: "email", placeholder: "email@exemplo.pt" },
  { key: "telefone", label: "Telemóvel", type: "tel", placeholder: "9xx xxx xxx" },
  { key: "morada", label: "Morada", placeholder: "Rua, nº, código postal, localidade" },
  { key: "nif", label: "NIF", placeholder: "Para factura (9 dígitos)" },
];

export function FichaClienteForm({ token, cliente }: Props) {
  const [dados, setDados] = useState<PortalClienteDTO>(cliente);
  const [guardado, setGuardado] = useState<PortalClienteDTO>(cliente);
  const [estado, setEstado] = useState<"idle" | "saving" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("saving");
    setErro(null);
    const patch: Record<string, string | null> = {};
    for (const { key } of CAMPOS) {
      const v = (dados[key] ?? "").toString().trim();
      const original = (guardado[key] ?? "").toString().trim();
      if (v !== original) patch[key] = key === "nome" ? v || original : v || null;
    }
    if (Object.keys(patch).length === 0) {
      setEstado("idle");
      return;
    }
    try {
      const res = await fetch("/api/portal/cliente", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, dados: patch }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        cliente?: PortalClienteDTO;
      };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível guardar.");
        setEstado("erro");
        return;
      }
      if (data.cliente) {
        setDados(data.cliente);
        setGuardado(data.cliente);
      }
      setEstado("ok");
    } catch {
      setErro("Não foi possível guardar.");
      setEstado("erro");
    }
  }

  return (
    <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
      {CAMPOS.map(({ key, label, type, placeholder }) => (
        <label key={key} className={key === "morada" ? "sm:col-span-2" : ""}>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
            {!(dados[key] ?? "").toString().trim() && (
              <span className="ml-2 font-normal normal-case tracking-normal text-[#d6422a]">
                por preencher
              </span>
            )}
          </span>
          <input
            type={type ?? "text"}
            value={dados[key] ?? ""}
            onChange={(e) => setDados((d) => ({ ...d, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d6422a]/40"
          />
        </label>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={estado === "saving"}
          className="rounded-lg border border-[#d6422a] px-4 py-2 text-sm font-semibold text-[#d6422a] hover:bg-[#d6422a]/5 disabled:opacity-50"
        >
          {estado === "saving" ? "A guardar…" : "Guardar os meus dados"}
        </button>
        {estado === "ok" && <span className="text-sm text-emerald-700">Guardado ✓</span>}
        {erro && <span className="text-sm text-rose-700">{erro}</span>}
      </div>
    </form>
  );
}
