# Portal do Cliente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portal público por link secreto (`/p/[token]`) onde o cliente vê o seu projecto (estado, valores agregados, entregáveis PDF/HTML/links), comenta, e preenche a própria ficha.

**Architecture:** Página pública server-rendered que resolve um token (SHA-256 na BD) para um projecto; DTOs com allowlist explícita impedem fugas de campos internos; 3 APIs públicas autenticadas por token (proxy de ficheiros, comentários, ficha) + 2 APIs de gestão no painel (sessão NextAuth). Push via `sendPushToAll` existente.

**Tech Stack:** Next.js 16 App Router, MongoDB (driver nativo), Vercel Blob, zod v4, vitest (novo, unit tests), Tailwind + tokens Oasis v5.

**Regras da sessão:** commits locais na branch `feat/portal-cliente`; **NUNCA `git push`** (push a main = deploy Vercel).

**Nota vs spec:** whitelist da ficha = `nome, email, telefone, morada, nif` (o tipo `Cliente` real tem `telefone`, não `telemovel`; `empresa` não existe → fora da v1). "Pago" vem de `pagamentos` (colecção própria, padrão do painel), não de `valorPago`.

---

### Task 0: vitest

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `vitest.config.ts`

- [ ] **Step 0.1:** `npm i -D vitest` (sem tocar em dependencies de runtime)
- [ ] **Step 0.2:** Criar `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 0.3:** Adicionar script `"test": "vitest run"` ao package.json
- [ ] **Step 0.4:** Correr `npm test` → "No test files found" aceitável nesta fase (passa com `--passWithNoTests`? Não: só validar que o binário corre; primeiro teste chega na Task 1)
- [ ] **Step 0.5:** Commit `chore: vitest para unit tests`

### Task 1: Tipos + DTO do portal (TDD)

**Files:**
- Modify: `src/types/projeto.ts` (ProjetoLink, ProjetoPortal, campos novos em Projeto)
- Create: `src/types/portal.ts` (PortalComentario)
- Create: `src/lib/portal-dto.ts`
- Test: `src/lib/portal-dto.test.ts`

- [ ] **Step 1.1:** Em `src/types/projeto.ts`, antes de `export interface Projeto`:

```ts
export interface ProjetoLink {
  id: string;
  label: string;
  url: string; // https:// (validado na API)
}

export interface ProjetoPortal {
  tokenHash: string; // SHA-256 hex do token; o token em claro nunca é guardado
  criadoEm: string; // ISO
  revogadoEm: string | null;
}
```

E em `Projeto` (depois de `arquivos`):

```ts
  links: ProjetoLink[] | null;
  portal: ProjetoPortal | null;
```

Nota: documentos antigos não têm os campos → `undefined` lê-se como ausente; todo o código novo trata `?? null`/`?? []`.

- [ ] **Step 1.2:** Criar `src/types/portal.ts`:

```ts
export interface PortalComentario {
  id: string;
  projetoId: string;
  arquivoId: string | null; // null = comentário geral (ou de um link)
  linkId: string | null;
  autorNome: string | null;
  texto: string;
  criadoEm: string; // ISO
  lidoEm: string | null; // marcado lido no painel
  ip: string;
}
```

- [ ] **Step 1.3:** Escrever `src/lib/portal-dto.test.ts` (falha por módulo não existir):

```ts
import { describe, it, expect } from "vitest";
import { toPortalProjeto, toPortalCliente } from "./portal-dto";
import type { Projeto } from "@/types/projeto";
import type { Cliente } from "@/types/cliente";
import type { Pagamento } from "@/types/pagamento";

const POISON = "SEGREDO_INTERNO_NUNCA_MOSTRAR";

function makeProjeto(): Projeto {
  return {
    id: "p1",
    titulo: "Site Restaurante",
    clienteId: "c1",
    clienteNome: "Maria",
    proximaAccao: POISON,
    status: "em-curso",
    categoria: "web-digital",
    tipo: "web",
    tipos: ["web", "consultoria"],
    responsavel: "eu",
    prazo: "2026-08-01",
    dataCriado: "2026-07-01",
    dataFechado: null,
    valorEstimado: 400,
    valorPago: null,
    metodoPagamento: POISON,
    local: "remoto",
    notasResumo: POISON,
    bodyMd: POISON,
    linhas: [
      { id: "l1", descricao: POISON, categoria: "peca", quantidade: 2, precoUnit: 100 },
      { id: "l2", descricao: POISON, categoria: "mao-obra", quantidade: 1, precoUnit: 150 },
      { id: "l3", descricao: POISON, categoria: "peca", quantidade: 1, precoUnit: 50 },
    ],
    garantiaAte: "2027-01-01",
    hardware: { marca: "Asus", modelo: "X515", serial: POISON },
    arquivos: [
      {
        id: "a1",
        pathname: "projetos/p1/a1.pdf",
        blobUrl: POISON,
        url: "/api/projetos/arquivo/a1?projetoId=p1",
        nome: "orcamento.pdf",
        tamanho: 1234,
        tipo: "application/pdf",
        dataUpload: "2026-07-02",
      },
    ],
    links: [{ id: "k1", label: "Protótipo", url: "https://exemplo.vercel.app" }],
    portal: { tokenHash: POISON, criadoEm: "2026-07-03", revogadoEm: null },
  };
}

const pagamentos: Pagamento[] = [
  { id: "g1", projetoId: "p1", clienteId: "c1", valor: 100, data: "2026-07-02", metodo: "mbway", notas: POISON, criadoEm: "2026-07-02" },
  { id: "g2", projetoId: "p1", clienteId: "c1", valor: 50, data: "2026-07-03", metodo: null, notas: null, criadoEm: "2026-07-03" },
];

