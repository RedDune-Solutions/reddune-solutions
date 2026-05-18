"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type View = "mes" | "semana" | "dia";

const VIEWS: { value: View; label: string }[] = [
  { value: "mes", label: "Mês" },
  { value: "semana", label: "Semana" },
  { value: "dia", label: "Dia" },
];

export function CalendarViewToggle({ current }: { current: View }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(v: View) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("view", v);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-dune-deep/15 bg-white/70 p-1">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          type="button"
          onClick={() => go(v.value)}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            current === v.value
              ? "bg-ink text-cream"
              : "text-ink-soft hover:bg-ember/10"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
