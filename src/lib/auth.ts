import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logAuthEvent } from "@/lib/mongodb/audit";
import { authConfig as edgeAuthConfig } from "@/lib/auth.config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

// Throttle de brute-force do login. In-memory, best-effort por instância em
// serverless (sem store distribuído por agora — ver revert 233aa27). Mesmo
// assim eleva muito a barra vs. zero protecção.
const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000; // 8 tentativas / 5 min por IP

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
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        // Throttle por IP ANTES de validar credenciais — limita brute-force.
        const ip = request ? getClientIp(request) : "unknown";
        if (!rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS).allowed) {
          await logAuthEvent({
            email,
            ip,
            type: "signin-rejected",
            details: { reason: "rate-limited" },
          });
          return null;
        }

        const allowed = getAllowedEmails();
        if (!allowed.has(email)) {
          await logAuthEvent({
            email,
            ip,
            type: "signin-rejected",
            details: { reason: "not-allowlisted" },
          });
          return null;
        }

        const expected = process.env.AUTH_PASSWORD;
        if (!expected) {
          console.error("AUTH_PASSWORD não definido");
          return null;
        }

        if (!timingSafeEqual(password, expected)) {
          await logAuthEvent({
            email,
            ip,
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
