"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, MessageSquare, Plus, RefreshCw, Trash2, Globe, FolderUp, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { safeJsonPost, safeFetch } from "@/lib/safe-fetch";
import type { ProjetoLink } from "@/types/projeto";
import type { PortalComentario } from "@/types/portal";

export type SandboxResumo = { id: string; nome: string; entry: string; totalFicheiros: number };

type Props = {
  projetoId: string;
  portalAtivo: boolean;
  links: ProjetoLink[];
  comentarios: PortalComentario[];
  sandboxes: SandboxResumo[];
};

export function PortalSection({ projetoId, portalAtivo, links, comentarios, sandboxes }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [tokenGerado, setTokenGerado] = useState<string | null>(null);
  const [novoLabel, setNovoLabel] = useState("");
  const [novoUrl, setNovoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const zipRef = useRef<HTMLInputElement>(null);

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

  async function uploadZip(file: File) {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast({ title: "Tem de ser um .zip", description: "Comprime a pasta do projeto num ZIP.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projetoId", projetoId);
    fd.append("nome", file.name.replace(/\.zip$/i, ""));
    try {
      const res = await fetch("/api/projetos/sandbox", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast({ title: "Erro ao carregar projeto", description: data.error ?? `HTTP ${res.status}`, variant: "destructive" });
        return;
      }
      toast({ title: "Projeto carregado ✓" });
      router.refresh();
    } catch {
      toast({ title: "Erro de rede ao carregar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function removeSandbox(s: SandboxResumo) {
    const ok = await confirm({
      title: "Remover projeto do sandbox?",
      description: `"${s.nome}" (${s.totalFicheiros} ficheiros) deixa de estar acessível ao cliente.`,
      tone: "destructive",
    });
    if (!ok) return;
    const res = await safeFetch(`/api/projetos/sandbox/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Erro ao remover", description: res.error, variant: "destructive" });
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

      {/* Projetos hospedados (sandbox multi-ficheiro) */}
      <div className="space-y-2 border-t pt-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          <FolderUp className="h-3.5 w-3.5" aria-hidden="true" />
          Projetos hospedados (ZIP → aberto no site)
        </p>
        {sandboxes.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{s.nome}</span>
            <span className="text-xs text-muted-foreground">
              {s.totalFicheiros} fich. · {s.entry}
            </span>
            <a
              href={`/api/portal/sandbox/${s.id}/${s.entry.split("/").map(encodeURIComponent).join("/")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-ink"
              aria-label={`Abrir ${s.nome}`}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Button size="sm" variant="ghost" onClick={() => removeSandbox(s)} aria-label={`Remover ${s.nome}`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <div>
          <input
            ref={zipRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadZip(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => zipRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FolderUp className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {uploading ? "A carregar…" : "Carregar projeto (.zip)"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Comprime a pasta do projeto (index.html + assets) num ZIP. Abre no site sem GitHub. Até 30MB.
          </p>
        </div>
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
