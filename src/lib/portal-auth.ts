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
