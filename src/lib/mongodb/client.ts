import "server-only";
import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI environment variable not set");
  }
  return uri;
}

function createClient(): Promise<MongoClient> {
  const client = new MongoClient(getMongoUri());
  return client.connect();
}

/**
 * Cria a promise de ligação de forma lazy e, se rejeitar, LIMPA a cache para a
 * próxima chamada tentar de novo. Sem isto, uma falha transitória no cold start
 * de uma instância serverless ficava cacheada para sempre (a mesma promise
 * rejeitada), envenenando TODAS as requests dessa instância até ser reciclada.
 * Antes, este retry existia só em development.
 */
function getClientPromise(): Promise<MongoClient> {
  const cached = global._mongoClientPromise;
  if (cached) return cached;
  const promise = createClient().catch((error) => {
    global._mongoClientPromise = undefined;
    throw error;
  });
  global._mongoClientPromise = promise;
  return promise;
}

/** Cliente Mongo ligado (com retry-on-failure). Preferir a getDb quando possível. */
export async function getClient(): Promise<MongoClient> {
  return getClientPromise();
}

/**
 * Helper partilhado: devolve a Db já ligada usando MONGODB_DB_NAME.
 * Centraliza a resolução do nome da BD (antes duplicada em cada loader).
 */
export async function getDb() {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME);
}
