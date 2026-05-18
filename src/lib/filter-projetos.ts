import type { Projeto } from "@/types/projeto";

export function applyFilters(
  projetos: Projeto[],
  params: { categoria?: string; status?: string; tipo?: string; clienteNome?: string; q?: string }
): Projeto[] {
  const q = params.q?.trim().toLowerCase() ?? "";
  return projetos.filter((p) => {
    if (params.status && p.status !== params.status) return false;
    if (params.categoria && p.categoria !== params.categoria) return false;
    if (params.tipo && p.tipo !== params.tipo) return false;
    if (params.clienteNome && p.clienteNome !== params.clienteNome) return false;
    if (q) {
      const hay = [
        p.titulo,
        p.clienteNome ?? "",
        p.proximaAccao ?? "",
        p.notasResumo ?? "",
        p.tipo ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
