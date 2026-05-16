import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config used by middleware.
 * MUST NOT import anything that uses Node-only APIs (MongoDB driver, fs, crypto.node).
 * Providers and DB-touching callbacks live in `auth.ts` (Node runtime).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/painel")) {
        return Boolean(auth?.user);
      }
      return true;
    },
  },
  trustHost: true,
};
