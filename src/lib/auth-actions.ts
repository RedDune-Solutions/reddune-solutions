"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false as const, error: "Email e password obrigatórios" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/painel",
    });

    if (!result || result?.ok === false) {
      return {
        ok: false as const,
        error: "Credenciais inválidas.",
      };
    }

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("CredentialsSignin") || message.includes("Credentials")) {
      return { ok: false as const, error: "Credenciais inválidas." };
    }
    return {
      ok: false as const,
      error: "Não foi possível entrar. Tenta de novo.",
    };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
