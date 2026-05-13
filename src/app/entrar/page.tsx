import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { Eyebrow } from "@/components/site/Eyebrow";

export const metadata: Metadata = {
  title: "Entrar — Reddune Solutions",
  description: "Acede ao painel interno da Reddune Solutions.",
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,hsl(var(--primary)/0.07),transparent_55%),radial-gradient(circle_at_90%_100%,hsl(var(--accent)/0.05),transparent_55%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            aria-label="Voltar à página inicial"
            className="inline-block"
          >
            <Image
              src="/logo.png"
              alt="Reddune Solutions"
              width={140}
              height={45}
              className="object-contain mx-auto h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-surface p-8 shadow-md">
          <Eyebrow>Painel interno</Eyebrow>
          <h1 className="mt-4 font-headline text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Entra no painel
          </h1>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Área da equipa Reddune. Sem passwords — recebes um link de
            acesso por email. Browser fica autenticado durante 30 dias.
          </p>

          <div className="mt-8">
            <EmailSignInForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso restrito à equipa Reddune. Se não tens autorização, contacta{" "}
          <a
            href="mailto:reddunesolutions@gmail.com"
            className="text-primary hover:underline"
          >
            reddunesolutions@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
