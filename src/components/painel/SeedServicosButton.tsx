"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeedServicosButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/migrate-servicos", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      setDone(`${j.total} serviços importados.`);
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        Ainda não há serviços na base de dados. Importa os preços actuais das páginas públicas.
      </p>
      {done ? (
        <p className="text-sm font-medium text-emerald-600">{done}</p>
      ) : (
        <Button onClick={seed} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          ) : (
            <DatabaseZap className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          Popular com dados actuais
        </Button>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
