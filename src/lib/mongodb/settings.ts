import "server-only";
import { getDb } from "./client";

const COLLECTION = "settings";
const COMPANY_ID = "company";

/**
 * Perfil da empresa (doc único id:"company" na colecção `settings`).
 * Colecção nova e aditiva — não interage com nenhuma colecção existente.
 */
export type CompanySettings = {
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  morada: string;
  logoUrl?: string;
};

/** Valores por defeito quando o doc ainda não existe. */
const DEFAULTS: CompanySettings = {
  nome: "",
  nif: "",
  email: "",
  telefone: "",
  morada: "",
  logoUrl: "",
};

type CompanyDoc = CompanySettings & { id: string; updatedAt?: string };

/**
 * Lê o doc id:"company". Devolve sempre um CompanySettings completo
 * (defaults preenchidos) para simplificar o pré-preenchimento do form.
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  const db = await getDb();
  const doc = await db
    .collection<CompanyDoc>(COLLECTION)
    .findOne({ id: COMPANY_ID }, { projection: { _id: 0, id: 0, updatedAt: 0 } });

  if (!doc) return { ...DEFAULTS };

  return {
    nome: doc.nome ?? DEFAULTS.nome,
    nif: doc.nif ?? DEFAULTS.nif,
    email: doc.email ?? DEFAULTS.email,
    telefone: doc.telefone ?? DEFAULTS.telefone,
    morada: doc.morada ?? DEFAULTS.morada,
    logoUrl: doc.logoUrl ?? DEFAULTS.logoUrl,
  };
}

/** Upsert do doc id:"company" com updatedAt. Não toca noutras colecções. */
export async function saveCompanySettings(data: CompanySettings): Promise<void> {
  const db = await getDb();
  await db.collection<CompanyDoc>(COLLECTION).updateOne(
    { id: COMPANY_ID },
    { $set: { ...data, id: COMPANY_ID, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}
