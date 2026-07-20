#!/usr/bin/env node
/**
 * Migração 2026-07-20: renomeia a colecção MongoDB `tarefas` → `lembretes`.
 *
 * ORDEM OBRIGATÓRIA (evita corrida deploy vs migração):
 *   1. push do código novo para main e esperar o deploy Vercel ficar LIVE;
 *   2. NÃO tocar no painel;
 *   3. correr DRY_RUN=1 e confirmar db efectiva + contagem;
 *   4. correr a migração real.
 * Se correr antes do deploy, o código antigo recria `tarefas` no primeiro
 * write; se o painel for usado entre deploy e migração, o código novo cria
 * `lembretes` vazia — esse caso é tratado abaixo (drop da vazia).
 *
 * Faz backup ($out para `tarefas_backup_2026_07_20`) antes do rename.
 * Idempotente: `lembretes` já existe com docs e `tarefas` não → OK.
 * Ambas com docs → aborta (nunca funde automaticamente).
 *
 * Uso:
 *   DRY_RUN=1 node scripts/migrate-lembretes.mjs   # só mostra contagens
 *   node scripts/migrate-lembretes.mjs             # backup + rename
 *
 * Env (lê .env.local na raiz): MONGODB_URI, MONGODB_DB_NAME (opcional)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv NÃO faz override de vars já exportadas na shell — avisa se for o caso.
const shellUri = process.env.MONGODB_URI;
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
if (shellUri) {
  console.warn("[migrate-lembretes] AVISO: MONGODB_URI já vinha da shell — .env.local NÃO faz override.");
}

const URI = process.env.MONGODB_URI?.trim();
// Opcional — sem MONGODB_DB_NAME o driver usa a DB do próprio URI (igual ao getDb() da app).
const DB_NAME = process.env.MONGODB_DB_NAME?.trim() || undefined;
const DRY_RUN = process.env.DRY_RUN === "1";
const BACKUP = "tarefas_backup_2026_07_20";

if (!URI) {
  console.error("[migrate-lembretes] MONGODB_URI em falta (.env.local).");
  process.exitCode = 1;
} else {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    let host = "?";
    try { host = new URL(URI.replace("mongodb+srv://", "https://").replace("mongodb://", "https://")).host; } catch {}
    console.log(`[migrate-lembretes] cluster: ${host} · db efectiva: ${db.databaseName}`);

    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    const hasTarefas = names.includes("tarefas");
    let hasLembretes = names.includes("lembretes");

    const nTarefas = hasTarefas ? await db.collection("tarefas").countDocuments() : null;
    const nLembretes = hasLembretes ? await db.collection("lembretes").countDocuments() : null;
    console.log(`  tarefas:   ${hasTarefas ? nTarefas + " docs" : "(não existe)"}`);
    console.log(`  lembretes: ${hasLembretes ? nLembretes + " docs" : "(não existe)"}`);

    if (!hasTarefas && hasLembretes) {
      console.log("[migrate-lembretes] Já migrado — nada a fazer.");
    } else if (!hasTarefas && !hasLembretes) {
      console.log("[migrate-lembretes] Nenhuma das colecções existe — nada a fazer.");
    } else if (hasTarefas && hasLembretes && nLembretes > 0) {
      console.error("[migrate-lembretes] AMBAS existem com docs — não fundo automaticamente. Resolver à mão.");
      process.exitCode = 1;
    } else if (DRY_RUN) {
      console.log("[migrate-lembretes] DRY_RUN=1 — faria: backup + rename tarefas → lembretes.");
    } else {
      // `lembretes` vazia (criada por um write do código novo antes da migração)
      // não tem nada a perder — drop e segue.
      if (hasLembretes && nLembretes === 0) {
        console.log("[migrate-lembretes] 'lembretes' existe mas vazia — drop antes do rename.");
        await db.collection("lembretes").drop();
        hasLembretes = false;
      }

      const nAntes = await db.collection("tarefas").countDocuments();

      console.log(`[migrate-lembretes] backup → ${BACKUP} …`);
      await db.collection("tarefas").aggregate([{ $match: {} }, { $out: BACKUP }]).toArray();
      const nBackup = await db.collection(BACKUP).countDocuments();
      if (nBackup < nAntes) {
        console.error(`[migrate-lembretes] backup incompleto (${nBackup}/${nAntes}) — aborto sem rename.`);
        process.exitCode = 1;
      } else {
        if (nBackup > nAntes) {
          console.warn(`[migrate-lembretes] aviso: backup com ${nBackup} > ${nAntes} docs (escritas concorrentes?).`);
        }
        console.log("[migrate-lembretes] rename tarefas → lembretes …");
        await db.renameCollection("tarefas", "lembretes");

        const nDepois = await db.collection("lembretes").countDocuments();
        if (nDepois >= nAntes) {
          if (nDepois > nAntes) {
            console.warn(`[migrate-lembretes] aviso: ${nDepois} > ${nAntes} docs (escritas concorrentes durante a migração — preservadas pelo rename).`);
          }
          console.log(`[migrate-lembretes] OK: ${nDepois} docs em 'lembretes'; backup '${BACKUP}' com ${nBackup}.`);
        } else {
          console.error(`[migrate-lembretes] FALHA: ${nDepois}/${nAntes} docs após rename.`);
          process.exitCode = 1;
        }
      }
    }
  } catch (err) {
    console.error("[migrate-lembretes] erro:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
