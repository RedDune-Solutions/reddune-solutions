"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { token: string; arquivoId?: string; linkId?: string; compact?: boolean };

export function ComentarioForm({ token, arquivoId, linkId, compact }: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  // Honeypot controlado: humanos deixam-no vazio (está escondido); bots que
  // preenchem o campo no DOM são apanhados no servidor. Antes ia "" hardcoded
  // no payload, pelo que o honeypot nunca disparava.
  const [website, setWebsite] = useState("");
  const [estado, setEstado] = useState<"idle" | "sending" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEstado("sending");
    setErro(null);
    try {
      const res = await fetch("/api/portal/comentario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, texto, arquivoId, linkId, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível enviar.");
        setEstado("erro");
        return;
      }
      setTexto("");
      setEstado("ok");
      router.refresh();
    } catch {
      setErro("Não foi possível enviar.");
      setEstado("erro");
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={2000}
        rows={compact ? 2 : 3}
        placeholder="Deixa aqui a tua opinião ou sugestão…"
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d6422a]/40"
      />
      {/* honeypot invisível — humanos não o veem; bots preenchem-no */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={estado === "sending" || !texto.trim()}
          className="rounded-lg bg-[#d6422a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {estado === "sending" ? "A enviar…" : "Enviar comentário"}
        </button>
        {estado === "ok" && <span className="text-sm text-emerald-700">Recebido ✓</span>}
        {erro && <span className="text-sm text-rose-700">{erro}</span>}
      </div>
    </form>
  );
}
