"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, MessageSquare, Plus, RefreshCw, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { safeJsonPost } from "@/lib/safe-fetch";
import type { ProjetoLink } from "@/types/projeto";
import type { PortalComentario } from "@/types/portal";

type Props = {
  projetoId: string;
  portalAtivo: boolean;
  links: ProjetoLink[];
  comentarios: PortalComentario[];
};

export function PortalSection({ projetoId, portalAtivo, links, comentarios }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [tokenGerado, setTokenGerado] = useState<string | null>(null);
  const [novoLabel, setNovoLabel] = useState("");
  const [novoUrl, setNovoUrl] = useState("");

  const naoLidos = comentarios.filter((c) => !c.lidoEm).length;
  const linkCompleto = tokenGerado ? `${window.location.origin}/p/${tokenGerado}` : null;

  async function gerar() {
    if (portalAtivo) {
      const ok = await confirm({
        title: "Regenerar link do portal?",
        description: "O link antigo deixa de funcionar imediatamente.",
        confirmLabel: "Regenerar",
      });
      if (!ok) return;
    }
    setBusy(true);
    const res = await safeJsonPost<{ token: string }>("/api/projetos/portal", {
      projetoId,
      action: "gerar",
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    setTokenGerado(res.data.token);
    router.refresh();
  }

  async function revogar() {
    const ok = await confirm({
      title: "Revogar o link do portal?",
      description: "O cliente deixa de conseguir aceder ao projecto.",
      confirmLabel: "Revogar",
      tone: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    const res = await safeJsonPost("/api/projetos/portal", { projetoId, action: "revogar" });
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    setTokenGerado(null);
    router.refresh();
  }

  async function copiar() {
    if (!linkCompleto) return;
    await navigator.clipboard.writeText(linkCompleto);
    toast({ title: "Link copiado" });
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await safeJsonPost("/api/projetos/links", {
      projetoId,
      action: "add",
      label: novoLabel,
      url: novoUrl,
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    setNovoLabel("");
    setNovoUrl("");
    router.refresh();
  }

  async function removeLink(linkId: string) {
    const res = await safeJsonPost("/api/projetos/links", { projetoId, action: "remove", linkId });
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function marcarLido(comentarioId: string) {
    const res = await safeJsonPost("/api/projetos/comentarios", { comentarioId, projetoId });
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          Portal do cliente
          {naoLidos > 0 && (
            <span className="rounded-full bg-[#d6422a] px-2 py-0.5 text-[10px] font-bold text-white">
              {naoLidos} novo{naoLidos === 1 ? "" : "s"}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={gerar} disabled={busy}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {portalAtivo ? "Regenerar link" : "Gerar link"}
          </Button>
          {portalAtivo && (
            <Button size="sm" variant="outline" onClick={revogar} disabled={busy}>
              Revogar
            </Button>
          )}
        </div>
      </div>

      {tokenGerado && linkCompleto && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-medium text-amber-900">
            Guarda este link agora — só é mostrado uma vez:
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs">
              {linkCompleto}
            </code>
            <Button size="sm" variant="outline" onClick={copiar}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar
            </Button>
          </div>
        </div>
      )}

      {portalAtivo && !tokenGerado && (
        <p className="text-sm text-muted-foreground">
          Portal activo. O link foi mostrado quando o geraste — se o perdeste, regenera (o antigo
          deixa de funcionar).
        </p>
      )}
      {!portalAtivo && !tokenGerado && (
        <p className="text-sm text-muted-foreground">
          Sem portal. Gera um link secreto e envia ao cliente por WhatsApp/email.
        </p>
      )}

      {/* Links de preview */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Links de preview (Vercel/Pages)
        </p>
        {links.map((k) => (
          <div key={k.id} className="flex items-center gap-2 text-sm">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{k.label}</span>
            <a
              href={k.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-muted-foreground hover:underline"
            >
              {k.url}
            </a>
            <Button size="sm" variant="ghost" onClick={() => removeLink(k.id)} aria-label={`Remover ${k.label}`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <form onSubmit={addLink} className="flex flex-wrap items-center gap-2">
          <Input
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            placeholder="Nome (ex.: Protótipo v2)"
            className="h-8 w-44 text-sm"
          />
          <Input
            value={novoUrl}
            onChange={(e) => setNovoUrl(e.target.value)}
            placeholder="https://…"
            className="h-8 min-w-0 flex-1 text-sm"
          />
          <Button size="sm" variant="outline" type="submit" disabled={busy || !novoLabel.trim() || !novoUrl.trim()}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Adicionar
          </Button>
        </form>
      </div>

      {/* Comentários do cliente */}
      {comentarios.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Comentários do cliente
          </p>
          <ul className="space-y-2">
            {comentarios.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg border p-3 text-sm ${
                  c.lidoEm ? "opacity-70" : "border-[#d6422a]/40 bg-[#d6422a]/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.autorNome ?? "Cliente"}</span>
                    {" · "}
                    {new Date(c.criadoEm).toLocaleString("pt-PT")}
                  </p>
                  {!c.lidoEm && (
                    <Button size="sm" variant="ghost" onClick={() => marcarLido(c.id)}>
                      Marcar lido
                    </Button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
