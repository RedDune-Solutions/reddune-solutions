export type SafeFetchResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export async function safeFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro de rede";
    return { ok: false, error: msg };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Resposta sem JSON, mantém body = null
  }

  if (!res.ok) {
    const error =
      (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : null) ?? `HTTP ${res.status}`;
    return { ok: false, error, status: res.status };
  }

  return { ok: true, data: body as T };
}

export async function safeJsonPost<T = unknown>(
  url: string,
  body: unknown
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function safeDelete<T = unknown>(url: string): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, { method: "DELETE" });
}
