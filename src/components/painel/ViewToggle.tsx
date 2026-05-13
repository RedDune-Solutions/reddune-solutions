"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type PainelView = "lista" | "kanban";

type Props = {
  current: PainelView;
  className?: string;
};

const OPTIONS: Array<{ value: PainelView; label: string; Icon: typeof List }> = [
  { value: "kanban", label: "Kanban", Icon: LayoutGrid },
  { value: "lista", label: "Lista", Icon: List },
];

export function ViewToggle({ current, className }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const onSelect = useCallback(
    (value: PainelView) => {
      const usp = new URLSearchParams(params?.toString() ?? "");
      usp.set("view", value);
      router.replace(`?${usp.toString()}`, { scroll: false });
    },
    [router, params]
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-btn border border-dune-deep/10 bg-cream/60 p-0.5",
        className
      )}
      role="tablist"
      aria-label="Vista"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-btn px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-white text-ink shadow-xs"
                : "text-ink-soft hover:text-ember"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
