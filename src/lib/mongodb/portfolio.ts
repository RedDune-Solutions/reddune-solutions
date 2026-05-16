import "server-only";
import clientPromise from "./client";
import type { PortfolioItem } from "@/types/portfolio";
import { WithId, Document, ObjectId } from "mongodb";

const DB_NAME = "website";
const COLLECTION = "portfolio";

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
    imageUrl: typeof doc.imageUrl === "string" ? doc.imageUrl : "",
    url: typeof doc.url === "string" ? doc.url : "",
  };
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION);
}

export async function getAllPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const col = await getCollection();
    const docs = await col.find({}).sort({ featured: -1, createdAt: -1 }).toArray();
    return docs.map(mapDoc).filter((p): p is PortfolioItem => p !== null);
  } catch (error) {
    console.error("getAllPortfolioItems error:", error);
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

type PortfolioInput = Omit<PortfolioItem, "id"> & { id?: string };

export async function upsertPortfolioItem(input: PortfolioInput): Promise<string> {
  const col = await getCollection();
  const doc = {
    title: input.title,
    imageUrl: input.imageUrl,
    url: input.url,
  };

  if (input.id && ObjectId.isValid(input.id)) {
    await col.updateOne({ _id: new ObjectId(input.id) }, { $set: doc });
    return input.id;
  }
  const result = await col.insertOne({ ...doc, createdAt: new Date() });
  return result.insertedId.toString();
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
