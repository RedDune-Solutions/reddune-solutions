"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  defaultValue?: string;
};

export function GlobalSearch({ defaultValue }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    startTransition(() => {
      if (trimmed) {
        router.push(`/painel/tarefas?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/painel/tarefas");
      }
    });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="relative w-full max-w-xs"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
      </span>
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Pesquisar tarefas..."
        className="h-9 pl-8 pr-3 bg-white/70 border-dune-deep/15 rounded-btn focus-visible:ring-ember"
        aria-label="Pesquisar tarefas"
      />
    </form>
  );
}
