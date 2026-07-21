export interface Lembrete {
  id: string;
  projetoId: string;
  titulo: string;
  feita: boolean;
  prazo: string | null;
  prazoHora: string | null;
  notas: string | null;
  ordem: number;
  criadoEm: string;
  // ISO de quando `feita` passou a true; null quando desmarcada. Carimbado no
  // SERVIDOR (api/lembretes/edit) — o cliente nunca envia este campo. Alimenta
  // a secção "Resolvido (últimas 48h)" do resumo matinal (/api/brief).
  // Lembretes concluídos antes de 2026-07-21 não têm carimbo.
  feitaEm?: string | null;
}
