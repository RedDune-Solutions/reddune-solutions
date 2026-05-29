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
import { ArrowUpDown, Search } from "lucide-react";
import { InlineStatusSelect } from "./InlineStatusSelect";
import { TarefaRowMenu } from "./TarefaRowMenu";
import { PROJETO_TIPO_LABEL, type Projeto } from "@/types/projeto";
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

export function TarefasTable({ projetos }: { projetos: Projeto[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");

  const columns = useMemo<ColumnDef<Projeto>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: "Projeto",
        cell: ({ row }) => (
          <Link
            href={`/painel/projetos/${row.original.id}`}
            className="font-medium text-ink hover:text-ember transition-colors"
          >
            {row.original.titulo}
          </Link>
        ),
      },
      {
        accessorKey: "clienteNome",
        header: "Cliente",
        cell: ({ row }) =>
          row.original.clienteNome
            ? row.original.clienteId
              ? (
                <Link href={`/painel/clientes/${row.original.clienteId}`} className="hover:text-ember">
                  {row.original.clienteNome}
                </Link>
              )
              : row.original.clienteNome
            : "—",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <InlineStatusSelect projetoId={row.original.id} status={row.original.status} />
        ),
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
        cell: ({ row }) => {
          const p = row.original;
          const tags = p.tipos && p.tipos.length > 0 ? p.tipos : p.tipo ? [p.tipo] : [];
          if (tags.length === 0)
            return <span className="font-mono text-xs uppercase tracking-tight text-ink-mute">—</span>;
          const visible = tags.slice(0, 3);
          const overflow = tags.length - visible.length;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((t) => (
                <span key={t} className="font-mono text-[10px] uppercase tracking-tight bg-black/5 rounded px-1.5 py-0.5">
                  {PROJETO_TIPO_LABEL[t as import("@/types/projeto").ProjetoTipo] ?? t}
                </span>
              ))}
              {overflow > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-tight bg-black/5 rounded px-1.5 py-0.5">
                  +{overflow}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <TarefaRowMenu projeto={row.original} />,
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!filter.trim()) return projetos;
    const q = filter.toLowerCase();
    return projetos.filter(
      (p) =>
        p.titulo.toLowerCase().includes(q) ||
        p.clienteNome?.toLowerCase().includes(q) ||
        p.proximaAccao?.toLowerCase().includes(q) ||
        p.tipo?.toLowerCase().includes(q)
    );
  }, [projetos, filter]);

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
    <div className="col" style={{ gap: 16 }}>
      <div className="filterbar" style={{ maxWidth: 380 }}>
        <div className="search-mini" style={{ flex: 1 }}>
          <Search className="ic" aria-hidden="true" />
          <input
            type="search"
            placeholder="Procurar projecto, cliente, ID…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="card flat" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
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
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="muted" style={{ textAlign: "center", padding: "48px 0" }}>
                    Sem projetos para mostrar.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderTop: "1px solid rgba(90, 14, 14, 0.08)",
            background: "rgba(236, 223, 194, 0.3)",
          }}
        >
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
            {filteredData.length} de {projetos.length} projectos
          </span>
        </div>
      </div>
    </div>
  );
}
