import Link from "next/link";
import {
  History,
  FolderPlus,
  Euro,
  Pencil,
  Inbox,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { requirePainelSession } from "@/lib/painel-auth";
import { getRecentAuditEntries, type AuditEntry } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

type OpFilter = "todos" | "create" | "update" | "delete";

/** Label + verbo (com género) por colecção. Labels completos: leads, settings, etc. */
const COLL_META: Record<
  string,
  { label: string; create: string; update: string; delete: string }
> = {
  projetos: { label: "Projecto", create: "criado", update: "editado", delete: "apagado" },
  clientes: { label: "Cliente", create: "criado", update: "editado", delete: "apagado" },
  lembretes: { label: "Lembrete", create: "criado", update: "editado", delete: "apagado" },
  // legado — entradas de audit anteriores ao rename da colecção tarefas→lembretes
  tarefas: { label: "Lembrete", create: "criado", update: "editado", delete: "apagado" },
  pagamentos: { label: "Pagamento", create: "registado", update: "editado", delete: "apagado" },
  products: { label: "Produto", create: "criado", update: "editado", delete: "apagado" },
  portfolio: { label: "Trabalho", create: "criado", update: "editado", delete: "apagado" },
  servicos: { label: "Serviço", create: "criado", update: "editado", delete: "apagado" },
  leads: { label: "Lead", create: "recebido", update: "editado", delete: "apagado" },
  despesas: { label: "Despesa", create: "registada", update: "editada", delete: "apagada" },
  settings: { label: "Definições", create: "guardadas", update: "guardadas", delete: "repostas" },
  projeto_tipos_custom: { label: "Tipo de serviço", create: "criado", update: "editado", delete: "apagado" },
  blocked_ips: { label: "IP", create: "bloqueado", update: "editado", delete: "desbloqueado" },
};

function acaoLabel(e: AuditEntry): string {
  const meta = COLL_META[e.collection];
  if (!meta) {
    const verbo = e.op === "create" ? "criado" : e.op === "delete" ? "apagado" : "editado";
    return `${e.collection} ${verbo}`;
  }
  return `${meta.label} ${meta[e.op]}`;
}

function logIcon(e: AuditEntry): LucideIcon {
  if (e.op === "delete") return Trash2;
  if (e.collection === "pagamentos") return Euro;
  if (e.collection === "leads") return Inbox;
  if (e.op === "create") return FolderPlus;
  return Pencil;
}

function auditTarget(e: { collection: string; entityId: string; before: unknown; after: unknown }) {
  const pickLabel = (obj: unknown): string | undefined => {
    if (!obj || typeof obj !== "object") return undefined;
    const entry = obj as Record<string, unknown>;
    const maybeString = (value: unknown): string | undefined =>
      typeof value === "string" && value.trim() ? value.trim() : undefined;

    return (
      maybeString(entry.titulo) ||
      maybeString(entry.nome) ||
      maybeString(entry.title) ||
      (typeof entry.name === "string" ? maybeString(entry.name) : undefined) ||
      (typeof entry.title === "object" && entry.title != null
        ? maybeString((entry.title as Record<string, unknown>).pt) || maybeString((entry.title as Record<string, unknown>).en)
        : undefined) ||
      (typeof entry.name === "object" && entry.name != null
        ? maybeString((entry.name as Record<string, unknown>).pt) || maybeString((entry.name as Record<string, unknown>).en)
        : undefined)
    );
  };

  const label = pickLabel(e.after) || pickLabel(e.before) ||
    `${COLL_META[e.collection]?.label ?? e.collection} · ${e.entityId.slice(0, 8)}`;

  const href =
    e.collection === "projetos"
      ? `/painel/projetos/${e.entityId}`
      : e.collection === "clientes"
      ? `/painel/clientes/${e.entityId}`
      : undefined;

  if (href) {
    return <Link href={href}>{label}</Link>;
  }

  return label;
}

/** Tempo relativo curto: "há 2h" · "ontem" · "2 dias" · data. */
function fmtRel(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias`;
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ op?: string }>;
}) {
  await requirePainelSession();

  const [all, params] = await Promise.all([getRecentAuditEntries(200), searchParams]);
  const opFilter: OpFilter =
    params.op === "create" || params.op === "update" || params.op === "delete"
      ? (params.op as OpFilter)
      : "todos";

  const counts = {
    todos: all.length,
    create: all.filter((e) => e.op === "create").length,
    update: all.filter((e) => e.op === "update").length,
    delete: all.filter((e) => e.op === "delete").length,
  };
  const entries = opFilter === "todos" ? all : all.filter((e) => e.op === opFilter);

  const tab = (op: OpFilter, label: string) => (
    <Link
      href={op === "todos" ? "/painel/auditoria" : `/painel/auditoria?op=${op}`}
      className={opFilter === op ? "on" : undefined}
    >
      {label}
      {counts[op] > 0 && <span className="num">{counts[op]}</span>}
    </Link>
  );

  return (
    <>
      <Topbar crumbs={["Auditoria"]} titleHtml="Registo de <em>atividade</em>" />

      <div className="view-tabs" style={{ marginBottom: 18 }}>
        {tab("todos", "Todos")}
        {tab("create", "Criações")}
        {tab("update", "Edições")}
        {tab("delete", "Eliminações")}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <History aria-hidden="true" style={{ width: 22, height: 22, margin: "0 auto 8px" }} />
          <div className="t">Sem alterações registadas</div>
          <div className="desc">As próximas mutações aparecerão aqui.</div>
        </div>
      ) : (
        entries.map((e, i) => {
          const Icon = logIcon(e);
          return (
            <div
              key={`${e.collection}-${e.entityId}-${i}`}
              className="log"
              title={e.userEmail ?? undefined}
            >
              <span className="l-ic">
                <Icon className="ic" aria-hidden="true" />
              </span>
              <div style={{ minWidth: 0 }}>
                <b>{acaoLabel(e)}</b> · {auditTarget(e)}
              </div>
              <span className="when">{fmtRel(e.at)}</span>
            </div>
          );
        })
      )}
    </>
  );
}
