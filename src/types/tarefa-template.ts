import type { ProjetoTipo } from "@/types/projeto";
import type { ServicoSlug } from "@/types/servico";

export interface TarefaTemplateItem {
  titulo: string;
  ordem: number;
}

export interface TarefaTemplate {
  id: string;
  nome: string;
  categoria: ServicoSlug | null;
  tipos: ProjetoTipo[];
  itens: TarefaTemplateItem[];
  criadoEm: string;
}
