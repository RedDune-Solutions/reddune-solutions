"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Trash2, Pencil, Briefcase, ExternalLink, Star } from "lucide-react";
import { PORTFOLIO_CATEGORIA_LABEL } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PortfolioForm } from "./PortfolioForm";
import type { PortfolioItem } from "@/types/portfolio";

type Props = {
  items: PortfolioItem[];
};

export function PortfolioClient({ items }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Apagar trabalho?")) return;
    await fetch(`/api/portfolio/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  function handleSaved() {
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {items.length} trabalho{items.length !== 1 ? "s" : ""}
        </p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Novo trabalho
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Novo trabalho</SheetTitle>
            </SheetHeader>
            <PortfolioForm item={null} onSaved={handleSaved} onCancel={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Sem trabalhos publicados.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/painel/portfolio/${item.id}`}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 block"
            >
              <div className="relative aspect-video bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title.pt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Briefcase className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">{item.title.pt}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.categoria ? (
                    <span className="inline-flex items-center text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {PORTFOLIO_CATEGORIA_LABEL[item.categoria]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                      Sem categoria
                    </span>
                  )}
                  {item.destaqueLanding && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-ember/10 text-ember">
                      <Star className="h-2.5 w-2.5" aria-hidden="true" />
                      Landing
                    </span>
                  )}
                </div>
                {item.url && (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.url}</span>
                  </p>
                )}
                <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-flex items-center text-xs text-muted-foreground">
                    <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
                    Editar
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="ml-auto text-muted-foreground hover:text-destructive p-1 rounded"
                    aria-label="Apagar"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
