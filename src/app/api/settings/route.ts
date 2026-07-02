import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCompanySettings, saveCompanySettings } from "@/lib/mongodb/settings";
import { apiOk, withAuth, parseJson } from "@/lib/api";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

/**
 * Campos todos opcionais (perfil pode estar parcialmente preenchido).
 * SEM defaults: uma chave ausente fica `undefined` e NÃO é gravada, para que
 * um body parcial não apague os outros campos (ver saveCompanySettings).
 * NIF: só valida formato PT (9 dígitos) quando há algo escrito.
 * logoUrl: URL válido quando presente (aceita vazio para "sem logo").
 */
const companySettingsSchema = z.object({
  nome: z.string().trim().max(300).optional(),
  nif: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((v) => v === undefined || v === "" || /^\d{9}$/.test(v), {
      message: "NIF inválido — deve ter 9 dígitos.",
    }),
  email: z.string().trim().max(300).optional(),
  telefone: z.string().trim().max(50).optional(),
  morada: z.string().trim().max(500).optional(),
  logoUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .refine((v) => v === undefined || v === "" || z.string().url().safeParse(v).success, {
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

  const data = parsed.data;
  await saveCompanySettings(data);

  await logMutation({
    collection: "settings",
    entityId: "company",
    op: "update",
    userEmail: _session.user?.email ?? null,
    after: data,
  });

  revalidatePath("/painel/definicoes");
  return apiOk({ ok: true });
});
