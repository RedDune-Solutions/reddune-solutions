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
  PROJETO_STATUS,
  PROJETO_TIPO,
  type Projeto,
  type ProjetoStatus,
} from "@/types/projeto";

type Props = {
  projetos: Projeto[];
};

const ALL = "__all__";
const ARCHIVED: ProjetoStatus[] = ["fechado", "cancelado"];
const isArchived = (s: ProjetoStatus) => ARCHIVED.includes(s);

const SELECT_TRIGGER_CLASSES =
  "bg-white/70 border-dune-deep/15 rounded-btn focus:ring-ember";

export function FilterBar({ projetos }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const status = params?.get("status") ?? "";
  const tipo = params?.get("tipo") ?? "";
  const clienteNome = params?.get("cliente") ?? "";

  const activos = projetos.filter((p) => !isArchived(p.status));

  const clientes = Array.from(
    new Set(
      activos
        .map((p) => p.clienteNome)
        .filter((c): c is string => Boolean(c && c.length > 0))
    )
  ).sort((a, b) => String(a).localeCompare(String(b), "pt"));

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

  const hasActive = Boolean(status || tipo || clienteNome);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status || ALL} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className={`w-[180px] ${SELECT_TRIGGER_CLASSES}`}>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos estados</SelectItem>
          {PROJETO_STATUS.filter((s) => !isArchived(s)).map((s) => (
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
          {PROJETO_TIPO.map((t) => (
            <SelectItem key={t} value={t} className="capitalize">
              {t.replace("-", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {clientes.length > 0 && (
        <Select value={clienteNome || ALL} onValueChange={(v) => update("cliente", v)}>
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