describe("toPortalProjeto", () => {
  it("nunca inclui campos internos (poison scan)", () => {
    const dto = toPortalProjeto(makeProjeto(), pagamentos);
    expect(JSON.stringify(dto)).not.toContain(POISON);
  });

  it("não expõe chaves proibidas", () => {
    const dto = toPortalProjeto(makeProjeto(), pagamentos) as unknown as Record<string, unknown>;
    for (const k of ["bodyMd", "notasResumo", "proximaAccao", "linhas", "portal", "metodoPagamento", "valorPago"]) {
      expect(dto).not.toHaveProperty(k);
    }
  });

  it("agrega valores por categoria sem detalhe", () => {
    const dto = toPortalProjeto(makeProjeto(), pagamentos);
    expect(dto.valores).toEqual({
      orcado: 400,
      pago: 150,
      emFalta: 250,
      categorias: [
        { label: "Peça", total: 250 },
        { label: "Mão-de-obra", total: 150 },
      ],
    });
  });

  it("valores null quando não há orçamento", () => {
    const p = { ...makeProjeto(), valorEstimado: null, linhas: null };
    expect(toPortalProjeto(p, []).valores).toBeNull();
  });

  it("labels de status e tipos amigáveis; tipos custom passam crus", () => {
    const p = { ...makeProjeto(), tipos: ["web", "slug-custom"] };
    const dto = toPortalProjeto(p, []);
    expect(dto.statusLabel).toBe("Em curso");
    expect(dto.tipoLabels).toEqual(["Web", "slug-custom"]);
  });

  it("arquivos só com id/nome/tipo/tamanho e hardware sem serial", () => {
    const dto = toPortalProjeto(makeProjeto(), pagamentos);
    expect(dto.arquivos).toEqual([{ id: "a1", nome: "orcamento.pdf", tipo: "application/pdf", tamanho: 1234 }]);
    expect(dto.hardware).toEqual({ marca: "Asus", modelo: "X515" });
  });
});

describe("toPortalCliente", () => {
  it("só a whitelist; notas nunca saem", () => {
    const c: Cliente = {
      id: "c1", nome: "Maria", email: "m@x.pt", telefone: "912",
      nif: null, morada: null, notas: POISON, criadoEm: "2026-01-01",
    };
    const dto = toPortalCliente(c);
    expect(dto).toEqual({ nome: "Maria", email: "m@x.pt", telefone: "912", nif: null, morada: null });
    expect(JSON.stringify(dto)).not.toContain(POISON);
  });
});
```

- [ ] **Step 1.4:** `npm test` → FAIL (portal-dto não existe)
- [ ] **Step 1.5:** Criar `src/lib/portal-dto.ts` (sem `server-only` — puro, testável):

```ts
import {
  STATUS_LABELS,
  LINHA_CATEGORIA_LABEL,
  PROJETO_TIPO_LABEL,
  type Projeto,
  type ProjetoTipo,
  type LinhaCategoria,
} from "@/types/projeto";
import type { Cliente } from "@/types/cliente";
import type { Pagamento } from "@/types/pagamento";

// DTOs do portal: allowlist EXPLÍCITA. Campo novo no Projeto/Cliente nunca
// chega ao portal sem ser adicionado aqui de propósito. Nunca fazer spread.

export type PortalArquivoDTO = { id: string; nome: string; tipo: string; tamanho: number };
export type PortalLinkDTO = { id: string; label: string; url: string };
export type PortalValoresDTO = {
  orcado: number;
  pago: number;
  emFalta: number;
  categorias: { label: string; total: number }[];
};

export type PortalProjetoDTO = {
  id: string;
  titulo: string;
  statusLabel: string;
  prazo: string | null;
  tipoLabels: string[];
  garantiaAte: string | null;
  hardware: { marca: string | null; modelo: string | null } | null;
  arquivos: PortalArquivoDTO[];
  links: PortalLinkDTO[];
  valores: PortalValoresDTO | null;
};

export type PortalClienteDTO = {
  nome: string;
  email: string | null;
  telefone: string | null;
  nif: string | null;
  morada: string | null;
};

export function toPortalProjeto(projeto: Projeto, pagamentos: Pagamento[]): PortalProjetoDTO {
  const orcado = projeto.valorEstimado ?? null;
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);

  let valores: PortalValoresDTO | null = null;
  if (orcado != null) {
    const porCategoria = new Map<LinhaCategoria, number>();
    for (const l of projeto.linhas ?? []) {
      porCategoria.set(l.categoria, (porCategoria.get(l.categoria) ?? 0) + l.quantidade * l.precoUnit);
    }
    valores = {
      orcado,
      pago,
      emFalta: Math.max(0, orcado - pago),
      categorias: [...porCategoria.entries()].map(([c, total]) => ({
        label: LINHA_CATEGORIA_LABEL[c] ?? c,
        total,
      })),
    };
  }

  return {
    id: projeto.id,
    titulo: projeto.titulo,
    statusLabel: STATUS_LABELS[projeto.status] ?? projeto.status,
    prazo: projeto.prazo ?? null,
    tipoLabels: (projeto.tipos ?? (projeto.tipo ? [projeto.tipo] : [])).map(
      (t) => PROJETO_TIPO_LABEL[t as ProjetoTipo] ?? t
    ),
    garantiaAte: projeto.garantiaAte ?? null,
    hardware: projeto.hardware
      ? { marca: projeto.hardware.marca ?? null, modelo: projeto.hardware.modelo ?? null }
      : null,
    arquivos: (projeto.arquivos ?? []).map((a) => ({
      id: a.id,
      nome: a.nome,
      tipo: a.tipo,
      tamanho: a.tamanho,
    })),
    links: (projeto.links ?? []).map((k) => ({ id: k.id, label: k.label, url: k.url })),
    valores,
  };
}

export function toPortalCliente(c: Cliente): PortalClienteDTO {
  return {
    nome: c.nome,
    email: c.email ?? null,
    telefone: c.telefone ?? null,
    nif: c.nif ?? null,
    morada: c.morada ?? null,
  };
}
```

- [ ] **Step 1.6:** `npm test` → PASS; `npm run typecheck` → PASS
- [ ] **Step 1.7:** Commit `feat(portal): tipos + DTOs com allowlist`

### Task 2: Token (TDD)

**Files:**
- Create: `src/lib/portal-token.ts`
- Test: `src/lib/portal-token.test.ts`

- [ ] **Step 2.1:** Teste `src/lib/portal-token.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generatePortalToken, hashPortalToken } from "./portal-token";

describe("portal-token", () => {
  it("gera tokens URL-safe com entropia suficiente", () => {
    const t = generatePortalToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes base64url
    expect(generatePortalToken()).not.toBe(t);
  });
  it("hash determinístico sha256 hex", () => {
    const h = hashPortalToken("abc");
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(hashPortalToken("abc")).toBe(h);
  });
});
```

- [ ] **Step 2.2:** `npm test` → FAIL
- [ ] **Step 2.3:** Criar `src/lib/portal-token.ts`:

```ts
import { randomBytes, createHash } from "node:crypto";

