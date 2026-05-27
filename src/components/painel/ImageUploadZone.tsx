"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Upload, X, ArrowUp, ArrowDown, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeJsonPost } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Limita número máximo de imagens. Sem limite se omitido. */
  max?: number;
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

export function ImageUploadZone({ value, onChange, disabled, max }: Props) {
  const atLimit = typeof max === "number" && value.length >= max;
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      let arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) {
        toast({
          title: "Sem imagens válidas",
          description: "Só ficheiros de imagem são aceites.",
          variant: "destructive",
        });
        return;
      }

      // Respeita limite máximo — descarta extras com aviso.
      if (typeof max === "number") {
        const slotsLeft = Math.max(0, max - value.length);
        if (slotsLeft === 0) {
          toast({
            title: `Limite atingido (${max})`,
            description: "Remove uma imagem antes de adicionar outra.",
            variant: "destructive",
          });
          return;
        }
        if (arr.length > slotsLeft) {
          toast({
            title: `Apenas ${slotsLeft} imagem(ns) vão ser adicionadas`,
            description: `Limite máximo é ${max}.`,
          });
          arr = arr.slice(0, slotsLeft);
        }
      }

      const uploadedUrls: string[] = [];

      for (const file of arr) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setPending((prev) => [...prev, { id, name: file.name, status: "compressing" }]);

        try {
          const compressed = await imageCompression(file, COMPRESSION_OPTS);
          setPending((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "uploading" } : p))
          );

          const form = new FormData();
          // Garante extensão consistente após compressão WebP
          const renamed = new File([compressed], `image.webp`, { type: "image/webp" });
          form.append("file", renamed);

          const res = await fetch("/api/upload/product-image", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = data.error ?? `HTTP ${res.status}`;
            setPending((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: "error", error: msg } : p))
            );
            toast({
              title: `Erro ao carregar ${file.name}`,
              description: msg,
              variant: "destructive",
            });
            continue;
          }

          const data = (await res.json()) as { url: string };
          uploadedUrls.push(data.url);
          setPending((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          setPending((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "error", error: msg } : p))
          );
          toast({
            title: `Erro ao processar ${file.name}`,
            description: msg,
            variant: "destructive",
          });
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
    },
    [onChange, value, toast, max]
  );

  function onPick() {
    if (disabled || atLimit) return;
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ""; // permite repetir mesmo ficheiro
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function removeAt(idx: number) {
    const url = value[idx]!;
    onChange(value.filter((_, i) => i !== idx));
    // Best-effort cleanup do blob
    await safeJsonPost("/api/upload/product-image/delete", { url }).catch(() => null);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div
        onClick={onPick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
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
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:bg-muted/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">
          Arrasta imagens ou <span className="text-primary underline">escolhe ficheiros</span>
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP. Comprime automaticamente para WebP até 1600px.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
                {p.status === "compressing"
                  ? "A comprimir…"
                  : p.status === "uploading"
                    ? "A enviar…"
                    : p.error ?? "Erro"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Sem imagens. Adiciona pelo menos uma.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {value.map((url, idx) => (
            <li
              key={`${url}-${idx}`}
              className="group relative rounded-md border border-border bg-muted overflow-hidden"
            >
              <div className="relative aspect-square">
                <Image
                  src={url}
                  alt={`Imagem ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 200px"
                  unoptimized
                />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 text-[10px] font-mono uppercase tracking-wide bg-ink/80 text-cream px-1.5 py-0.5 rounded">
                    Capa
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5 bg-card">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={disabled || idx === 0}
                    aria-label="Mover para cima"
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={disabled || idx === value.length - 1}
                    aria-label="Mover para baixo"
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAt(idx)}
                  disabled={disabled}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remover imagem"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
