/**
 * Migração one-time: copia coll "loja" (DB "website") → coll "products" (DB principal).
 *
 * Mantém _id ObjectId tal qual. Idempotente (upsert por _id).
 *
 * Como correr:
 *   1. Cria scripts/.env com MONGODB_URI e MONGODB_DB_NAME.
 *   2. node scripts/migrate-products-db.mjs
 *   3. Verifica em Atlas que <MONGODB_DB_NAME>.products tem o mesmo nº de docs.
 *   4. Trocar lib/mongodb/products.ts para usar process.env.MONGODB_DB_NAME + "products".
 *   5. Após confirmar em prod, apagar coll "loja" do DB "website".
 */
import path from "node:path";
import url from "node:url";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const uri = process.env.MONGODB_URI;
const targetDb = process.env.MONGODB_DB_NAME;

if (!uri) {
  console.error("MONGODB_URI não definido");
  process.exit(1);
}
if (!targetDb) {
  console.error("MONGODB_DB_NAME não definido");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const source = client.db("website").collection("loja");
  const dest = client.db(targetDb).collection("products");

  const docs = await source.find({}).toArray();
  console.log(`Encontrados ${docs.length} produtos em website.loja`);

  let migrated = 0;
  for (const doc of docs) {
    await dest.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
    migrated += 1;
  }

  console.log(`✓ Migrados ${migrated} para ${targetDb}.products`);
  console.log("Próximo passo: editar src/lib/mongodb/products.ts para usar o DB principal.");
} catch (err) {
  console.error("Migração falhou:", err);
  process.exit(1);
} finally {
  await client.close();
}
