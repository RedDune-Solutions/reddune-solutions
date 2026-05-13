import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { render } from "@react-email/render";
import clientPromise from "@/lib/mongodb/client";
import { getResend } from "@/lib/resend";
import { MagicLinkEmail } from "@/components/templates/MagicLinkEmail";
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

const MAGIC_LINK_MAX_AGE_SECONDS = 10 * 60; // 10 min — link curto, uso único
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 dias — browser fica logado

const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME,
  }),
  session: {
    strategy: "database",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60, // refresh sessão se activo no último dia
  },
  pages: {
    signIn: "/entrar",
    verifyRequest: "/entrar/verificar",
    error: "/entrar",
  },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "Reddune Solutions <onboarding@resend.dev>",
      maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const host = new URL(url).host;
        const html = await render(MagicLinkEmail({ url, host }));
        const text = `Reddune Solutions — entrar no painel\n\nClica no link abaixo para entrar. Válido 10 minutos, uso único:\n${url}\n\nSe não pediste este acesso, ignora este e-mail.`;

        const { error } = await getResend().emails.send({
          from: provider.from as string,
          to: email,
          subject: `Entrar no painel da Reddune Solutions`,
          html,
          text,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message ?? "unknown"}`);
        }

        await logAuthEvent({
          email,
          type: "magic-link-request",
          details: { maxAgeSeconds: MAGIC_LINK_MAX_AGE_SECONDS },
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowed = getAllowedEmails();
      if (allowed.size === 0) {
        await logAuthEvent({
          email: user.email,
          type: "signin-rejected",
          details: { reason: "allowlist-empty" },
        });
        return false;
      }
      const email = user.email?.toLowerCase();
      if (!email || !allowed.has(email)) {
        await logAuthEvent({
          email: user.email,
          type: "signin-rejected",
          details: { reason: "not-allowlisted" },
        });
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
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
