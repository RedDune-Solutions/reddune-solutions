import { getLeadsNovosRecentes } from "@/lib/mongodb/leads";
import { getComentariosNaoLidosRecentes } from "@/lib/mongodb/portal";
import { getProjetoTitulosByIds } from "@/lib/mongodb/projetos";
import { getDismissedNotifIds } from "@/lib/mongodb/notif-dismissed";
import { SUBJECT_LABELS } from "@/lib/validation";
import { apiOk, apiError, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — feed de notificações in-app (SÓ LEITURA).
 *
 * Só coisas ACCIONÁVEIS: leads por tratar (estado "novo") + comentários do
 * portal por ler. As edições/actividade (audit_log) NÃO entram — isso é para a
 * página de Auditoria, não para notificações. Nada é escrito na BD; as
 * dispensadas (colecção notif_dismissidas) são filtradas.
 *
 *   { unread: number, items: NotificationItem[] }
 */

const MAX_LEADS = 50;
const MAX_COMENTARIOS = 50;
const MAX_ITEMS = 20;

type NotificationItem = {
  id: string;
  type: "lead" | "comment";
  title: string;
  description: string;
  href: string;
  /** ISO 8601 — timestamp do evento, para ordenação/relativos no cliente. */
  timestamp: string;
  /** true = por tratar/novo (todos os items deste feed são accionáveis). */
  unread: boolean;
};

export const GET = withAuth(async () => {
  try {
    const [leads, comentarios, dismissed] = await Promise.all([
      getLeadsNovosRecentes(MAX_LEADS),
      getComentariosNaoLidosRecentes(MAX_COMENTARIOS),
      getDismissedNotifIds(),
    ]);

    const titulos = await getProjetoTitulosByIds([
      ...new Set(comentarios.map((c) => c.projetoId)),
    ]);

    const leadItems: NotificationItem[] = leads.map((l) => ({
      id: `lead-${l.id}`,
      type: "lead" as const,
      title: `Novo lead · ${l.nome}`,
      description: SUBJECT_LABELS[l.subject] ?? l.subject,
      href: "/painel/leads",
      timestamp: l.criadoEm,
      unread: true,
    }));

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
    const naoDispensados = [...leadItems, ...comentarioItems].filter(
      (i) => !dismissed.has(i.id)
    );
    const unread = naoDispensados.filter((i) => i.unread).length;

    const items = naoDispensados
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, MAX_ITEMS);

    return apiOk({ unread, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return apiError("Internal error", 500);
  }
});
