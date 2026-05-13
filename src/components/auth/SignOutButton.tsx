"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";

export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(() => signOutAction());
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={className}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair
      </Button>
    </form>
  );
}
