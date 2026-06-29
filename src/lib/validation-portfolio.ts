import { z } from "zod";

/**
 * Validação de entrada para o upsert de itens do portfolio.
 * Espelha o estilo de validation-projeto.ts. NÃO muda o contrato com a BD:
 * nomes de campo e shape iguais aos que a rota já lia do body
 * (title.pt/en, imageUrl, url, categoria, destaqueLanding, id).
 *
 * Nota: a categoria continua a ser validada na rota contra SERVICO_SLUG
 * (qualquer valor inválido vira null lá, comportamento que se mantém).
 */

export const PORTFOLIO_IMAGE_CAP = 1;

export const portfolioInputSchema = z.object({
  // id opcional: presente => update, ausente => create.
  id: z.string().min(1).max(128).optional(),
  // titlePt obrigatório não-vazio (após trim). en opcional (rota faz fallback para pt).
  title: z.object({
    pt: z.string().trim().min(1, "Título PT obrigatório").max(300),
    en: z.string().max(300).optional(),
  }),
  // imageUrl opcional; se presente e não-vazio tem de ser URL válida.
  imageUrl: z
    .string()
    .max(2000)
    .refine((v) => v === "" || z.string().url().safeParse(v).success, {
      message: "imageUrl inválido",
    })
    .optional(),
  // url opcional; se presente e não-vazio tem de ser URL válida.
  url: z
    .string()
    .max(2000)
    .refine((v) => v === "" || z.string().url().safeParse(v).success, {
      message: "url inválido",
    })
    .optional(),
  // Validada com profundidade na rota (SERVICO_SLUG -> null se inválido). Aqui
  // só limitamos o tipo/tamanho para não rebentar o parse.
  categoria: z.string().max(128).nullish(),
  destaqueLanding: z.boolean().optional(),
});

export type PortfolioInputParsed = z.infer<typeof portfolioInputSchema>;
