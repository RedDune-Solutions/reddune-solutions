import "server-only";
import { getClient } from "./client";
import type { PortfolioCategoria, PortfolioItem } from "@/types/portfolio";
import { SERVICO_SLUG } from "@/types/servico";
import { WithId, Document, ObjectId } from "mongodb";

const DB_NAME = "website";
const COLLECTION = "portfolio";

const VALID_CATEGORIAS = new Set<string>(SERVICO_SLUG);

function isCategoria(v: unknown): v is PortfolioCategoria {
  return typeof v === "string" && VALID_CATEGORIAS.has(v);
}

function mapDoc(doc: WithId<Document>): PortfolioItem | null {
  if (
    typeof doc.title?.pt !== "string" ||
    typeof doc.title?.en !== "string" ||
    typeof doc.imageUrl !== "string" ||
    typeof doc.url !== "string"
  )
    return null;

  return {
    id: doc._id.toString(),
    title: { pt: doc.title.pt, en: doc.title.en },
    imageUrl: doc.imageUrl,
    url: doc.url,
    categoria: isCategoria(doc.categoria) ? doc.categoria : null,
    destaqueLanding: doc.destaqueLanding === true,
    escondido: doc.escondido === true,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
  };
}

async function getCollection() {
  const client = await getClient();
  return client.db(DB_NAME).collection(COLLECTION);
}

export async function getAllPortfolioItems(
  opts?: { includeHidden?: boolean },
): Promise<PortfolioItem[]> {
  try {
    const col = await getCollection();
    // Por defeito o site público não vê itens escondidos/arquivados;
    // o painel pede includeHidden: true.
    const filter = opts?.includeHidden ? {} : { escondido: { $ne: true } };
    const docs = await col.find(filter).sort({ destaqueLanding: -1, createdAt: -1 }).toArray();
    return docs.map(mapDoc).filter((p): p is PortfolioItem => p !== null);
  } catch (error) {
    console.error("getAllPortfolioItems error:", error);
    return [];
  }
}

/**
 * Devolve no máximo 1 destaque por categoria. Se MongoDB tiver duplicados (defensivo),
 * pega no createdAt mais recente.
 */
export async function getDestaquesLanding(): Promise<PortfolioItem[]> {
  try {
    const col = await getCollection();
    const docs = await col
      .find({ destaqueLanding: true, escondido: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
    const seen = new Set<string>();
    const out: PortfolioItem[] = [];
    for (const d of docs) {
      const item = mapDoc(d);
      if (!item || !item.categoria) continue;
      if (seen.has(item.categoria)) continue;
      seen.add(item.categoria);
      out.push(item);
    }
    return out;
  } catch (error) {
    console.error("getDestaquesLanding error:", error);
    return [];
  }
}

export async function getPortfolioItemById(id: string): Promise<PortfolioItem | null> {
  try {
    if (!ObjectId.isValid(id)) return null;
    const col = await getCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    return doc ? mapDoc(doc) : null;
  } catch (error) {
    console.error("getPortfolioItemById error:", error);
    return null;
  }
}

// `escondido` fica de fora de propósito: é gerido só pelo toggle dedicado
// (setPortfolioEscondido); o upsert do formulário nunca o escreve nem apaga.
type PortfolioInput = Omit<PortfolioItem, "id" | "createdAt" | "escondido"> & { id?: string };

export async function upsertPortfolioItem(input: PortfolioInput): Promise<string> {
  const col = await getCollection();
  const doc: Record<string, unknown> = {
    title: input.title,
    imageUrl: input.imageUrl,
    url: input.url,
    categoria: input.categoria,
    destaqueLanding: input.destaqueLanding,
  };

  let savedId: string;
  if (input.id && ObjectId.isValid(input.id)) {
    await col.updateOne({ _id: new ObjectId(input.id) }, { $set: doc });
    savedId = input.id;
  } else {
    const result = await col.insertOne({ ...doc, createdAt: new Date() });
    savedId = result.insertedId.toString();
  }

  // Exclusividade: apenas 1 destaque por categoria. Se este foi marcado, desmarcar outros.
  if (input.destaqueLanding && input.categoria) {
    await col.updateMany(
      {
        _id: { $ne: new ObjectId(savedId) },
        categoria: input.categoria,
        destaqueLanding: true,
      },
      { $set: { destaqueLanding: false } }
    );
  }

  return savedId;
}

/**
 * Toggle dedicado de visibilidade — NUNCA passa pelo upsert do formulário
 * (que faz $set do doc inteiro e apagaria o campo em cada gravação).
 */
export async function setPortfolioEscondido(
  id: string,
  escondido: boolean,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { escondido } },
  );
  return result.matchedCount > 0;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
