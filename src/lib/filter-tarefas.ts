import type { TarefaPublic } from "@/types/tarefa";

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
