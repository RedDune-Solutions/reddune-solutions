import { z } from "zod";
import { PROJETO_TIPO } from "@/types/projeto";
import { SERVICO_SLUG } from "@/types/servico";

export const tarefaTemplateItemSchema = z.object({
  titulo: z.string().min(1).max(300),
  ordem: z.number().int().min(0),
});

export const tarefaTemplateSchema = z.object({
  id: z.string().min(1).max(128),
  nome: z.string().min(1).max(200),
  categoria: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(SERVICO_SLUG).nullable()
  ),
  tipos: z.array(z.enum(PROJETO_TIPO)).default([]),
  itens: z.array(tarefaTemplateItemSchema).default([]),
  criadoEm: z.string(),
});

export const tarefaTemplateInputSchema = tarefaTemplateSchema.partial({
  id: true,
  criadoEm: true,
});

export type TarefaTemplateInput = z.infer<typeof tarefaTemplateInputSchema>;
