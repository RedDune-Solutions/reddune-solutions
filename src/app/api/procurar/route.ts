import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllClientes } from "@/lib/mongodb/clientes";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { searchAll, type ProcurarResultados } from "@/lib/procurar";
import { apiOk, apiError, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Máximo de resultados por grupo no dropdown inline da topbar. */
const LIMIT_POR_GRUPO = 6;

const VAZIO: ProcurarResultados = { projetos: [], clientes: [], tarefas: [] };

/**
 * GET /api/procurar?q=… — pesquisa global (projectos + clientes + tarefas)
 * para o dropdown live da GlobalSearch. Sessão obrigatória (withAuth).
 */
export const GET = withAuth(async (_session, request) => {
  try {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return apiOk(VAZIO, { headers: { "Cache-Control": "no-store" } });
    }

    const [projetos, clientes, tarefas] = await Promise.all([
      getAllProjetos(),
      getAllClientes(),
      getAllTarefas(),
    ]);

    const resultados = searchAll(q, projetos, clientes, tarefas, LIMIT_POR_GRUPO);
    return apiOk(resultados, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/procurar error:", error);
    return apiError("Internal error", 500);
  }
});
