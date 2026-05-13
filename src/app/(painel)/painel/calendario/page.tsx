import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllTarefas, getSyncMeta } from "@/lib/mongodb/tarefas";
import { Topbar } from "@/components/painel/Topbar";
import { MonthCalendar } from "@/components/painel/MonthCalendar";
import { Button } from "@/components/ui/button";
import { monthKey, parseMonthKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ m?: string }>;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [tarefas, meta, params] = await Promise.all([
    getAllTarefas(),
    getSyncMeta(),
    searchParams,
  ]);

  const today = new Date();
  const requested = params.m ? parseMonthKey(params.m) : null;
  const target = requested ?? { year: today.getFullYear(), monthIndex: today.getMonth() };

  const prev = new Date(target.year, target.monthIndex - 1, 1);
  const next = new Date(target.year, target.monthIndex + 1, 1);

  return (
    <>
      <Topbar
        title="Calendário"
        description="Tarefas com prazo agendado."
        syncedAt={meta?.updatedAt}
        syncCount={meta?.count}
      />

      <div className="px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
              <Link href={`/painel/calendario?m=${monthKey(prev)}`}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <h2 className="font-headline text-xl md:text-2xl font-semibold tracking-tight">
              {MONTH_NAMES[target.monthIndex]} {target.year}
            </h2>
            <Button asChild variant="outline" size="sm" className="h-9 bg-surface">
              <Link href={`/painel/calendario?m=${monthKey(next)}`}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/painel/calendario?m=${monthKey(today)}`}>
              Hoje
            </Link>
          </Button>
        </div>

        <MonthCalendar
          year={target.year}
          monthIndex={target.monthIndex}
          tarefas={tarefas}
        />
      </div>
    </>
  );
}
