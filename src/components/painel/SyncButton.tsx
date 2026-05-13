"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setError(null);
    try {
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={pending}
        className="h-9 rounded-btn bg-white/70 border-dune-deep/15 text-ink-soft hover:text-ember hover:border-ember/30"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="ml-1.5">Sincronizar</span>
      </Button>
      {error && (
        <span
          role="alert"
          className="text-xs text-dune max-w-[220px] truncate"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}
