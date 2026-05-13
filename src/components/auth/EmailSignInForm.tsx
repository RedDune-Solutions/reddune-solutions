"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { signInAction } from "@/lib/auth-actions";

export function EmailSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Endereço de email inválido.");
      return;
    }

    const formData = new FormData();
    formData.append("email", trimmed);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.ok === false) {
        setError(result.error);
      } else {
        router.push("/entrar/verificar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="o.teu@email.pt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 text-base font-semibold"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            A enviar link...
          </>
        ) : (
          "Receber link de acesso"
        )}
      </Button>

      <p className="text-xs text-muted-foreground leading-relaxed text-center">
        Vamos enviar um link mágico para o teu email. Acede a partir do mesmo dispositivo.
      </p>
    </form>
  );
}
