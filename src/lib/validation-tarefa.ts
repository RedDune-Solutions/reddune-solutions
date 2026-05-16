import { z } from "zod";
import {
  TAREFA_STATUS,
  TAREFA_TIPO,
  TAREFA_RESPONSAVEL,
  TAREFA_PASTA,
  TAREFA_ORIGIN,
  TAREFA_LOCAL,
} from "@/types/tarefa";

export const tarefaSchema = z.object({
  id: z.string().min(1).max(128),
  titulo: z.string().min(1).max(300),
  cliente: z.string().max(300).nullable(),
  proximaAccao: z.string().max(500).nullable(),
  status: z.enum(TAREFA_STATUS),
  tipo: z.enum(TAREFA_TIPO).nullable(),
  responsavel: z.enum(TAREFA_RESPONSAVEL).nullable(),
  prazo: z.string().nullable(),
  dataCriado: z.string().nullable(),
  dataFechado: z.string().nullable().optional(),
  valorEstimado: z.number().finite().nullable(),
  valorPago: z.number().finite().nullable().optional(),
  metodoPagamento: z.string().max(100).nullable().optional(),
  local: z.enum(TAREFA_LOCAL).nullable().optional(),
  notasResumo: z.string().max(500).nullable(),
  bodyMd: z.string().max(50000).nullable().optional(),
  pasta: z.enum(TAREFA_PASTA),
  sourcePath: z.string().min(1).max(500),
  origin: z.enum(TAREFA_ORIGIN).default("obsidian"),
});

export const tarefasPayloadSchema = z.object({
  tarefas: z.array(tarefaSchema).max(2000),
});

export const tarefaManualSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  titulo: z.string().min(1).max(300),
  cliente: z.string().max(300).nullable().optional(),
  proximaAccao: z.string().max(500).nullable().optional(),
  status: z.enum(TAREFA_STATUS),
  tipo: z.enum(TAREFA_TIPO).nullable().optional(),
  responsavel: z.enum(TAREFA_RESPONSAVEL).nullable().optional(),
  prazo: z.string().nullable().optional(),
  dataFechado: z.string().nullable().optional(),
  valorEstimado: z.number().finite().nullable().optional(),
  valorPago: z.number().finite().nullable().optional(),
  metodoPagamento: z.string().max(100).nullable().optional(),
  local: z.enum(TAREFA_LOCAL).nullable().optional(),
  notasResumo: z.string().max(500).nullable().optional(),
  bodyMd: z.string().max(50000).nullable().optional(),
  pasta: z.enum(TAREFA_PASTA),
});

export type TarefaInput = z.infer<typeof tarefaSchema>;
export type TarefasPayload = z.infer<typeof tarefasPayloadSchema>;
export type TarefaManualInput = z.infer<typeof tarefaManualSchema>;