// Token do portal: bearer secret mostrado UMA vez; na BD só o SHA-256.
export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 2.4:** `npm test` → PASS
- [ ] **Step 2.5:** Commit `feat(portal): geração e hash de tokens`

### Task 3: Validação (TDD)

**Files:**
- Create: `src/lib/validation-portal.ts`
- Test: `src/lib/validation-portal.test.ts`

- [ ] **Step 3.1:** Teste `src/lib/validation-portal.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { comentarioSchema, clientePatchSchema } from "./validation-portal";

describe("comentarioSchema", () => {
  it("aceita comentário válido", () => {
    expect(comentarioSchema.safeParse({ texto: "Gosto do design!" }).success).toBe(true);
  });
  it("rejeita vazio e >2000 chars", () => {
    expect(comentarioSchema.safeParse({ texto: "  " }).success).toBe(false);
    expect(comentarioSchema.safeParse({ texto: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("clientePatchSchema", () => {
  it("aceita patch parcial válido", () => {
    const r = clientePatchSchema.safeParse({ telefone: "912345678", nif: "123456789" });
    expect(r.success).toBe(true);
  });
  it("rejeita campos fora da whitelist", () => {
    expect(clientePatchSchema.safeParse({ notas: "hack" }).success).toBe(false);
    expect(clientePatchSchema.safeParse({ id: "outro" }).success).toBe(false);
  });
  it("rejeita nif inválido e email inválido", () => {
    expect(clientePatchSchema.safeParse({ nif: "12" }).success).toBe(false);
    expect(clientePatchSchema.safeParse({ email: "não-email" }).success).toBe(false);
  });
  it("aceita limpar campos com null (excepto nome)", () => {
    expect(clientePatchSchema.safeParse({ morada: null }).success).toBe(true);
    expect(clientePatchSchema.safeParse({ nome: null }).success).toBe(false);
  });
});
```

- [ ] **Step 3.2:** `npm test` → FAIL
- [ ] **Step 3.3:** Criar `src/lib/validation-portal.ts`:

```ts
import { z } from "zod";

export const comentarioSchema = z.object({
  texto: z.string().trim().min(1).max(2000),
  arquivoId: z.string().max(128).nullish(),
  linkId: z.string().max(128).nullish(),
  autorNome: z.string().trim().max(120).nullish(),
});

// Whitelist EXTRITA do que o portal pode escrever no cliente. strictObject →
// qualquer campo extra é rejeitado (nunca chega ao $set).
export const clientePatchSchema = z.strictObject({
  nome: z.string().trim().min(1).max(120).optional(),
  email: z.email().max(200).nullable().optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
  morada: z.string().trim().max(300).nullable().optional(),
  nif: z.string().trim().regex(/^\d{9}$/).nullable().optional(),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z.url().max(500).refine((u) => u.startsWith("https://"), "URL tem de ser https"),
});
```

- [ ] **Step 3.4:** `npm test` → PASS
- [ ] **Step 3.5:** Commit `feat(portal): schemas de validação`

### Task 4: Camada Mongo + índices

**Files:**
- Create: `src/lib/mongodb/portal.ts`
- Modify: `src/lib/mongodb/projetos.ts` (pushLink/pullLink, iguais a pushArquivo/pullArquivo)
- Modify: `src/lib/mongodb/init-indexes.ts`

- [ ] **Step 4.1:** Criar `src/lib/mongodb/portal.ts`:

```ts
import "server-only";
import { getDb } from "./client";
import type { Projeto, ProjetoPortal } from "@/types/projeto";
import type { PortalComentario } from "@/types/portal";

const COMENTARIOS = "portal_comentarios";

/** Resolve um token (já hashed) num projecto com portal activo. */
export async function getProjetoByPortalTokenHash(tokenHash: string): Promise<Projeto | null> {
  const db = await getDb();
  return db.collection<Projeto>("projetos").findOne(
    { "portal.tokenHash": tokenHash, "portal.revogadoEm": null },
    { projection: { _id: 0 } }
  );
}

export async function setProjetoPortal(projetoId: string, portal: ProjetoPortal): Promise<boolean> {
  const db = await getDb();
  const r = await db.collection<Projeto>("projetos").updateOne({ id: projetoId }, { $set: { portal } });
  return r.matchedCount > 0;
}

export async function revokeProjetoPortal(projetoId: string): Promise<boolean> {
  const db = await getDb();
  const r = await db
    .collection("projetos")
    .updateOne({ id: projetoId, portal: { $ne: null } }, { $set: { "portal.revogadoEm": new Date().toISOString() } });
  return r.matchedCount > 0;
}

export async function insertComentario(c: PortalComentario): Promise<void> {
  const db = await getDb();
  await db.collection<PortalComentario>(COMENTARIOS).insertOne({ ...c });
}

export async function getComentariosByProjeto(projetoId: string): Promise<PortalComentario[]> {
  const db = await getDb();
  return db
    .collection<PortalComentario>(COMENTARIOS)
    .find({ projetoId }, { projection: { _id: 0 } })
    .sort({ criadoEm: -1 })
    .limit(200)
    .toArray();
}

export async function marcarComentarioLido(id: string): Promise<boolean> {
  const db = await getDb();
  const r = await db
    .collection<PortalComentario>(COMENTARIOS)
    .updateOne({ id, lidoEm: null }, { $set: { lidoEm: new Date().toISOString() } });
  return r.matchedCount > 0;
}

/** Nº de comentários nas últimas 24h por projecto (tecto anti-flood). */
export async function countComentariosRecentes(projetoId: string): Promise<number> {
  const db = await getDb();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return db.collection<PortalComentario>(COMENTARIOS).countDocuments({ projetoId, criadoEm: { $gte: desde } });
}
```

- [ ] **Step 4.2:** Em `src/lib/mongodb/projetos.ts`, acrescentar (import `ProjetoLink` no topo):

