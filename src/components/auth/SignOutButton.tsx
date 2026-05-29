"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth-actions";

type Props = {
  className?: string;
  iconOnly?: boolean;
};

export function SignOutButton({ className, iconOnly }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form action={() => startTransition(() => signOutAction())}>
      <button
        type="submit"
        disabled={pending}
        aria-label="Sair"
        title="Sair"
        className={cn(iconOnly ? undefined : "btn ghost", className)}
      >
        {pending ? (
          <Loader2 className={cn(!iconOnly && "ic", "h-4 w-4 animate-spin")} aria-hidden="true" />
        ) : (
          <LogOut className={cn(!iconOnly && "ic", "h-4 w-4")} aria-hidden="true" />
        )}
        {!iconOnly && <span>Sair</span>}
      </button>
    </form>
  );
}
