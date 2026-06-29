import { z } from "zod";

/**
 * Validação de entrada para o upsert de produtos da Loja.
 * Espelha o estilo de validation-projeto.ts. NÃO muda o contrato com a BD:
 * os nomes de campo e a shape são exactamente os que a rota já lia do body
 * (name.pt/en, description.pt/en, category.pt/en, condition.pt/en, price,
 * imageUrls, available, featured, id).
 */

// Máximo de imagens por produto (cap defensivo contra payloads abusivos).
export const PRODUCT_IMAGE_CAP = 12;

const localizedText = z.object({
  pt: z.string().max(2000),
  en: z.string().max(2000),
});

export const productInputSchema = z.object({
  // id opcional: presente => update, ausente => create.
  id: z.string().min(1).max(128).optional(),
  // namePt obrigatório não-vazio (após trim). en é opcional (a rota faz fallback para pt).
  name: z.object({
    pt: z.string().trim().min(1, "Nome PT obrigatório").max(300),
    en: z.string().max(300).optional(),
  }),
  description: z
    .object({
      pt: z.string().max(5000).optional(),
      en: z.string().max(5000).optional(),
    })
    .optional(),
  category: localizedText.partial().optional(),
  condition: localizedText.partial().optional(),
  // price: coerce a número finito >= 0. Rejeita negativo / NaN / não numérico.
  price: z.coerce.number().finite().min(0).optional(),
  // imageUrls: array de URLs válidas, com cap. Cada item tem de ser URL.
  imageUrls: z
    .array(z.string().url().max(2000))
    .max(PRODUCT_IMAGE_CAP)
    .optional(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export type ProductInputParsed = z.infer<typeof productInputSchema>;
