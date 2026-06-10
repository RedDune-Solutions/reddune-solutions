import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// In-memory rate limiter (per edge instance). Acts as a global safety net for
// every /api route; sensitive routes keep their own stricter per-route limits.
// Not shared across instances — for production-grade limits, back this with a
// shared store (Redis/Vercel KV).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const API_LIMIT = 200;
const API_WINDOW_MS = 60 * 1000;

// Tighter limit for the credentials sign-in to slow down brute-force. Other
// /api/auth paths (e.g. session polling) keep the generous global limit.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 60 * 1000;

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, resetAt: existing.resetAt };
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    const ip = getClientIp(req);

    // Brute-force protection on the password sign-in endpoint.
    if (pathname.startsWith("/api/auth/callback/credentials")) {
      const login = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
      if (!login.allowed) {
        return NextResponse.json(
          { error: "Too many login attempts" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(
                (login.resetAt - Date.now()) / 1000
              ).toString(),
            },
          }
        );
      }
    }

    const rl = checkRateLimit(`api:${ip}`, API_LIMIT, API_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rl.resetAt - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }
  }

  if (pathname.startsWith("/painel")) {
    if (!req.auth?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/entrar";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/painel/:path*", "/api/:path*"],
};
