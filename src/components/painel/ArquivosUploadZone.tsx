"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { Upload, X, Loader2, FileText, FileSpreadsheet, ImageIcon, File as FileIcon, Download, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import type { ProjetoArquivo } from "@/types/projeto";

type Props = {
  projetoId: string;
  value: ProjetoArquivo[];
  onChange: (next: ProjetoArquivo[]) => void;
  disabled?: boolean;
};

type Pending = {
  id: string;
  name: string;
  status: "compressing" | "uploading" | "error";
  error?: string;
};

const COMPRESSION_OPTS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.82,
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "text/csv,text/plain";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(tipo: string): LucideIcon {
  if (tipo.startsWith("image/")) return ImageIcon;
  if (tipo === "application/pdf" || tipo === "text/plain") return FileText;
  if (tipo.includes("spreadsheet") || tipo.includes("excel") || tipo === "text/csv") return FileSpreadsheet;
  if (tipo.includes("word")) return FileText;
  return FileIcon;
}

export function ArquivosUploadZone({ projetoId, value, onChange, disabled }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;

      const uploaded: ProjetoArquivo[] = [];

      for (const original of arr) {
        const pid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const isImg = original.type.startsWith("image/");
        setPending((prev) => [...prev, { id: pid, name: original.name, status: isImg ? "compressing" : "uploading" }]);

        try {
          let file = original;
          if (isImg) {
            const compressed = await imageCompression(original, COMPRESSION_OPTS);
            const base = original.name.replace(/\.[^.]+$/, "");
            file = new File([compressed], `${base}.webp`, { type: "image/webp" });
            setPending((prev) => prev.map((p) => (p.id === pid ? { ...p, status: "uploading" } : p)));
          }

          const fd = new FormData();
          fd.append("file", file);
          fd.append("projetoId", projetoId);

          const res = await fetch("/api/projetos/arquivo", { method: "POST", body: fd });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = data.error ?? `HTTP ${res.status}`;
            setPending((prev) => prev.map((p) => (p.id === pid ? { ...p, status: "error", error: msg } : p)));
            toast({ title: `Erro ao carregar ${original.name}`, description: msg, variant: "destructive" });
            continue;
          }

          const data = (await res.json()) as { arquivo: ProjetoArquivo };
          uploaded.push(data.arquivo);
          setPending((prev) => prev.filter((p) => p.id !== pid));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          setPending((prev) => prev.map((p) => (p.id === pid ? { ...p, status: "error", error: msg } : p)));
          toast({ title: `Erro ao processar ${original.name}`, description: msg, variant: "destructive" });
        }
      }

      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    },
    [onChange, value, toast, projetoId]
  );

  function onPick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  async function removeArquivo(arquivo: ProjetoArquivo) {
    setRemovingId(arquivo.id);
    const res = await safeFetch(arquivo.url, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) {
      toast({ title: "Erro ao remover", description: res.error, variant: "destructive" });
      return;
    }
    onChange(value.filter((a) => a.id !== arquivo.id));
  }

  return (
    <div className="space-y-3">
      <div
        onClick={onPick}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          "rounded-md border-2 border-dashed px-4 py-8",
          "text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">
          Arrasta ficheiros ou <span className="text-primary underline">escolhe</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Orçamentos (PDF), documentos ou imagens. Até 10MB. Imagens são comprimidas.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {pending.length > 0 && (
        <ul className="space-y-1.5">
          {pending.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs",
                p.status === "error" ? "border-destructive/40" : "border-border"
              )}
            >
              {p.status !== "error" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <X className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
              )}
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-muted-foreground">
                {p.status === "compressing" ? "A comprimir…" : p.status === "uploading" ? "A enviar…" : p.error ?? "Erro"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <FileIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Sem ficheiros anexados.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {value.map((arquivo) => {
            const Icon = iconFor(arquivo.tipo);
            return (
              <li
                key={arquivo.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{arquivo.nome}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{formatBytes(arquivo.tamanho)}</p>
                </div>
                <a
                  href={arquivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-ink"
                  aria-label={`Abrir ${arquivo.nome}`}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArquivo(arquivo)}
                  disabled={disabled || removingId === arquivo.id}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${arquivo.nome}`}
                >
                  {removingId === arquivo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
