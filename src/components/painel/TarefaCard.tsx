import Link from "next/link";
import { cn } from "@/lib/utils";
import { CalendarDays, User, ArrowRight } from "lucide-react";
import { InlineStatusSelect } from "./InlineStatusSelect";
import { TarefaRowMenu } from "./TarefaRowMenu";
import { PROJETO_TIPO_LABEL, RESPONSAVEL_LABEL, type Projeto, type ProjetoStatus } from "@/types/projeto";

type Props = {
  projeto: Projeto;
  className?: string;
};

const STATUS_RIBBON: Record<ProjetoStatus, string> = {
  "ideia-interna": "border-l-violet-500",
  "ideia-cliente": "border-l-amber-400",
  proximo: "border-l-ember",
  "em-curso": "border-l-sky-500",
  "aguardando-cliente": "border-l-amber-400",
  "aguardando-encomenda": "border-l-amber-500",
  terminado: "border-l-amber-600",
  fechado: "border-l-emerald-600",
  cancelado: "border-l-slate-300",
};

const STATUS_BG: Record<ProjetoStatus, string> = {
  "ideia-interna": "bg-violet-500/5",
  "ideia-cliente": "bg-amber-400/5",
  proximo: "bg-ember/5",
  "em-curso": "bg-sky-500/5",
  "aguardando-cliente": "bg-amber-400/5",
  "aguardando-encomenda": "bg-amber-500/5",
  terminado: "bg-amber-500/5",
  fechado: "bg-emerald-500/5",
  cancelado: "bg-slate-100/40",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function TarefaCard({ projeto, className }: Props) {
  const prazo = formatDate(projeto.prazo);
  const isPast =
    projeto.prazo && new Date(projeto.prazo) < new Date() && projeto.status !== "fechado";

  return (
    <Link
      href={`/painel/projetos/${projeto.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-dune-deep/10 border-l-4 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-r-dune-deep/20",
        STATUS_RIBBON[projeto.status],
        STATUS_BG[projeto.status],
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <InlineStatusSelect projetoId={projeto.id} status={projeto.status} />
          <TarefaRowMenu projeto={projeto} />
        </div>

        <h3 className="font-display text-base font-semibold leading-snug tracking-tight line-clamp-2 text-ink">
          {projeto.titulo}
        </h3>

        {projeto.proximaAccao && (
          <div className="mt-2.5 rounded-md bg-amber-100/60 border border-amber-300/50 px-3 py-2">
            <p className="text-xs text-amber-900 leading-relaxed flex items-start gap-1.5">
              <ArrowRight
                className="size-3 shrink-0 mt-0.5 text-amber-700"
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="line-clamp-2">{projeto.proximaAccao}</span>
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-mute">
          {projeto.clienteNome && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" aria-hidden="true" />
              <span className="truncate max-w-[140px]">{projeto.clienteNome}</span>
            </span>
          )}
          {prazo && (
            <span
              className={cn(
                "inline-flex items-center gap-1 tabular-nums",
                isPast && "text-rose-500 font-semibold"
              )}
            >
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {prazo}
            </span>
          )}
          {(() => {
            const tagSet = projeto.tipos && projeto.tipos.length > 0
              ? projeto.tipos
              : projeto.tipo
                ? [projeto.tipo]
                : [];
            if (tagSet.length === 0) return null;
            const visible = tagSet.slice(0, 3);
            const overflow = tagSet.length - visible.length;
            return (
              <>
                {visible.map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase tracking-tight bg-black/5 rounded px-1.5 py-0.5">
                    {PROJETO_TIPO_LABEL[t as import("@/types/projeto").ProjetoTipo] ?? t}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-tight bg-black/5 rounded px-1.5 py-0.5">
                    +{overflow}
                  </span>
                )}
              </>
            );
          })()}
          {projeto.hardware && (projeto.hardware.marca || projeto.hardware.modelo) && (
            <span className="text-[10px] font-medium bg-sky-100 text-sky-800 rounded px-1.5 py-0.5">
              {[projeto.hardware.marca, projeto.hardware.modelo].filter(Boolean).join(" ")}
            </span>
          )}
          {projeto.responsavel && (
            <span className={cn(
              "text-[10px] font-semibold rounded px-1.5 py-0.5",
              projeto.responsavel === "eu"         && "bg-blue-100 text-blue-800",
              projeto.responsavel === "cliente"    && "bg-amber-100 text-amber-800",
              projeto.responsavel === "fornecedor" && "bg-purple-100 text-purple-800",
            )}>
              {RESPONSAVEL_LABEL[projeto.responsavel]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