```ts
/** Acrescenta um link de preview atomicamente (ver pushArquivo). */
export async function pushLink(projetoId: string, link: ProjetoLink): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).updateOne({ id: projetoId }, [
    { $set: { links: { $concatArrays: [{ $ifNull: ["$links", []] }, [link]] } } },
  ]);
  return result.matchedCount > 0;
}

/** Remove um link pelo id, atomicamente. */
export async function pullLink(projetoId: string, linkId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Projeto>(COLLECTION).updateOne({ id: projetoId }, [
    {
      $set: {
        links: {
          $filter: { input: { $ifNull: ["$links", []] }, as: "k", cond: { $ne: ["$$k.id", linkId] } },
        },
      },
    },
  ]);
  return result.matchedCount > 0;
}
```

- [ ] **Step 4.3:** Em `init-indexes.ts`, dentro do `Promise.all`:

```ts
    db.collection("projetos").createIndex(
      { "portal.tokenHash": 1 },
      { unique: true, partialFilterExpression: { "portal.tokenHash": { $type: "string" } } }
    ),

    db.collection("portal_comentarios").createIndex({ id: 1 }, { unique: true }),
    db.collection("portal_comentarios").createIndex({ projetoId: 1, criadoEm: -1 }),
```

- [ ] **Step 4.4:** `npm run typecheck` → PASS
- [ ] **Step 4.5:** Commit `feat(portal): camada mongo + índices`

### Task 5: APIs de gestão no painel (sessão)

**Files:**
- Create: `src/app/api/projetos/portal/route.ts`
- Create: `src/app/api/projetos/links/route.ts`

