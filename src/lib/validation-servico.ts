import { z } from "zod";
import { SERVICO_SLUG } from "@/types/servico";

export const servicoSchema = z.object({
  id: z.string().min(1).max(128),
  slug: z.enum(SERVICO_SLUG),
  titulo: z.string().min(1).max(200),
  descricao: z.string().max(2000).nullish(),
  precoBase: z.number().finite().min(0).nullish(),
  precoTexto: z.string().max(300).nullish(),
  nota: z.string().max(300).nullish(),
  ordem: z.number().int().min(0),
  ativo: z.boolean(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export const servicoInputSchema = servicoSchema.partial({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
  ordem: true,
  ativo: true,
});

export type ServicoInput = z.infer<typeof servicoInputSchema>;
