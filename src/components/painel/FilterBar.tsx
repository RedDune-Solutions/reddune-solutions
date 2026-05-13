"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABELS,
  TAREFA_STATUS,
  TAREFA_TIPO,
  type TarefaPublic,
} from "@/types/tarefa";

type Props = {
  tarefas: TarefaPublic[];
};

const ALL = "__all__";

const SELECT_TRIGGER_CLASSES =
  "bg-white/70 border-dune-deep/15 rounded-btn focus:ring-ember";

export function FilterBar({ tarefas }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const status = params?.get("status") ?? "";
  const tipo = params?.get("tipo") ?? "";
  const cliente = params?.get("cliente") ?? "";

  const clientes = Array.from(
    new Set(
      tarefas
        .map((t) => t.cliente)
        .filter((c): c is string => Boolean(c && c.length > 0))
    )
  ).sort((a, b) => a.localeCompare(b, "pt"));

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params?.toString() ?? "");
      if (value === ALL || !value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const clearAll = useCallback(() => {
    router.replace(pathname ?? "/painel", { scroll: false });
  }, [pathname, router]);

  const hasActive = Boolean(status || tipo || cliente);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status || ALL} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className={`w-[180px] ${SELECT_TRIGGER_CLASSES}`}>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos estados</SelectItem>
          {TAREFA_STATUS.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tipo || ALL} onValueChange={(v) => update("tipo", v)}>
        <SelectTrigger className={`w-[160px] ${SELECT_TRIGGER_CLASSES}`}>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos tipos</SelectItem>
          {TAREFA_TIPO.map((t) => (
            <SelectItem key={t} value={t} className="capitalize">
              {t.replace("-", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {clientes.length > 0 && (
        <Select value={cliente || ALL} onValueChange={(v) => update("cliente", v)}>
          <SelectTrigger className={`w-[200px] ${SELECT_TRIGGER_CLASSES}`}>
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 text-ink-soft hover:text-ember"
        >
          <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export function applyFilters(
  tarefas: TarefaPublic[],
  params: { status?: string; tipo?: string; cliente?: string; q?: string }
): TarefaPublic[] {
  const q = params.q?.trim().toLowerCase() ?? "";
  return tarefas.filter((t) => {
    if (params.status && t.status !== params.status) return false;
    if (params.tipo && t.tipo !== params.tipo) return false;
    if (params.cliente && t.cliente !== params.cliente) return false;
    if (q) {
      const hay = [
        t.titulo,
        t.cliente ?? "",
        t.proximaAccao ?? "",
        t.notasResumo ?? "",
        t.tipo ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