- [ ] **Step 5.1:** `src/app/api/projetos/portal/route.ts` — POST `{projetoId, action: "gerar" | "revogar"}`. `gerar` também serve para regenerar (substitui o hash). Sessão obrigatória; devolve `{token}` UMA vez em `gerar`:

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getProjetoById } from "@/lib/mongodb/projetos";
import { setProjetoPortal, revokeProjetoPortal } from "@/lib/mongodb/portal";
import { generatePortalToken, hashPortalToken } from "@/lib/portal-token";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projetoId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { projetoId, action } = body;
  if (!projetoId || (action !== "gerar" && action !== "revogar")) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const projeto = await getProjetoById(projetoId);
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  if (action === "gerar") {
    const token = generatePortalToken();
    const ok = await setProjetoPortal(projetoId, {
      tokenHash: hashPortalToken(token),
      criadoEm: new Date().toISOString(),
      revogadoEm: null,
    });
    if (!ok) return NextResponse.json({ error: "Falha ao guardar" }, { status: 500 });
    await logMutation({
      collection: "projetos", entityId: projetoId, op: "update",
      userEmail: session.user.email ?? null, after: { portal: "link gerado" },
    });
    revalidatePath(`/painel/projetos/${projetoId}`);
    return NextResponse.json({ token });
  }

  const ok = await revokeProjetoPortal(projetoId);
  if (!ok) return NextResponse.json({ error: "Portal não existe" }, { status: 404 });
  await logMutation({
    collection: "projetos", entityId: projetoId, op: "update",
    userEmail: session.user.email ?? null, after: { portal: "link revogado" },
  });
  revalidatePath(`/painel/projetos/${projetoId}`);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5.2:** `src/app/api/projetos/links/route.ts` — POST `{projetoId, action: "add"|"remove", label?, url?, linkId?}`:

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { getProjetoById, pushLink, pullLink } from "@/lib/mongodb/projetos";
import { linkSchema } from "@/lib/validation-portal";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { projetoId?: string; action?: string; label?: string; url?: string; linkId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { projetoId, action } = body;
  if (!projetoId || (action !== "add" && action !== "remove")) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const projeto = await getProjetoById(projetoId);
  if (!projeto) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  if (action === "add") {
    const parsed = linkSchema.safeParse({ label: body.label, url: body.url });
    if (!parsed.success) {
      return NextResponse.json({ error: "Link inválido (https obrigatório)" }, { status: 400 });
    }
    const link = { id: randomUUID(), ...parsed.data };
    const ok = await pushLink(projetoId, link);
    if (!ok) return NextResponse.json({ error: "Falha ao guardar" }, { status: 500 });
    await logMutation({
      collection: "projetos", entityId: projetoId, op: "update",
      userEmail: session.user.email ?? null, after: { linkAdicionado: link },
    });
    revalidatePath(`/painel/projetos/${projetoId}`);
    return NextResponse.json({ link });
  }

  if (!body.linkId) return NextResponse.json({ error: "linkId em falta" }, { status: 400 });
  const ok = await pullLink(projetoId, body.linkId);
  if (!ok) return NextResponse.json({ error: "Falha ao remover" }, { status: 500 });
  await logMutation({
    collection: "projetos", entityId: projetoId, op: "update",
    userEmail: session.user.email ?? null, after: { linkRemovido: body.linkId },
  });
  revalidatePath(`/painel/projetos/${projetoId}`);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5.3:** `npm run typecheck` → PASS
- [ ] **Step 5.4:** Commit `feat(portal): APIs painel gerar/revogar link + links de preview`

### Task 6: APIs públicas do portal (token)

**Files:**
- Create: `src/lib/portal-auth.ts` (helper resolve token→projeto)
- Create: `src/app/api/portal/arquivo/[id]/route.ts`
- Create: `src/app/api/portal/comentario/route.ts`
- Create: `src/app/api/portal/cliente/route.ts`
- Modify: `src/app/api/projetos/arquivo/route.ts` (aceitar text/html)

- [ ] **Step 6.1:** `src/lib/portal-auth.ts`:

```ts
import "server-only";
import { hashPortalToken } from "./portal-token";
import { getProjetoByPortalTokenHash } from "./mongodb/portal";
import type { Projeto } from "@/types/projeto";

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

/** Resolve um token de portal num projecto activo. null = inválido/revogado. */
export async function resolvePortalToken(token: unknown): Promise<Projeto | null> {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return null;
  return getProjetoByPortalTokenHash(hashPortalToken(token));
}
```

- [ ] **Step 6.2:** `src/app/api/portal/arquivo/[id]/route.ts` — GET com `?t=<token>`. Igual ao proxy do painel mas auth por token; inline para imagem/pdf/html; HTML com CSP sandbox:

```ts
import { NextResponse } from "next/server";
import { resolvePortalToken } from "@/lib/portal-auth";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function isInline(tipo: string): boolean {
  return tipo.startsWith("image/") || tipo === "application/pdf" || tipo === "text/html";
}

export async function GET(request: Request, { params }: { params: Params }) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`portal-arquivo:${ip}`, 60, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t");
  const projeto = await resolvePortalToken(token);
  if (!projeto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const arquivo = projeto.arquivos?.find((a) => a.id === id);
  if (!arquivo?.blobUrl) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(arquivo.blobUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Falha ao obter ficheiro" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Falha ao obter ficheiro" }, { status: 502 });
  }

  const disposition = isInline(arquivo.tipo) ? "inline" : "attachment";
  const headers = new Headers();
  headers.set("Content-Type", arquivo.tipo || "application/octet-stream");
  headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(arquivo.nome)}"`);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  if (arquivo.tipo === "text/html") {
    // Mockups HTML correm em origem opaca: sem cookies/storage/fetch same-origin.
    // Cinto duplo com o atributo sandbox do iframe no portal.
    headers.set("Content-Security-Policy", "sandbox allow-scripts");
    headers.set("X-Content-Type-Options", "nosniff");
  }

  return new NextResponse(upstream.body, { status: 200, headers });
}
```

- [ ] **Step 6.3:** `src/app/api/portal/comentario/route.ts` — POST `{t, texto, arquivoId?, linkId?, autorNome?, website}`:

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { resolvePortalToken } from "@/lib/portal-auth";
import { comentarioSchema } from "@/lib/validation-portal";
import { insertComentario, countComentariosRecentes } from "@/lib/mongodb/portal";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { sendPushToAll } from "@/lib/push";
import type { PortalComentario } from "@/types/portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`portal-comentario:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — mesmo padrão do formulário de contacto (200 silencioso).
  if (typeof body.website === "string" && body.website !== "") {
    return NextResponse.json({ ok: true });
  }

  const projeto = await resolvePortalToken(body.t);
  if (!projeto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const parsed = comentarioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Comentário inválido" }, { status: 400 });

  // Tecto por projecto/24h — trava flood distribuído que o limite por IP não vê.
  if ((await countComentariosRecentes(projeto.id)) >= 50) {
    return NextResponse.json({ error: "Limite de comentários atingido" }, { status: 429 });
  }

  const arquivoId =
    parsed.data.arquivoId && projeto.arquivos?.some((a) => a.id === parsed.data.arquivoId)
      ? parsed.data.arquivoId
      : null;
  const linkId =
    parsed.data.linkId && projeto.links?.some((k) => k.id === parsed.data.linkId)
      ? parsed.data.linkId
      : null;

  const comentario: PortalComentario = {
    id: randomUUID(),
    projetoId: projeto.id,
    arquivoId,
    linkId,
    autorNome: parsed.data.autorNome?.trim() || projeto.clienteNome || null,
    texto: parsed.data.texto,
    criadoEm: new Date().toISOString(),
    lidoEm: null,
    ip,
  };
  await insertComentario(comentario);

  try {
    await sendPushToAll({
      title: "💬 Comentário no portal",
      body: `${comentario.autorNome ?? "Cliente"} — ${projeto.titulo}`,
      url: `/painel/projetos/${projeto.id}`,
    });
  } catch (e) {
    console.error("push comentário falhou:", e);
  }

  revalidatePath(`/painel/projetos/${projeto.id}`);
  return NextResponse.json({ ok: true, comentario: { id: comentario.id, texto: comentario.texto, criadoEm: comentario.criadoEm } });
}
```

- [ ] **Step 6.4:** `src/app/api/portal/cliente/route.ts` — PATCH `{t, dados}`:

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolvePortalToken } from "@/lib/portal-auth";
import { clientePatchSchema } from "@/lib/validation-portal";
import { getClienteById, upsertCliente } from "@/lib/mongodb/clientes";
import { toPortalCliente } from "@/lib/portal-dto";
import { rateLimitDistributed, getClientIp } from "@/lib/rate-limit";
import { logMutation } from "@/lib/mongodb/mutation-audit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimitDistributed(`portal-cliente:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { t?: unknown; dados?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projeto = await resolvePortalToken(body.t);
  if (!projeto) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!projeto.clienteId) return NextResponse.json({ error: "Projeto sem ficha de cliente" }, { status: 400 });

  const parsed = clientePatchSchema.safeParse(body.dados);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const patch = parsed.data;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const cliente = await getClienteById(projeto.clienteId);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const atualizado = { ...cliente, ...patch };
  try {
    await upsertCliente(atualizado);
  } catch (e: unknown) {
    // Índices únicos de email/nif → 11000 duplicate key.
    const code = e && typeof e === "object" && "code" in e ? (e as { code?: number }).code : undefined;
    if (code === 11000) {
      return NextResponse.json({ error: "Email ou NIF já registado noutro cliente" }, { status: 409 });
    }
    throw e;
  }

  await logMutation({
    collection: "clientes", entityId: cliente.id, op: "update",
    userEmail: `portal:${projeto.id}`,
    before: toPortalCliente(cliente), after: toPortalCliente(atualizado),
  });

  revalidatePath(`/painel/clientes/${cliente.id}`);
  return NextResponse.json({ cliente: toPortalCliente(atualizado) });
}
```

- [ ] **Step 6.5:** Em `src/app/api/projetos/arquivo/route.ts`, adicionar ao `EXT_BY_MIME`:

```ts
  "text/html": "html",
```

(comentário do bloco passa a mencionar mockups; MAX_BYTES mantém 10MB)

- [ ] **Step 6.6:** `npm run typecheck` → PASS
- [ ] **Step 6.7:** Commit `feat(portal): APIs públicas (proxy ficheiros, comentários, ficha)`

### Task 7: Página do portal `/p/[token]`

**Files:**
- Create: `src/app/p/[token]/page.tsx` (server)
- Create: `src/components/portal/PreviewFrame.tsx` (client)
- Create: `src/components/portal/ComentarioForm.tsx` (client)
- Create: `src/components/portal/FichaClienteForm.tsx` (client)
- Modify: `src/app/robots.ts` (disallow `/p/`)

Design: página standalone (herda root layout: fontes Oasis + globals.css), fundo claro, cartões; sem Header/Footer do site. Secções: marca RedDune → título+estado → valores → entregáveis (arquivos + links, cada um com PreviewFrame quando inline e ComentarioForm) → comentários gerais → ficha.

- [ ] **Step 7.1:** `src/components/portal/PreviewFrame.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = { src: string; title: string; sandbox?: boolean };

