"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { TarefaPublic } from "@/types/tarefa";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function TarefasTable({ tarefas }: { tarefas: TarefaPublic[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");

  const columns = useMemo<ColumnDef<TarefaPublic>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: "Tarefa",
        cell: ({ row }) => (
          <Link
            href={`/painel/tarefas/${row.original.id}`}
            className="font-medium text-ink hover:text-ember transition-colors"
          >
            {row.original.titulo}
          </Link>
        ),
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ row }) => row.original.cliente ?? "—",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "proximaAccao",
        header: "Próxima ação",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-sm text-ink-soft max-w-md">
            {row.original.proximaAccao ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "prazo",
        header: "Prazo",
        cell: ({ row }) => (
          <span className="tabular-nums text-ink-soft">{formatDate(row.original.prazo)}</span>
        ),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase tracking-tight text-ink-mute">
            {row.original.tipo ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!filter.trim()) return tarefas;
    const q = filter.toLowerCase();
    return tarefas.filter(
      (t) =>
        t.titulo.toLowerCase().includes(q) ||
        t.cliente?.toLowerCase().includes(q) ||
        t.proximaAccao?.toLowerCase().includes(q) ||
        t.tipo?.toLowerCase().includes(q)
    );
  }, [tarefas, filter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Pesquisar tarefas..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10 bg-white/70 border-dune-deep/15 rounded-btn focus-visible:ring-ember"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-dune-deep/10 bg-sand-warm/70 shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft"
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          header.column.getCanSort() && "cursor-pointer hover:text-ember"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-dune-deep/8">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-ink-mute">
                    Sem tarefas para mostrar.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-ember/5",
                      idx % 2 === 1 && "bg-white/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-tight text-ink-mute tabular-nums">
        {filteredData.length} de {tarefas.length} tarefas
      </p>
    </div>
  );
}
