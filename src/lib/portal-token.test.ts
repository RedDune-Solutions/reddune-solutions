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
