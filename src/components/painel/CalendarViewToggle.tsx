"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
    <div className="view-tabs">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          type="button"
          onClick={() => go(v.value)}
          className={current === v.value ? "on" : undefined}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
