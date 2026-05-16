import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logAuthEvent } from "@/lib/mongodb/audit";

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
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/entrar",
    error: "/entrar",
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

        const allowed = getAllowedEmails();
        if (!allowed.has(email)) {
          await logAuthEvent({
            email,
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
