import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractSandbox, SandboxError } from "./sandbox-extract";

function makeZip(files: Record<string, string>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(files)) entries[k] = strToU8(v);
  return zipSync(entries);
}

describe("extractSandbox", () => {
  it("extrai ficheiros e detecta index.html como entry", () => {
    const zip = makeZip({
      "index.html": "<h1>Olá</h1>",
      "styles.css": "body{color:red}",
      "assets/logo.png": "PNGDATA",
    });
    const r = extractSandbox(zip);
    expect(r.entry).toBe("index.html");
    expect(r.files.map((f) => f.path).sort()).toEqual(["assets/logo.png", "index.html", "styles.css"]);
    const css = r.files.find((f) => f.path === "styles.css")!;
    expect(css.mime).toBe("text/css");
  });

  it("descasca uma pasta-raiz única (projeto/index.html -> index.html)", () => {
    const zip = makeZip({
      "meu-site/index.html": "<h1>x</h1>",
      "meu-site/app.js": "console.log(1)",
    });
    const r = extractSandbox(zip);
    expect(r.entry).toBe("index.html");
    expect(r.files.map((f) => f.path).sort()).toEqual(["app.js", "index.html"]);
  });

  it("usa o primeiro .html como entry quando não há index.html", () => {
    const zip = makeZip({ "home.html": "<h1>h</h1>", "sobre.html": "<h1>s</h1>" });
    const r = extractSandbox(zip);
    expect(r.entry).toBe("home.html");
  });

  it("rejeita zip sem qualquer .html", () => {
    const zip = makeZip({ "leiame.txt": "só texto" });
    expect(() => extractSandbox(zip)).toThrow(SandboxError);
  });

  it("rejeita path traversal (../) e caminhos absolutos", () => {
    const zip = makeZip({ "index.html": "x", "../escape.txt": "mau" });
    expect(() => extractSandbox(zip)).toThrow(SandboxError);
    const zip2 = makeZip({ "index.html": "x", "/etc/passwd": "mau" });
    expect(() => extractSandbox(zip2)).toThrow(SandboxError);
  });

  it("rejeita demasiados ficheiros", () => {
    const many: Record<string, string> = { "index.html": "x" };
    for (let i = 0; i < 400; i++) many[`f${i}.txt`] = "y";
    expect(() => extractSandbox(makeZip(many), { maxFiles: 300 })).toThrow(SandboxError);
  });

  it("rejeita total descomprimido acima do limite", () => {
    const big = "a".repeat(2000);
    const zip = makeZip({ "index.html": "x", "big.txt": big });
    expect(() => extractSandbox(zip, { maxTotalBytes: 1000 })).toThrow(SandboxError);
  });

  it("rejeita paths duplicados após normalizar backslash (a/b.js + a\\b.js)", () => {
    const zip = makeZip({
      "site/index.html": "<h1>x</h1>",
      "site/app.js": "real",
      "site\\app.js": "evil",
    });
    expect(() => extractSandbox(zip)).toThrow(SandboxError);
  });

  it("rejeita antes de descomprimir quando o tamanho declarado excede o limite", () => {
    // 5KB reais mas limite de 1KB → o filtro rejeita pelo originalSize declarado.
    const zip = makeZip({ "index.html": "x", "big.txt": "a".repeat(5000) });
    expect(() => extractSandbox(zip, { maxTotalBytes: 1000 })).toThrow(SandboxError);
  });

  it("ignora entradas de diretório e ficheiros de sistema (__MACOSX, .DS_Store)", () => {
    const zip = makeZip({
      "index.html": "<h1>x</h1>",
      "__MACOSX/._index.html": "junk",
      ".DS_Store": "junk",
      "sub/": "",
    });
    const r = extractSandbox(zip);
    expect(r.files.map((f) => f.path)).toEqual(["index.html"]);
  });
});
