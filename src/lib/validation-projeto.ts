import { z } from "zod";
import {
  PROJETO_STATUS,
  PROJETO_TIPO,
  PROJETO_RESPONSAVEL,
  PROJETO_LOCAL,
  LINHA_CATEGORIA,
} from "@/types/projeto";
import { SERVICO_SLUG } from "@/types/servico";

export const linhaSchema = z.object({
  id: z.string().min(1).max(128),
  descricao: z.string().max(300),
  categoria: z.enum(LINHA_CATEGORIA),
  quantidade: z.number().finite().min(0),
  precoUnit: z.number().finite(),
  gastoEmpresa: z.boolean().optional(),
});

export const projetoSchema = z.object({
  id: z.string().min(1).max(128),
  titulo: z.string().min(1).max(300),
  clienteId: z.string().max(128).nullish().transform((v) => v ?? null),
  clienteNome: z.string().max(300).nullish().transform((v) => v ?? null),
  proximaAccao: z.string().max(500).nullish().transform((v) => v ?? null),
  status: z.enum(PROJETO_STATUS),
  categoria: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(SERVICO_SLUG).nullable()),
  tipo: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(PROJETO_TIPO).nullable()),
  tipos: z.array(z.string()).nullish(),
  hardware: z
    .object({
      marca: z.string().max(100).optional(),
      modelo: z.string().max(100).optional(),
      serial: z.string().max(100).optional(),
      acessoriosEntregues: z.string().max(500).optional(),
    })
    .nullish(),
  responsavel: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(PROJETO_RESPONSAVEL).nullable()),
  prazo: z.string().nullish(),
  dataCriado: z.string().nullish(),
  dataFechado: z.string().nullish(),
  valorEstimado: z.number().finite().nullish(),
  valorPago: z.number().finite().nullish(),
  metodoPagamento: z.string().max(100).nullish(),
  local: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(PROJETO_LOCAL).nullable()),
  notasResumo: z.string().max(500).nullish(),
  bodyMd: z.string().max(50000).nullish(),
  linhas: z.array(linhaSchema).nullish(),
  garantiaAte: z.string().nullish(),
});

export const projetoInputSchema = projetoSchema.partial({ id: true });

export const tarefaSchema = z.object({
  id: z.string().min(1).max(128),
  projetoId: z.string().min(1).max(128),
  titulo: z.string().min(1).max(300),
  feita: z.boolean(),
  prazo: z.string().nullable(),
  prazoHora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullish(),
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
