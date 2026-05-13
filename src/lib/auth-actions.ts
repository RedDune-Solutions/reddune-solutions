"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Email obrigatório" };
  }

  try {
    await signIn("resend", {
      email,
      redirectTo: "/painel",
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return {
      ok: false as const,
      error: "Não foi possível enviar o link. Tenta de novo.",
    };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
