"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { token: string; arquivoId?: string; linkId?: string; sandboxId?: string; compact?: boolean };

export function ComentarioForm({ token, arquivoId, linkId, sandboxId, compact }: Props) {
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
        body: JSON.stringify({ t: token, texto, arquivoId, linkId, sandboxId, website }),
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
    <form onSubmit={enviar} className="flex flex-col gap-2.5">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={2000}
        rows={compact ? 2 : 3}
        placeholder="Deixe aqui a sua opinião ou sugestão…"
        className="w-full resize-y rounded-[12px] border border-[rgba(90,14,14,0.12)] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-300 ease-oasis placeholder:text-ink-mute focus:border-ember focus:shadow-[0_0_0_3px_rgba(214,66,42,0.14)]"
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
      <div className="flex items-center gap-3.5">
        <button
          type="submit"
          disabled={estado === "sending" || !texto.trim()}
          className="rounded-full bg-ink px-[26px] py-3 text-sm font-semibold leading-[1.2] text-cream transition duration-[350ms] ease-oasis hover:-translate-y-0.5 hover:bg-ember hover:shadow-[0_14px_36px_rgba(214,66,42,0.36)] disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink disabled:hover:shadow-none"
        >
          {estado === "sending" ? "A enviar…" : "Enviar comentário"}
        </button>
        {estado === "ok" && <span className="text-sm font-semibold text-ember">Recebido ✓</span>}
        {erro && <span className="text-sm text-dune">{erro}</span>}
      </div>
    </form>
  );
}
