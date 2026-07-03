import { z } from "zod";

export const comentarioSchema = z.object({
  texto: z.string().trim().min(1).max(2000),
  arquivoId: z.string().max(128).nullish(),
  linkId: z.string().max(128).nullish(),
  autorNome: z.string().trim().max(120).nullish(),
});

// Whitelist ESTRITA do que o portal pode escrever no cliente. strictObject →
// qualquer campo extra é rejeitado (nunca chega ao $set). `notas` é interno.
export const clientePatchSchema = z.strictObject({
  nome: z.string().trim().min(1).max(120).optional(),
  email: z.email().max(200).nullable().optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
  morada: z.string().trim().max(300).nullable().optional(),
  nif: z
    .string()
    .trim()
    .regex(/^\d{9}$/)
    .nullable()
    .optional(),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z
    .url()
    .max(500)
    .refine((u) => u.startsWith("https://"), "URL tem de ser https"),
});
