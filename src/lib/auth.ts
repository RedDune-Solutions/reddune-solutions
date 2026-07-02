import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { logAuthEvent } from "@/lib/mongodb/audit";
import { rateLimitDistributed } from "@/lib/rate-limit";
import { authConfig as edgeAuthConfig } from "@/lib/auth.config";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 60 * 1000;

/** IP do pedido a partir dos headers (Node runtime). Fail-open para "unknown". */
async function requestIp(): Promise<string> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return h.get("x-real-ip")?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

function getAllowedEmails(): Set<string> {
  const raw = process.env.AUTH_ALLOWED_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 dias

const authConfig: NextAuthConfig = {
  ...edgeAuthConfig,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        // Anti brute-force no PRÓPRIO authorize — cobre tanto o server action
        // (POST a /entrar, fora do matcher do middleware) como o callback REST.
        // Usa o limiter partilhado (Upstash -> Mongo -> memória), 10/min por IP.
        const ip = await requestIp();
        const rl = await rateLimitDistributed(
          `login:${ip}`,
          LOGIN_LIMIT,
          LOGIN_WINDOW_MS
        );
        if (!rl.allowed) {
          await logAuthEvent({
            email,
            type: "signin-rejected",
            details: { reason: "rate-limited" },
          });
          return null;
        }

        const allowed = getAllowedEmails();
        if (!allowed.has(email)) {
          await logAuthEvent({
            email,
            type: "signin-rejected",
            details: { reason: "not-allowlisted" },
          });
          return null;
        }

        // Preferir hash bcrypt (AUTH_PASSWORD_HASH); fallback a texto simples
        // (AUTH_PASSWORD) para não quebrar deploys existentes — com aviso.
        const hash = process.env.AUTH_PASSWORD_HASH;
        const expected = process.env.AUTH_PASSWORD;
        if (!hash && !expected) {
          console.error("Nem AUTH_PASSWORD_HASH nem AUTH_PASSWORD definidos");
          return null;
        }

        let valid = false;
        if (hash) {
          valid = await bcrypt.compare(password, hash);
        } else {
          console.warn(
            "AUTH_PASSWORD em texto simples — define AUTH_PASSWORD_HASH (bcrypt) para maior segurança."
          );
          valid = timingSafeEqual(password, expected!);
        }

        if (!valid) {
          await logAuthEvent({
            email,
            type: "signin-rejected",
            details: { reason: "wrong-password" },
          });
          return null;
        }

        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/painel")) {
        return Boolean(auth?.user);
      }
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      await logAuthEvent({
        userId: user.id,
        email: user.email,
        type: "signin-success",
      });
    },
    async signOut() {
      await logAuthEvent({ type: "signout" });
    },
  },
  trustHost: true,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
