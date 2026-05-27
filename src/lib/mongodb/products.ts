import "server-only";
import clientPromise from "./client";
import type { Product, ProductCategory, ProductCondition } from "@/types/product";
import { WithId, Document, ObjectId } from "mongodb";

// NOTA: produtos historicamente vivem em DB "website" coll "loja" (legacy).
// Migração para DB principal coll "products" está em scripts/migrate-products-db.mjs.
// Após correres o script com sucesso, troca para process.env.MONGODB_DB_NAME e "products".
const DB_NAME = "website";
const COLLECTION = "loja";

const isValidCategory = (v: unknown): v is ProductCategory =>
  typeof (v as ProductCategory | undefined)?.pt === "string" &&
  typeof (v as ProductCategory | undefined)?.en === "string";

const isValidCondition = (v: unknown): v is ProductCondition =>
  typeof (v as ProductCondition | undefined)?.pt === "string" &&
  typeof (v as ProductCondition | undefined)?.en === "string";

function mapDoc(doc: WithId<Document>): Product | null {
  if (
    typeof doc.name?.pt !== "string" ||
    typeof doc.name?.en !== "string" ||
    typeof doc.description?.pt !== "string" ||
    typeof doc.description?.en !== "string" ||
    !isValidCategory(doc.category)
  )
    return null;

  return {
    id: doc._id.toString(),
    name: { pt: doc.name.pt, en: doc.name.en },
    description: { pt: doc.description.pt, en: doc.description.en },
    category: { pt: doc.category.pt, en: doc.category.en },
    condition: isValidCondition(doc.condition) ? { pt: doc.condition.pt, en: doc.condition.en } : { pt: "novo", en: "new" },
    price: typeof doc.price === "number" ? doc.price : 0,
    imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
    available: doc.available === true,
    featured: doc.featured === true,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(0).toISOString(),
  };
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION);
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const col = await getCollection();
    const docs = await col
      .find({ available: true })
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    return docs.map(mapDoc).filter((p): p is Product => p !== null);
  } catch (error) {
    console.error("getAllProducts error:", error);
    return [];
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const col = await getCollection();
    const docs = await col
      .find({})
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    return docs.map(mapDoc).filter((p): p is Product => p !== null);
  } catch (error) {
    console.error("getAllProductsAdmin error:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    if (!ObjectId.isValid(id)) return null;
    const col = await getCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    return doc ? mapDoc(doc) : null;
  } catch (error) {
    console.error("getProductById error:", error);
    return null;
  }
}

export async function getProductsByCategory(
  category: ProductCategory
): Promise<Product[]> {
  try {
    const col = await getCollection();
    const docs = await col
      .find({ available: true, category })
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    return docs.map(mapDoc).filter((p): p is Product => p !== null);
  } catch (error) {
    console.error("getProductsByCategory error:", error);
    return [];
  }
}

type ProductInput = Omit<Product, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export async function upsertProduct(input: ProductInput): Promise<string> {
  const col = await getCollection();
  const doc = {
    name: input.name,
    description: input.description,
    category: input.category,
    condition: input.condition,
    price: input.price,
    imageUrls: input.imageUrls,
    available: input.available,
    featured: input.featured,
    createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
  };

  if (input.id && ObjectId.isValid(input.id)) {
    await col.updateOne({ _id: new ObjectId(input.id) }, { $set: doc });
    return input.id;
  }
  const result = await col.insertOne({ ...doc, createdAt: new Date() });
  return result.insertedId.toString();
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await getCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
