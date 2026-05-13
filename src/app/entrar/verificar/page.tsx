import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";

export const metadata: Metadata = {
  title: "Verifica o email — Reddune Solutions",
  robots: { index: false, follow: false },
};

export default function VerificarPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,hsl(var(--primary)/0.07),transparent_55%),radial-gradient(circle_at_90%_100%,hsl(var(--accent)/0.05),transparent_55%)]"
      />

      <div className="relative w-full max-w-md text-center">
        <div className="mb-8">
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

        <div className="rounded-lg border border-border bg-surface p-10 shadow-md">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="mt-6 flex justify-center">
            <Eyebrow>Quase lá</Eyebrow>
          </div>

          <h1 className="mt-4 font-headline text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Verifica o teu email
          </h1>
          <p className="mt-3 text-sm text-ink-soft leading-relaxed">
            Enviámos-te um link de acesso. Abre o email e clica no botão para
            entrares.
            <br />O link é válido por 24 horas.
          </p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Não recebeste? Verifica a pasta de spam ou{" "}
          <Link href="/entrar" className="text-primary hover:underline">
            tenta de novo
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