/** Preview colapsável em iframe. sandbox=true para mockups HTML nossos. */
export function PreviewFrame({ src, title, sandbox }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-[#d6422a] hover:underline"
        >
          {open ? "Fechar pré-visualização" : "Pré-visualizar aqui"}
        </button>
        <a href={src} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
          Abrir em nova janela ↗
        </a>
      </div>
      {open && (
        <iframe
          src={src}
          title={title}
          {...(sandbox ? { sandbox: "allow-scripts" } : {})}
          className="mt-3 w-full rounded-lg border bg-white"
          style={{ height: "70vh" }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7.2:** `src/components/portal/ComentarioForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { token: string; arquivoId?: string; linkId?: string; compact?: boolean };

export function ComentarioForm({ token, arquivoId, linkId, compact }: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"idle" | "sending" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEstado("sending");
    setErro(null);
    try {
      const res = await fetch("/api/portal/comentario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, texto, arquivoId, linkId, website: "" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível enviar.");
        setEstado("erro");
        return;
      }
      setTexto("");
      setEstado("ok");
      router.refresh();
    } catch {
      setErro("Não foi possível enviar.");
      setEstado("erro");
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={2000}
        rows={compact ? 2 : 3}
        placeholder="Deixa aqui a tua opinião ou sugestão…"
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d6422a]/40"
      />
      {/* honeypot invisível */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={estado === "sending" || !texto.trim()}
          className="rounded-lg bg-[#d6422a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {estado === "sending" ? "A enviar…" : "Enviar comentário"}
        </button>
        {estado === "ok" && <span className="text-sm text-emerald-700">Recebido ✓</span>}
        {erro && <span className="text-sm text-rose-700">{erro}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 7.3:** `src/components/portal/FichaClienteForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { PortalClienteDTO } from "@/lib/portal-dto";

type Props = { token: string; cliente: PortalClienteDTO };

const CAMPOS: { key: keyof PortalClienteDTO; label: string; type?: string; placeholder: string }[] = [
  { key: "nome", label: "Nome", placeholder: "O teu nome" },
  { key: "email", label: "Email", type: "email", placeholder: "email@exemplo.pt" },
  { key: "telefone", label: "Telemóvel", type: "tel", placeholder: "9xx xxx xxx" },
  { key: "morada", label: "Morada", placeholder: "Rua, nº, código postal, localidade" },
  { key: "nif", label: "NIF", placeholder: "Para factura (9 dígitos)" },
];

export function FichaClienteForm({ token, cliente }: Props) {
  const [dados, setDados] = useState<PortalClienteDTO>(cliente);
  const [estado, setEstado] = useState<"idle" | "saving" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("saving");
    setErro(null);
    const patch: Record<string, string | null> = {};
    for (const { key } of CAMPOS) {
      const v = (dados[key] ?? "").toString().trim();
      const original = (cliente[key] ?? "").toString().trim();
      if (v !== original) patch[key] = key === "nome" ? v || original : v || null;
    }
    if (Object.keys(patch).length === 0) {
      setEstado("idle");
      return;
    }
    try {
      const res = await fetch("/api/portal/cliente", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, dados: patch }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível guardar.");
        setEstado("erro");
        return;
      }
      setEstado("ok");
    } catch {
      setErro("Não foi possível guardar.");
      setEstado("erro");
    }
  }

  return (
    <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
      {CAMPOS.map(({ key, label, type, placeholder }) => (
        <label key={key} className={key === "morada" ? "sm:col-span-2" : ""}>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
            {!(dados[key] ?? "").toString().trim() && (
              <span className="ml-2 font-normal normal-case tracking-normal text-[#d6422a]">por preencher</span>
            )}
          </span>
          <input
            type={type ?? "text"}
            value={dados[key] ?? ""}
            onChange={(e) => setDados((d) => ({ ...d, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d6422a]/40"
          />
        </label>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={estado === "saving"}
          className="rounded-lg border border-[#d6422a] px-4 py-2 text-sm font-semibold text-[#d6422a] hover:bg-[#d6422a]/5 disabled:opacity-50"
        >
          {estado === "saving" ? "A guardar…" : "Guardar os meus dados"}
        </button>
        {estado === "ok" && <span className="text-sm text-emerald-700">Guardado ✓</span>}
        {erro && <span className="text-sm text-rose-700">{erro}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 7.4:** `src/app/p/[token]/page.tsx` (server; `notFound()` se token inválido; monta DTOs; secções; formata € em pt-PT):

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolvePortalToken } from "@/lib/portal-auth";
import { getClienteById } from "@/lib/mongodb/clientes";
import { getPagamentosByProjeto } from "@/lib/mongodb/pagamentos";
import { getComentariosByProjeto } from "@/lib/mongodb/portal";
import { toPortalProjeto, toPortalCliente } from "@/lib/portal-dto";
import { PreviewFrame } from "@/components/portal/PreviewFrame";
import { ComentarioForm } from "@/components/portal/ComentarioForm";
import { FichaClienteForm } from "@/components/portal/FichaClienteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "O teu projecto · RedDune Solutions",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

const eur = (n: number) => `${n.toLocaleString("pt-PT")} €`;
const dataPt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }) : null;

export default async function PortalPage({ params }: { params: Params }) {
  const { token } = await params;
  const projeto = await resolvePortalToken(token);
  if (!projeto) notFound();

  const [cliente, pagamentos, comentarios] = await Promise.all([
    projeto.clienteId ? getClienteById(projeto.clienteId) : Promise.resolve(null),
    getPagamentosByProjeto(projeto.id),
    getComentariosByProjeto(projeto.id),
  ]);
  const dto = toPortalProjeto(projeto, pagamentos);
  const arquivoSrc = (id: string) => `/api/portal/arquivo/${id}?t=${encodeURIComponent(token)}`;

  return (
    <main className="min-h-screen bg-[#faf6f1] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Marca */}
        <header className="flex items-center justify-between">
          <p className="font-headline text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            RedDune <span className="text-[#d6422a]">Solutions</span>
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portal do cliente</p>
        </header>

        {/* Projecto */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">O teu projecto</p>
          <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {dto.titulo}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[#d6422a]/10 px-3 py-1 font-semibold text-[#d6422a]">{dto.statusLabel}</span>
            {dto.tipoLabels.map((t) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{t}</span>
            ))}
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {dto.prazo && <Info label="Prazo previsto" value={dataPt(dto.prazo)!} />}
            {dto.garantiaAte && <Info label="Garantia até" value={dataPt(dto.garantiaAte)!} />}
            {dto.hardware?.marca && <Info label="Equipamento" value={[dto.hardware.marca, dto.hardware.modelo].filter(Boolean).join(" ")} />}
          </dl>
        </section>

        {/* Valores */}
        {dto.valores && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valores</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <Kpi label="Total" value={eur(dto.valores.orcado)} />
              <Kpi label="Pago" value={eur(dto.valores.pago)} />
              <Kpi label="Em falta" value={eur(dto.valores.emFalta)} accent={dto.valores.emFalta > 0} />
            </div>
            {dto.valores.categorias.length > 0 && (
              <ul className="mt-4 space-y-1 border-t pt-3 text-sm">
                {dto.valores.categorias.map((c) => (
                  <li key={c.label} className="flex justify-between">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium">{eur(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Entregáveis */}
        {(dto.arquivos.length > 0 || dto.links.length > 0) && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entregáveis</h2>
            {dto.links.map((k) => (
              <article key={k.id} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
                <p className="font-semibold">{k.label}</p>
                <PreviewFrame src={k.url} title={k.label} />
                <ComentarioForm token={token} linkId={k.id} compact />
              </article>
            ))}
            {dto.arquivos.map((a) => (
              <article key={a.id} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold break-all">{a.nome}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{Math.max(1, Math.round(a.tamanho / 1024))} KB</p>
                </div>
                {a.tipo.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={arquivoSrc(a.id)} alt={a.nome} className="max-h-[70vh] w-auto rounded-lg border" />
                ) : a.tipo === "text/html" ? (
                  <PreviewFrame src={arquivoSrc(a.id)} title={a.nome} sandbox />
                ) : a.tipo === "application/pdf" ? (
                  <PreviewFrame src={arquivoSrc(a.id)} title={a.nome} />
                ) : (
                  <a href={arquivoSrc(a.id)} className="text-sm font-semibold text-[#d6422a] hover:underline">
                    Descarregar ↓
                  </a>
                )}
                <ComentarioForm token={token} arquivoId={a.id} compact />
              </article>
            ))}
          </section>
        )}

        {/* Comentários */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Opiniões e sugestões
          </h2>
          <ComentarioForm token={token} />
          {comentarios.length > 0 && (
            <ul className="space-y-3 border-t pt-4">
              {comentarios.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.autorNome ?? "Cliente"}</span>
                    {" · "}
                    {dataPt(c.criadoEm)}
                  </p>
                  <p className="whitespace-pre-wrap">{c.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ficha */}
        {cliente && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Os teus dados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirma ou completa os teus dados — ajudam-nos a facturar e a contactar-te.
              </p>
            </div>
            <FichaClienteForm token={token} cliente={toPortalCliente(cliente)} />
          </section>
        )}

        <footer className="pb-6 text-center text-xs text-muted-foreground">
          Dúvidas? Escreve-nos: reddunesolutions@gmail.com
        </footer>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 px-2 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="text-lg font-bold" style={accent ? { color: "#d6422a" } : undefined}>{value}</p>
    </div>
  );
}
```

- [ ] **Step 7.5:** `robots.ts`: disallow ganha `"/p/"`:

```ts
      disallow: ["/api/", "/painel", "/painel/", "/entrar", "/entrar/", "/p/"],
```

- [ ] **Step 7.6:** `npm run typecheck` + `npm run lint` → PASS
- [ ] **Step 7.7:** Commit `feat(portal): página pública /p/[token]`

### Task 8: Secção "Portal do cliente" no painel

**Files:**
- Create: `src/components/painel/PortalSection.tsx` (client)
- Create: `src/app/api/projetos/comentarios/route.ts` (POST marcar lido; sessão)
- Modify: `src/app/(painel)/painel/projetos/[id]/page.tsx`

- [ ] **Step 8.1:** `src/app/api/projetos/comentarios/route.ts`:

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { marcarComentarioLido } from "@/lib/mongodb/portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { comentarioId?: string; projetoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.comentarioId) return NextResponse.json({ error: "comentarioId em falta" }, { status: 400 });

  const ok = await marcarComentarioLido(body.comentarioId);
  if (body.projetoId) revalidatePath(`/painel/projetos/${body.projetoId}`);
  return NextResponse.json({ ok });
}
```

- [ ] **Step 8.2:** `src/components/painel/PortalSection.tsx` — client component com: estado do portal (activo/inactivo), gerar/regenerar (mostra link completo UMA vez + copiar), revogar (confirm), gestão de links (add/remove), lista de comentários (badge não-lidos + marcar lido). Usa `useToast` + `safeJsonPost` (padrões da casa). Código completo:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, MessageSquare, Plus, RefreshCw, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { safeJsonPost } from "@/lib/safe-fetch";
import type { ProjetoLink } from "@/types/projeto";
import type { PortalComentario } from "@/types/portal";

type Props = {
  projetoId: string;
  portalAtivo: boolean;
  links: ProjetoLink[];
  comentarios: PortalComentario[];
};

export function PortalSection({ projetoId, portalAtivo, links, comentarios }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [tokenGerado, setTokenGerado] = useState<string | null>(null);
  const [novoLabel, setNovoLabel] = useState("");
  const [novoUrl, setNovoUrl] = useState("");

  const naoLidos = comentarios.filter((c) => !c.lidoEm).length;
  const linkCompleto = tokenGerado ? `${window.location.origin}/p/${tokenGerado}` : null;

  async function gerar() {
    setBusy(true);
    const res = await safeJsonPost("/api/projetos/portal", { projetoId, action: "gerar" });
    setBusy(false);
    if (!res.ok) return toast({ title: "Erro", description: res.error, variant: "destructive" });
    setTokenGerado((res.data as { token: string }).token);
    router.refresh();
  }

  async function revogar() {
    if (!window.confirm("Revogar o link do portal? O cliente deixa de conseguir aceder.")) return;
    setBusy(true);
    const res = await safeJsonPost("/api/projetos/portal", { projetoId, action: "revogar" });
    setBusy(false);
    if (!res.ok) return toast({ title: "Erro", description: res.error, variant: "destructive" });
    setTokenGerado(null);
    router.refresh();
  }

  async function copiar() {
    if (!linkCompleto) return;
    await navigator.clipboard.writeText(linkCompleto);
    toast({ title: "Link copiado" });
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await safeJsonPost("/api/projetos/links", { projetoId, action: "add", label: novoLabel, url: novoUrl });
    setBusy(false);
    if (!res.ok) return toast({ title: "Erro", description: res.error, variant: "destructive" });
    setNovoLabel("");
    setNovoUrl("");
    router.refresh();
  }

  async function removeLink(linkId: string) {
    const res = await safeJsonPost("/api/projetos/links", { projetoId, action: "remove", linkId });
    if (!res.ok) return toast({ title: "Erro", description: res.error, variant: "destructive" });
    router.refresh();
  }

  async function marcarLido(comentarioId: string) {
    const res = await safeJsonPost("/api/projetos/comentarios", { comentarioId, projetoId });
    if (!res.ok) return toast({ title: "Erro", description: res.error, variant: "destructive" });
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          Portal do cliente
          {naoLidos > 0 && (
            <span className="rounded-full bg-[#d6422a] px-2 py-0.5 text-[10px] font-bold text-white">
              {naoLidos} novo{naoLidos === 1 ? "" : "s"}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={gerar} disabled={busy}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {portalAtivo ? "Regenerar link" : "Gerar link"}
          </Button>
          {portalAtivo && (
            <Button size="sm" variant="outline" onClick={revogar} disabled={busy}>
              Revogar
            </Button>
          )}
        </div>
      </div>

      {tokenGerado && linkCompleto && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-medium text-amber-900">
            Guarda este link agora — só é mostrado uma vez:
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs">{linkCompleto}</code>
            <Button size="sm" variant="outline" onClick={copiar}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar
            </Button>
          </div>
        </div>
      )}

      {portalAtivo && !tokenGerado && (
        <p className="text-sm text-muted-foreground">
          Portal activo. O link foi mostrado quando o geraste — se o perdeste, regenera (o antigo deixa de funcionar).
        </p>
      )}
      {!portalAtivo && !tokenGerado && (
        <p className="text-sm text-muted-foreground">
          Sem portal. Gera um link secreto e envia ao cliente por WhatsApp/email.
        </p>
      )}

      {/* Links de preview */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Links de preview (Vercel/Pages)
        </p>
        {links.map((k) => (
          <div key={k.id} className="flex items-center gap-2 text-sm">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{k.label}</span>
            <a href={k.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-muted-foreground hover:underline">
              {k.url}
            </a>
            <Button size="sm" variant="ghost" onClick={() => removeLink(k.id)} aria-label={`Remover ${k.label}`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <form onSubmit={addLink} className="flex flex-wrap items-center gap-2">
          <Input value={novoLabel} onChange={(e) => setNovoLabel(e.target.value)} placeholder="Nome (ex.: Protótipo v2)" className="h-8 w-44 text-sm" />
          <Input value={novoUrl} onChange={(e) => setNovoUrl(e.target.value)} placeholder="https://…" className="h-8 min-w-0 flex-1 text-sm" />
          <Button size="sm" variant="outline" type="submit" disabled={busy || !novoLabel.trim() || !novoUrl.trim()}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Adicionar
          </Button>
        </form>
      </div>

      {/* Comentários */}
      {comentarios.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Comentários do cliente
          </p>
          <ul className="space-y-2">
            {comentarios.map((c) => (
              <li key={c.id} className={`rounded-lg border p-3 text-sm ${c.lidoEm ? "opacity-70" : "border-[#d6422a]/40 bg-[#d6422a]/5"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.autorNome ?? "Cliente"}</span>
                    {" · "}
                    {new Date(c.criadoEm).toLocaleString("pt-PT")}
                  </p>
                  {!c.lidoEm && (
                    <Button size="sm" variant="ghost" onClick={() => marcarLido(c.id)}>
                      Marcar lido
                    </Button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 8.3:** Em `projetos/[id]/page.tsx`: importar `PortalSection` + `getComentariosByProjeto`; acrescentar `getComentariosByProjeto(id)` ao `Promise.all`; renderizar `<PortalSection projetoId={projeto.id} portalAtivo={!!projeto.portal && !projeto.portal.revogadoEm} links={projeto.links ?? []} comentarios={comentarios} />` a seguir a `<ArquivosCard …/>`.

- [ ] **Step 8.4:** `npm run typecheck` + `npm run lint` → PASS
- [ ] **Step 8.5:** Commit `feat(painel): secção portal do cliente (link, previews, comentários)`

### Task 9: Verificação final

- [ ] **Step 9.1:** `npm test` → todos PASS
- [ ] **Step 9.2:** `npm run typecheck` + `npm run lint` → PASS
- [ ] **Step 9.3:** `npm run build` → PASS
- [ ] **Step 9.4:** Verificação manual em dev (se env local com Mongo disponível): gerar link no painel → abrir `/p/<token>` → ver secções → comentar → ver comentário no painel → revogar → `/p/<token>` dá 404
- [ ] **Step 9.5:** Revisão adversarial (workflow multi-agente) focada em: fuga de campos no DTO, auth por token nas 3 APIs públicas, sandbox do HTML, whitelist da ficha
- [ ] **Step 9.6:** Commit final; **SEM push** (deploy só quando o Iuri mandar)

## Self-review do plano

- Cobertura do spec: acesso/token ✓ · visibilidade allowlist ✓ · valores por categoria ✓ · HTML sandbox + links ✓ · comentários+push ✓ · ficha editável ✓ · painel gerir ✓ · noindex/robots ✓ · índices ✓ · testes ✓. `empresa`/`telemovel` ajustados à realidade do tipo `Cliente` (nota no topo).
- Sem placeholders: código completo em todos os ficheiros novos.
- Consistência de tipos verificada (ProjetoLink/ProjetoPortal/PortalComentario usados de forma igual nas tasks 1/4/5/6/7/8).
