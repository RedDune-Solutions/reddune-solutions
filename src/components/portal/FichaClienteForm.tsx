"use client";

import { useState } from "react";
import type { PortalClienteDTO } from "@/lib/portal-dto";

type Props = { token: string; cliente: PortalClienteDTO };

// Ordem = layout da grelha (≥600px, 3 colunas): Nome · Email · Telemóvel /
// NIF · Morada (span 2) / botão (span total).
const CAMPOS: { key: keyof PortalClienteDTO; label: string; type?: string; placeholder: string }[] = [
  { key: "nome", label: "Nome", placeholder: "O seu nome" },
  { key: "email", label: "Email", type: "email", placeholder: "email@exemplo.pt" },
  { key: "telefone", label: "Telemóvel", type: "tel", placeholder: "9xx xxx xxx" },
  { key: "nif", label: "NIF", placeholder: "Para fatura (9 dígitos)" },
  { key: "morada", label: "Morada", placeholder: "Rua, nº, código postal, localidade" },
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
    <form onSubmit={guardar} className="grid gap-3 min-[600px]:grid-cols-3">
      {CAMPOS.map(({ key, label, type, placeholder }) => (
        <label key={key} className={key === "morada" ? "min-[600px]:col-span-2" : ""}>
          <span className="mb-[5px] block font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {label}
            {!(dados[key] ?? "").toString().trim() && (
              <span className="ml-2 font-serif text-[12.5px] font-medium normal-case italic tracking-normal text-ember">
                por preencher
              </span>
            )}
          </span>
          <input
            type={type ?? "text"}
            value={dados[key] ?? ""}
            onChange={(e) => setDados((d) => ({ ...d, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-[12px] border border-[rgba(90,14,14,0.12)] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-300 ease-oasis placeholder:text-ink-mute focus:border-ember focus:shadow-[0_0_0_3px_rgba(214,66,42,0.14)]"
          />
        </label>
      ))}
      <div className="flex items-center gap-3.5 min-[600px]:col-span-3">
        <button
          type="submit"
          disabled={estado === "saving"}
          className="rounded-full border border-ember bg-transparent px-[26px] py-3 text-sm font-semibold leading-[1.2] text-ember transition [transition-duration:350ms] ease-oasis hover:-translate-y-0.5 hover:bg-[rgba(214,66,42,0.06)] disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-transparent"
        >
          {estado === "saving" ? "A guardar…" : "Guardar os meus dados"}
        </button>
        {estado === "ok" && <span className="text-sm font-semibold text-ember">Guardado ✓</span>}
        {erro && <span className="text-sm text-dune">{erro}</span>}
      </div>
    </form>
  );
}
