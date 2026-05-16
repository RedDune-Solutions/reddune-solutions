"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";

type Props = {
  className?: string;
  iconOnly?: boolean;
};

export function SignOutButton({ className, iconOnly }: Props) {
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
        size={iconOnly ? "icon" : "sm"}
        disabled={pending}
        className={className}
        aria-label={iconOnly ? "Sair" : undefined}
        title={iconOnly ? "Sair" : undefined}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && "Sair"}
      </Button>
    </form>
  );
}
