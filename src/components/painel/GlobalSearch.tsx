"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

type Props = {
  defaultValue?: string;
};

/**
 * GlobalSearch — Oasis v5 `.gsearch`. Submits to /painel/procurar?q=
 * (pesquisa global: projectos + clientes + tarefas).
 * ⌘K / Ctrl+K focuses the field.
 */
export function GlobalSearch({ defaultValue }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    startTransition(() => {
      router.push(trimmed ? `/painel/procurar?q=${encodeURIComponent(trimmed)}` : "/painel/procurar");
    });
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="gsearch">
      {pending ? (
        <Loader2 className="ic animate-spin" aria-hidden="true" />
      ) : (
        <Search className="ic" aria-hidden="true" />
      )}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Procurar projectos, clientes, tarefas…"
        aria-label="Procurar"
      />
      <span className="kbd" aria-hidden="true">⌘K</span>
    </form>
  );
}
