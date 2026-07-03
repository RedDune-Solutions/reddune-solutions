import { describe, it, expect } from "vitest";
import { comentarioSchema, clientePatchSchema, linkSchema } from "./validation-portal";

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
    expect(clientePatchSchema.safeParse({ criadoEm: "2020-01-01" }).success).toBe(false);
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

describe("linkSchema", () => {
  it("só aceita https", () => {
    expect(linkSchema.safeParse({ label: "Preview", url: "https://x.vercel.app" }).success).toBe(true);
    expect(linkSchema.safeParse({ label: "Preview", url: "http://x.vercel.app" }).success).toBe(false);
    expect(linkSchema.safeParse({ label: "Preview", url: "javascript:alert(1)" }).success).toBe(false);
  });
});
