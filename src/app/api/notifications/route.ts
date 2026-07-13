import { getLeadsNovosRecentes } from "@/lib/mongodb/leads";
import { getRecentAuditEntries } from "@/lib/mongodb/mutation-audit";
import { getComentariosNaoLidosRecentes } from "@/lib/mongodb/portal";
import { getProjetoTitulosByIds } from "@/lib/mongodb/projetos";
import { getDismissedNotifIds } from "@/lib/mongodb/notif-dismissed";
import { SUBJECT_LABELS } from "@/lib/validation";
import { apiOk, apiError, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — feed de notificações in-app (SÓ LEITURA).
 *
 * Não há colecção própria de notificações: o feed é DERIVADO de dados que já
 * existem — leads com estado "novo" + entradas recentes do audit_log. Nada é
 * escrito na base de dados.
 *
 *   { unread: number, items: NotificationItem[] }
 *
 *   unread  = nº de leads por tratar (estado "novo") — o badge do sino.
 *   items   = últimos N leads novos + últimas entradas de auditoria, fundidos
 *             e ordenados por timestamp desc, cada um com href de destino.
 */

// Limites altos nos "por tratar" (lead/comentário) para o badge, calculado a
// partir dos items não-dispensados, ser fiável mesmo com vários pendentes.
const MAX_LEADS = 50;
const MAX_AUDIT = 8;
const MAX_COMENTARIOS = 50;
const MAX_ITEMS = 12;

const OP_VERB: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Apagou",
};

const COLL_LABEL: Record<string, string> = {
  projetos: "projecto",
  clientes: "cliente",
  tarefas: "tarefa",
  pagamentos: "pagamento",
  products: "produto",
  portfolio: "trabalho",
  servicos: "serviço",
  leads: "lead",
};

type NotificationItem = {
  id: string;
  type: "lead" | "audit" | "comment";
  title: string;
  description: string;
  href: string;
  /** ISO 8601 — timestamp do evento, para ordenação/relativos no cliente. */
  timestamp: string;
  /** true = por tratar/novo (lead novo ou comentário por ler); audit = histórico. */
  unread: boolean;
};

/** Extrai um rótulo legível de um documento de auditoria (titulo/nome/title.pt…). */
function pickLabel(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const entry = obj as Record<string, unknown>;
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const nested = (v: unknown): string | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const o = v as Record<string, unknown>;
    return str(o.pt) || str(o.en);
  };
  return (
    str(entry.titulo) ||
    str(entry.nome) ||
    str(entry.title) ||
    str(entry.name) ||
    nested(entry.title) ||
    nested(entry.name)
  );
}

export const GET = withAuth(async () => {
  try {
    const [leads, audit, comentarios, dismissed] = await Promise.all([
      getLeadsNovosRecentes(MAX_LEADS),
      getRecentAuditEntries(MAX_AUDIT),
      getComentariosNaoLidosRecentes(MAX_COMENTARIOS),
      getDismissedNotifIds(),
    ]);

    const titulos = await getProjetoTitulosByIds([
      ...new Set(comentarios.map((c) => c.projetoId)),
    ]);

    const leadItems: NotificationItem[] = leads
      .map((l) => ({
        id: `lead-${l.id}`,
        type: "lead" as const,
        title: `Novo lead · ${l.nome}`,
        description: SUBJECT_LABELS[l.subject] ?? l.subject,
        href: "/painel/leads",
        timestamp: l.criadoEm,
        unread: true,
      }));

    const auditItems: NotificationItem[] = audit.map((e) => {
      const verb = OP_VERB[e.op] ?? e.op;
      const recurso = COLL_LABEL[e.collection] ?? e.collection;
      const label = pickLabel(e.after) || pickLabel(e.before);
      const href =
        e.collection === "projetos"
          ? `/painel/projetos/${e.entityId}`
          : e.collection === "clientes"
          ? `/painel/clientes/${e.entityId}`
          : "/painel/auditoria";
      // id estável (não índice) para o dismiss client-side não trocar de alvo.
      const at = new Date(e.at).getTime();
      return {
        id: `audit-${e.entityId}-${at}`,
        type: "audit" as const,
        title: `${verb} ${recurso}`,
        description: label ?? "—",
        href,
        timestamp: new Date(e.at).toISOString(),
        unread: false,
      };
    });

    const comentarioItems: NotificationItem[] = comentarios.map((c) => ({
      id: `comentario-${c.id}`,
      type: "comment" as const,
      title: `💬 Comentário · ${c.autorNome ?? "Cliente"}`,
      description: titulos[c.projetoId]
        ? `${titulos[c.projetoId]} — ${c.texto}`
        : c.texto,
      href: `/painel/projetos/${c.projetoId}`,
      timestamp: c.criadoEm,
      unread: true,
    }));

    // Esconde os dispensados (global) ANTES de contar/cortar.
    const naoDispensados = [...leadItems, ...auditItems, ...comentarioItems].filter(
      (i) => !dismissed.has(i.id)
    );
    // Badge = por-tratar (unread) que sobram depois de dispensar.
    const unread = naoDispensados.filter((i) => i.unread).length;

    const items = naoDispensados
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, MAX_ITEMS);

    return apiOk(
      { unread, items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return apiError("Internal error", 500);
  }
});
