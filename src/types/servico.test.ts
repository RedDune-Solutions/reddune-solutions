import { describe, it, expect } from "vitest";
import { formatPreco, type PriceLabels, type Servico } from "@/types/servico";

type PrecoInput = Parameters<typeof formatPreco>[0];

function servico(p: Partial<Servico>): PrecoInput {
  return {
    precoBase: null,
    precoMax: null,
    precoDesde: false,
    variantes: null,
    precoTexto: null,
    precoTextoI18n: null,
    nota: null,
    notaI18n: null,
    ...p,
  };
}

const PT: PriceLabels = { from: "desde", to: "a", onRequest: "Sob consulta" };
const EN: PriceLabels = { from: "from", to: "to", onRequest: "On request" };

/**
 * CONTRATO: `<b>` embrulha o TOKEN DE VALOR (número ou "Sob consulta") e mais
 * nada. Rótulos e notas ficam fora. É a regra que os content JSON escrevem à
 * mão ("Desktop <b>20–30€</b>") e que o CSS do design assume
 * (`.svc .meta-row .price b { color: var(--ember) }`).
 *
 * Quebrar isto foi o bug: as variantes bolddavam label+número, logo a linha
 * inteira saía a laranja e deixava de bater certo com as outras.
 */
describe("formatPreco — contrato do <b>", () => {
  it("bolda o número mas nunca o rótulo da variante", () => {
    const out = formatPreco(
      servico({
        variantes: [
          { label: "Torre", preco: 20, precoMax: 30 },
          { label: "Portátil", preco: 25, precoMax: 35 },
        ],
      }),
      PT,
    );
    expect(out).toBe("Torre <b>20€ a 30€</b> · Portátil <b>25€ a 35€</b>");
    expect(out).not.toContain("<b>Torre");
  });

  it("bolda o preço base sem tocar na nota", () => {
    const out = formatPreco(
      servico({ precoBase: 25, nota: "abatido se reparares" }),
      PT,
    );
    expect(out).toBe("<b>25€</b> · abatido se reparares");
  });

  it("deixa 'desde' fora do <b>", () => {
    expect(formatPreco(servico({ precoBase: 15, precoDesde: true }), PT)).toBe(
      "desde <b>15€</b>",
    );
  });

  it("bolda 'Sob consulta' — é o token de valor da linha", () => {
    expect(formatPreco(servico({}), PT)).toBe("<b>Sob consulta</b>");
    expect(formatPreco(servico({}), EN, "en")).toBe("<b>On request</b>");
  });

  it("variante sem rótulo não deixa espaço a mais", () => {
    expect(formatPreco(servico({ variantes: [{ label: "", preco: 40 }] }), PT)).toBe(
      "<b>40€</b>",
    );
  });
});

describe("formatPreco — i18n", () => {
  it("usa os rótulos EN e o label EN da variante", () => {
    const out = formatPreco(
      servico({
        variantes: [
          { label: "Torre", labelI18n: { pt: "Torre", en: "Desktop" }, preco: 20, precoMax: 30 },
        ],
      }),
      EN,
      "en",
    );
    expect(out).toBe("Desktop <b>20€ to 30€</b>");
  });

  it("cai para PT quando falta a tradução EM do label", () => {
    const out = formatPreco(
      servico({ variantes: [{ label: "Torre", preco: 20, precoMax: 30 }] }),
      EN,
      "en",
    );
    expect(out).toBe("Torre <b>20€ to 30€</b>");
  });

  it("traduz a nota quando notaI18n.en existe", () => {
    const out = formatPreco(
      servico({
        precoBase: 25,
        nota: "Portátil Sob Consulta",
        notaI18n: { pt: "Portátil Sob Consulta", en: "Laptop Upon Request" },
      }),
      EN,
      "en",
    );
    expect(out).toBe("<b>25€</b> · Laptop Upon Request");
  });

  /**
   * O ramo legacy: texto livre do admin, sem <b> e sem tradução se
   * `precoTextoI18n.en` estiver vazio. É porque estas linhas ficavam todas
   * cinzentas e em PT no site inglês. O painel larga o campo ao guardar.
   */
  it("precoTexto legacy fica em PT e sem <b> quando não tem EN", () => {
    const out = formatPreco(
      servico({ precoTexto: "Sob orçamento · recorrente" }),
      EN,
      "en",
    );
    expect(out).toBe("Sob orçamento · recorrente");
    expect(out).not.toContain("<b>");
  });

  it("precoTexto ganha precedência ao Sob consulta — daí ser preciso limpá-lo", () => {
    const out = formatPreco(servico({ precoTexto: "À parte · valor combinado" }), PT);
    expect(out).toBe("À parte · valor combinado");
  });

  it("limpo o precoTexto, a linha passa a Sob consulta traduzido + nota", () => {
    const out = formatPreco(
      servico({
        precoTexto: null,
        nota: "recorrente",
        notaI18n: { pt: "recorrente", en: "recurring" },
      }),
      EN,
      "en",
    );
    expect(out).toBe("<b>On request</b> · recurring");
  });
});
