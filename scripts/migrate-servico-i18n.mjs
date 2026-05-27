/**
 * Migração: adiciona campos i18n (tituloI18n, descricaoI18n, notaI18n, variantes.labelI18n)
 * aos docs `servicos` no Mongo.
 *
 * Estratégia:
 *   - PT canónico permanece nos campos legacy (`titulo`, `descricao`, etc.)
 *   - EN é traduzido via dicionário (DICT) p/ termos conhecidos; resto fica vazio
 *     e tu preenches via dashboard /painel/precos.
 *
 * Idempotente: se um campo `*I18n.en` já existe e tem conteúdo, NÃO sobrescreve.
 *
 * Como correr:
 *   1. scripts/.env tem MONGODB_URI e MONGODB_DB_NAME (mesmo .env do migrate-products).
 *   2. node scripts/migrate-servico-i18n.mjs              (dry-run, mostra plano)
 *   3. node scripts/migrate-servico-i18n.mjs --apply      (escreve)
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
const dbName = process.env.MONGODB_DB_NAME;
const APPLY = process.argv.includes("--apply");

if (!uri || !dbName) {
  console.error("MONGODB_URI ou MONGODB_DB_NAME não definidos.");
  process.exit(1);
}

// Dicionário PT→EN p/ termos comuns dos serviços RedDune.
// Aplicado por substituição case-insensitive (palavra completa onde possível).
const DICT = [
  // Categorias / serviços
  ["Assistência Técnica", "Technical Support"],
  ["Web & Digital", "Web & Digital"],
  ["Software & Recuperação", "Software & Recovery"],
  ["Software / Recuperação", "Software / Recovery"],
  // Termos de hardware
  ["Diagnóstico", "Diagnosis"],
  ["Diagnostico", "Diagnosis"],
  ["Reparação", "Repair"],
  ["Reparacao", "Repair"],
  ["Substituição", "Replacement"],
  ["Substituicao", "Replacement"],
  ["Limpeza", "Cleaning"],
  ["Manutenção", "Maintenance"],
  ["Manutencao", "Maintenance"],
  ["Instalação", "Installation"],
  ["Instalacao", "Installation"],
  ["Formatação", "Format"],
  ["Formatacao", "Format"],
  ["Actualização", "Upgrade"],
  ["Atualização", "Upgrade"],
  ["Upgrade de RAM", "RAM upgrade"],
  ["Upgrade de SSD", "SSD upgrade"],
  ["Portátil", "Laptop"],
  ["Portatil", "Laptop"],
  ["Consola", "Console"],
  ["Ecrã", "Screen"],
  ["Ecra", "Screen"],
  ["Bateria", "Battery"],
  ["Teclado", "Keyboard"],
  ["Disco", "Disk"],
  ["Disco rígido", "Hard drive"],
  ["Ventoinha", "Fan"],
  ["Pasta térmica", "Thermal paste"],
  ["Pasta termica", "Thermal paste"],
  ["Sistema operativo", "Operating system"],
  ["Recuperação de dados", "Data recovery"],
  ["Recuperacao de dados", "Data recovery"],
  ["Cópia de segurança", "Backup"],
  ["Copia de segurança", "Backup"],
  ["Backup", "Backup"],
  // Web
  ["Página", "Page"],
  ["Pagina", "Page"],
  ["Sítio", "Website"],
  ["Sitio", "Website"],
  ["Site", "Website"],
  ["Loja online", "Online store"],
  ["Loja Online", "Online store"],
  ["Manutenção mensal", "Monthly maintenance"],
  ["Alojamento", "Hosting"],
  ["Domínio", "Domain"],
  ["Dominio", "Domain"],
  // Preço / sufixos
  ["abatido se reparares", "waived if you repair"],
  ["abatido", "waived"],
  ["sob consulta", "on request"],
  ["por orçamento", "by quote"],
  ["por orcamento", "by quote"],
  ["urgente", "urgent"],
  ["normal", "standard"],
  ["incluído", "included"],
  ["incluido", "included"],
  ["opcional", "optional"],
  ["por hora", "per hour"],
  ["por unidade", "each"],
  // Conectores
  [" e ", " and "],
  [" ou ", " or "],
  [" com ", " with "],
  [" sem ", " without "],
  [" para ", " for "],
  [" por ", " per "],
];

function translate(input) {
  if (!input || typeof input !== "string") return input;
  let out = input;
  for (const [pt, en] of DICT) {
    const re = new RegExp(escapeRe(pt), "gi");
    out = out.replace(re, (m) => preserveCase(m, en));
  }
  return out;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preserveCase(orig, repl) {
  // Se original é tudo maiúsculas → repl tudo maiúsculas
  if (orig === orig.toUpperCase() && orig !== orig.toLowerCase()) return repl.toUpperCase();
  // Se primeira letra maiúscula → preserve
  if (orig[0] === orig[0]?.toUpperCase()) return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}

function makeI18n(legacy, existing) {
  const pt = (legacy ?? "").toString();
  const existingEn = existing?.en?.trim();
  return {
    pt: pt || null,
    en: existingEn || (pt ? translate(pt) : null),
  };
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const col = client.db(dbName).collection("servicos");
  const docs = await col.find({}).toArray();
  console.log(`Encontrados ${docs.length} serviços em ${dbName}.servicos`);

  let touched = 0;
  for (const doc of docs) {
    const $set = {};

    const newTitulo = makeI18n(doc.titulo, doc.tituloI18n);
    if (JSON.stringify(newTitulo) !== JSON.stringify(doc.tituloI18n ?? null)) {
      $set.tituloI18n = newTitulo;
    }

    const newDescricao = makeI18n(doc.descricao, doc.descricaoI18n);
    if (JSON.stringify(newDescricao) !== JSON.stringify(doc.descricaoI18n ?? null)) {
      $set.descricaoI18n = newDescricao;
    }

    const newNota = makeI18n(doc.nota, doc.notaI18n);
    if (JSON.stringify(newNota) !== JSON.stringify(doc.notaI18n ?? null)) {
      $set.notaI18n = newNota;
    }

    if (doc.precoTexto) {
      const newPrecoTexto = makeI18n(doc.precoTexto, doc.precoTextoI18n);
      if (JSON.stringify(newPrecoTexto) !== JSON.stringify(doc.precoTextoI18n ?? null)) {
        $set.precoTextoI18n = newPrecoTexto;
      }
    }

    if (Array.isArray(doc.variantes) && doc.variantes.length > 0) {
      const newVariantes = doc.variantes.map((v) => ({
        ...v,
        labelI18n: v.labelI18n?.en
          ? v.labelI18n
          : { pt: v.label ?? null, en: v.label ? translate(v.label) : null },
      }));
      if (JSON.stringify(newVariantes) !== JSON.stringify(doc.variantes)) {
        $set.variantes = newVariantes;
      }
    }

    if (Object.keys($set).length === 0) continue;
    touched += 1;
    console.log(`\n[${doc.slug}] ${doc.titulo}`);
    for (const k of Object.keys($set)) {
      console.log(`   + ${k}:`, JSON.stringify($set[k]).slice(0, 200));
    }
    if (APPLY) {
      await col.updateOne({ _id: doc._id }, { $set });
    }
  }

  if (APPLY) {
    console.log(`\n✓ Aplicado a ${touched} docs.`);
  } else {
    console.log(`\n[DRY RUN] ${touched} docs seriam alterados. Corre com --apply p/ escrever.`);
  }
} catch (err) {
  console.error("Migração falhou:", err);
  process.exit(1);
} finally {
  await client.close();
}
