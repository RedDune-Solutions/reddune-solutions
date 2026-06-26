import "server-only";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * Helpers partilhados para route handlers do painel.
 * Centralizam o envelope de resposta ({ error } / { ok }) e o check de
 * autenticação que antes estavam copiados em ~33 ficheiros — tornando
 * impossível esquecer o check de auth por construção.
 */

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized(): NextResponse {
  return apiError("Unauthorized", 401);
}

export function apiInvalidJson(): NextResponse {
  return apiError("Invalid JSON", 400);
}

export function apiInvalidPayload(issues: unknown): NextResponse {
  return NextResponse.json({ error: "Invalid payload", issues }, { status: 400 });
}

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export type AuthedSession = Session & { user: NonNullable<Session["user"]> };

/**
 * Envolve um route handler com o check de sessão. Devolve 401 se não houver
 * utilizador autenticado; caso contrário chama o handler com a sessão garantida.
 * Mantém a assinatura que o Next espera: (request, ...context).
 */
export function withAuth<Args extends unknown[]>(
  handler: (
    session: AuthedSession,
    request: Request,
    ...args: Args
  ) => Response | Promise<Response>
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    const session = await auth();
    if (!session?.user) return apiUnauthorized();
    return handler(session as AuthedSession, request, ...args);
  };
}

/** Tipo estrutural mínimo de um schema Zod (evita acoplar à versão do zod). */
type Parseable<T> = {
  safeParse: (data: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { issues: unknown } };
};

/**
 * Faz parse do body JSON e valida com o schema. Devolve uma união
 * discriminada: usar `if (!r.ok) return r.response;` no handler.
 */
export async function parseJson<T>(
  request: Request,
  schema: Parseable<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: apiInvalidJson() };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiInvalidPayload(parsed.error.issues) };
  }
  return { ok: true, data: parsed.data };
}
