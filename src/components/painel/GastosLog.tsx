"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { safeDelete } from "@/lib/safe-fetch";
import { DESPESA_CATEGORIA_LABEL } from "@/types/despesa";
import type { GastoEvent } from "@/lib/gastos";
import type { ProjetoOption } from "./DespesaFormSheet";

/** Filtro do log por origem do gasto. */
export type GastoFiltro = "todos" | "linha" | "manual";

type Props = {
  /** Todos os gastos já ordenados e filtrados no servidor. */
  events: GastoEvent[];
  /** Projectos para resolver o título de cada gasto ligado a projecto. */
  projetos: ProjetoOption[];
  /** Filtro activo — o vazio tem de falar da vista, não do log todo. */
  filtro: GastoFiltro;
};

const VAZIO: Record<GastoFiltro, { titulo: string; desc: string }> = {
  todos: {
    titulo: "Sem gastos registados",
    desc: 'Marca linhas de custo como "gasto da empresa" nos projectos ou regista uma despesa manual.',
  },
  linha: {
    titulo: "Sem gastos de projectos",
    desc: 'Marca linhas de custo como "gasto da empresa" na secção Custos de um projecto.',
  },
  manual: {
    titulo: "Sem despesas manuais",
    desc: 'Usa "Registar despesa" para adicionar a primeira — stock, domínios, licenças, marketing…',
  },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function fmtEuro(v: number): string {
  return `${v.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} €`;
}

/**
 * GastosLog — log completo de gastos dos relatórios: despesas manuais E linhas
 * de custo de projecto marcadas `gastoEmpresa`, na mesma tabela.
 * Só as manuais se apagam aqui (têm rota própria); as de linha editam-se na
 * secção Custos do projecto, por isso a linha aponta para lá.
 */
export function GastosLog({ events, projetos, filtro }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  // Ids escondidos optimisticamente enquanto o DELETE corre (repostos em erro).
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const projetoTitulo = new Map(projetos.map((p) => [p.id, p.titulo]));
  const visiveis = events.filter((e) => !hidden.has(e.id));
  // Coluna de acções só existe se houver algo para apagar — as linhas de
  // projecto editam-se no projecto, logo em ?g=linha a coluna seria sempre vazia.
  const temManuais = visiveis.some((e) => e.fonte === "manual");

  async function remove(e: GastoEvent) {
    const ok = await confirm({
      title: "Apagar despesa?",
      description: "Esta acção remove a despesa permanentemente e recalcula os gastos nos relatórios.",
      confirmLabel: "Apagar",
      tone: "destructive",
    });
    if (!ok) return;
    setHidden((prev) => new Set(prev).add(e.id));
    const res = await safeDelete(`/api/despesas/${encodeURIComponent(e.id)}`);
    if (!res.ok) {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(e.id);
        return next;
      });
      toast({ title: "Erro a apagar despesa", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  if (visiveis.length === 0) {
    const vazio = VAZIO[filtro];
    return (
      <div className="empty">
        <div className="t">{vazio.titulo}</div>
        <div className="desc">{vazio.desc}</div>
      </div>
    );
  }

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th className="col-hide-sm">Categoria</th>
          <th className="col-hide-sm">Origem</th>
          <th className="col-hide-sm">Projecto</th>
          <th>Valor</th>
          {temManuais && <th />}
        </tr>
      </thead>
      <tbody>
        {visiveis.map((e) => {
          const titulo = e.projetoId ? projetoTitulo.get(e.projetoId) : null;
          return (
            <tr key={`${e.fonte}-${e.id}`}>
              <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.data)}</td>
              <td className="name">{e.descricao}</td>
              <td className="col-hide-sm muted">{DESPESA_CATEGORIA_LABEL[e.categoria]}</td>
              <td className="col-hide-sm">
                <span className={e.fonte === "linha" ? "pill warm" : "pill mute"}>
                  {e.fonte === "linha" ? "Projecto" : "Manual"}
                </span>
              </td>
              <td className="col-hide-sm muted">
                {e.projetoId ? (
                  <Link href={`/painel/projetos/${e.projetoId}`}>{titulo ?? "Abrir projecto"}</Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="num warn" style={{ whiteSpace: "nowrap" }}>{fmtEuro(e.valor)}</td>
              {temManuais && (
                <td style={{ textAlign: "right" }}>
                  {e.fonte === "manual" ? (
                    <button
                      type="button"
                      onClick={() => remove(e)}
                      className="icon-mini"
                      aria-label={`Apagar despesa ${e.descricao}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  ) : null}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
