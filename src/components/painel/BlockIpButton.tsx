"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Bloqueia um IP (spam). Submissões desse IP passam a ser ignoradas em silêncio. */
export function BlockIpButton({ ip }: { ip: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const block = async () => {
    if (!ip || ip === "unknown") return;
    if (
      !window.confirm(
        `Bloquear o IP ${ip}?\nSubmissões deste IP passam a ser ignoradas.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, action: "block", motivo: "spam (painel)" }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      router.refresh();
    } catch {
      toast({
        title: "Erro a bloquear IP",
        description: `Não foi possível bloquear ${ip}. Tenta de novo.`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!ip || ip === "unknown") return null;

  return (
    <button
      type="button"
      onClick={block}
      disabled={busy}
      title={`Bloquear ${ip}`}
      aria-label={`Bloquear ${ip}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 5,
        borderRadius: 8,
        color: "var(--ink-mute, #8a6f5e)",
        cursor: "pointer",
      }}
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : (
        <Ban size={14} aria-hidden="true" />
      )}
    </button>
  );
}
