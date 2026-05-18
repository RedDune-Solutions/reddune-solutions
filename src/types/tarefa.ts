export interface Tarefa {
  id: string;
  projetoId: string;
  titulo: string;
  feita: boolean;
  prazo: string | null;
  prazoHora: string | null;
  notas: string | null;
  ordem: number;
  criadoEm: string;
}
