import { z } from "zod";
import {
  PROJETO_STATUS,
  PROJETO_TIPO,
  PROJETO_RESPONSAVEL,
  PROJETO_LOCAL,
  LINHA_CATEGORIA,
} from "@/types/projeto";

export const linhaSchema = z.object({
  id: z.string().min(1).max(128),
  descricao: z.string().max(300),
  categoria: z.enum(LINHA_CATEGORIA),
  quantidade: z.number().finite().min(0),
  precoUnit: z.number().finite(),
});

export const projetoSchema = z.object({
  id: z.string().min(1).max(128),
  titulo: z.string().min(1).max(300),
  clienteId: z.string().max(128).nullable(),
  clienteNome: z.string().max(300).nullable(),
  proximaAccao: z.string().max(500).nullable(),
  status: z.enum(PROJETO_STATUS),
  tipo: z.enum(PROJETO_TIPO).nullable(),
  responsavel: z.enum(PROJETO_RESPONSAVEL).nullable(),
  prazo: z.string().nullable(),
  dataCriado: z.string().nullable(),
  dataFechado: z.string().nullable(),
  valorEstimado: z.number().finite().nullable(),
  valorPago: z.number().finite().nullable(),
  metodoPagamento: z.string().max(100).nullable(),
  local: z.enum(PROJETO_LOCAL).nullable(),
  notasResumo: z.string().max(500).nullable(),
  bodyMd: z.string().max(50000).nullable(),
  linhas: z.array(linhaSchema).nullable(),
});

export const projetoInputSchema = projetoSchema.partial({ id: true });

export const tarefaSchema = z.object({
  id: z.string().min(1).max(128),
  projetoId: z.string().min(1).max(128),
  titulo: z.string().min(1).max(300),
  feita: z.boolean(),
  prazo: z.string().nullable(),
  notas: z.string().max(1000).nullable(),
  ordem: z.number().int(),
  criadoEm: z.string(),
});

export const tarefaInputSchema = tarefaSchema.partial({ id: true, criadoEm: true });

export const clienteSchema = z.object({
  id: z.string().min(1).max(128),
  nome: z.string().min(1).max(300),
  email: z.string().max(300).nullable(),
  telefone: z.string().max(50).nullable(),
  nif: z.string().max(20).nullable(),
  morada: z.string().max(500).nullable(),
  notas: z.string().max(5000).nullable(),
  criadoEm: z.string(),
});

export const clienteInputSchema = clienteSchema.partial({ id: true, criadoEm: true });

export type ProjetoInput = z.infer<typeof projetoInputSchema>;
export type TarefaInput = z.infer<typeof tarefaInputSchema>;
export type ClienteInput = z.infer<typeof clienteInputSchema>;
