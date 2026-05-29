import Link from "next/link";
import { History } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { getRecentAuditEntries } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

type OpFilter = "todos" | "create" | "update" | "delete";

const OP_LABEL: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Apagou",
};


const COLL_LABEL: Record<string, string> = {
  projetos: "Projecto",
  clientes: "Cliente",
  tarefas: "Tarefa",
  pagamentos: "Pagamento",
  products: "Produto",
  portfolio: "Trabalho",
  servicos: "Serviço",
};

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
    `${COLL_LABEL[e.collection] ?? e.collection} · ${e.entityId.slice(0, 8)}`;

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

function fmtDateTime(d: Date): string {
  try {
    return new Date(d).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ op?: string }>;
}) {
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
      className={opFilter === op ? "active" : undefined}
    >
      {label}
      {counts[op] > 0 && <span className="num">{counts[op]}</span>}
    </Link>
  );

  return (
    <>
      <Topbar
        crumbs={["Painel", "Auditoria"]}
        titleHtml={`Auditoria · <em>log de actividade</em>`}
        description={`${all.length} alterações registadas (mais recentes).`}
      />

      <div className="content">
        <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="tabs">
            {tab("todos", "Todos")}
            {tab("create", "Criações")}
            {tab("update", "Edições")}
            {tab("delete", "Eliminações")}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <History aria-hidden="true" />
            </div>
            <div className="t">Sem alterações registadas</div>
            <div className="desc">As próximas mutações aparecerão aqui.</div>
          </div>
        ) : (
          <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Quem</th>
                  <th>Acção</th>
                  <th>Recurso</th>
                  <th>Referência</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={`${e.collection}-${e.entityId}-${i}`}>
                    <td className="num" style={{ whiteSpace: "nowrap", fontSize: 11.5 }}>
                      {fmtDateTime(e.at)}
                    </td>
                    <td style={{ fontSize: 12 }}>{e.userEmail ?? "—"}</td>
                    <td>
                      <span className={`act ${e.op === "create" ? "create" : e.op === "delete" ? "delete" : "edit"} mono`} style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {OP_LABEL[e.op] ?? e.op}
                      </span>
                    </td>
                    <td>{COLL_LABEL[e.collection] ?? e.collection}</td>
                    <td className="mono muted" style={{ fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {auditTarget(e)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
