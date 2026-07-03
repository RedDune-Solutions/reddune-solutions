import { randomBytes, createHash } from "node:crypto";

// Token do portal: bearer secret mostrado UMA vez ao gerar; na BD guarda-se
// apenas o SHA-256 (fuga da BD não expõe links activos).
export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
