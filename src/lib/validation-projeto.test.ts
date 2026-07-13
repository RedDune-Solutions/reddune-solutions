import { describe, it, expect } from "vitest";
import { projetoInputSchema } from "./validation-projeto";

/**
 * Contrato do upsert parcial (/api/projetos/upsert): campo AUSENTE no payload
 * tem de sair do parse como `undefined` (a rota preserva o valor existente);
 * `null`/"" explícitos apagam. O bug: transforms/preprocess no schema
 * convertiam ausente→null, e um "Guardar custos" (payload só com
 * id/titulo/status/linhas) apagava cliente, responsável, tipo, categoria,
 * próxima acção e local do projecto.
 */
describe("projetoInputSchema — merge parcial", () => {
  const parcialCustos = {
    id: "p1",
    titulo: "Projecto X",
    status: "proximo",
    linhas: [],
    valorEstimado: 0,
  };

  it("campos ausentes ficam undefined (preservados pela rota)", () => {
    const parsed = projetoInputSchema.parse(parcialCustos);
    expect(parsed.clienteId).toBeUndefined();
    expect(parsed.clienteNome).toBeUndefined();
    expect(parsed.responsavel).toBeUndefined();
    expect(parsed.categoria).toBeUndefined();
    expect(parsed.tipo).toBeUndefined();
    expect(parsed.proximaAccao).toBeUndefined();
    expect(parsed.local).toBeUndefined();
  });

  it("null explícito continua a apagar", () => {
    const parsed = projetoInputSchema.parse({
      ...parcialCustos,
      clienteId: null,
      responsavel: null,
    });
    expect(parsed.clienteId).toBeNull();
    expect(parsed.responsavel).toBeNull();
  });

  it('"" nos selects (categoria/tipo/responsavel/local) limpa para null', () => {
    const parsed = projetoInputSchema.parse({
      ...parcialCustos,
      categoria: "",
      tipo: "",
      responsavel: "",
      local: "",
    });
    expect(parsed.categoria).toBeNull();
    expect(parsed.tipo).toBeNull();
    expect(parsed.responsavel).toBeNull();
    expect(parsed.local).toBeNull();
  });

  it("valores presentes passam intactos", () => {
    const parsed = projetoInputSchema.parse({
      ...parcialCustos,
      clienteId: "c9",
      clienteNome: "Bruna",
      responsavel: "eu",
    });
    expect(parsed.clienteId).toBe("c9");
    expect(parsed.clienteNome).toBe("Bruna");
    expect(parsed.responsavel).toBe("eu");
  });
});
