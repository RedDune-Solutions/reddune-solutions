export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  nif: string | null;
  morada: string | null;
  notas: string | null;
  criadoEm: string;
}
