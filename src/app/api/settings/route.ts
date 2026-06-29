import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/lib/mongodb/settings";
import { apiOk, withAuth, parseJson } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Campos todos opcionais (perfil pode estar parcialmente preenchido).
 * NIF: só valida formato PT (9 dígitos) quando há algo escrito.
 * logoUrl: URL válido quando presente (aceita vazio para "sem logo").
 */
const companySettingsSchema = z.object({
  nome: z.string().trim().max(300).optional().default(""),
  nif: z
    .string()
    .trim()
    .max(20)
    .optional()
    .default("")
    .refine((v) => v === "" || /^\d{9}$/.test(v), {
      message: "NIF inválido — deve ter 9 dígitos.",
    }),
  email: z.string().trim().max(300).optional().default(""),
  telefone: z.string().trim().max(50).optional().default(""),
  morada: z.string().trim().max(500).optional().default(""),
  logoUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().url().safeParse(v).success, {
      message: "URL do logo inválido.",
    }),
});

export const GET = withAuth(async () => {
  const settings = await getCompanySettings();
  return apiOk(settings);
});

export const PUT = withAuth(async (_session, request) => {
  const parsed = await parseJson(request, companySettingsSchema);
  if (!parsed.ok) return parsed.response;

  const data: CompanySettings = parsed.data;
  await saveCompanySettings(data);
  revalidatePath("/painel/definicoes");
  return apiOk({ ok: true });
});
