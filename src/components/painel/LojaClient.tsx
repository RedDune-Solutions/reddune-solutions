"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Pencil, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductForm } from "./ProductForm";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
};

export function LojaClient({ products }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setOpen(true);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Apagar produto?")) return;
    await fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  function handleSaved() {
    setOpen(false);
    setEditing(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {products.length} produto{products.length !== 1 ? "s" : ""}
        </p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Novo produto
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>{editing ? "Editar produto" : "Novo produto"}</SheetTitle>
            </SheetHeader>
            <ProductForm product={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Sem produtos. Cria o primeiro.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => openEdit(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEdit(p);
                }
              }}
              role="button"
              tabIndex={0}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="relative aspect-video bg-muted">
                {p.imageUrls[0] ? (
                  <Image
                    src={p.imageUrls[0]}
                    alt={p.name.pt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {p.featured && (
                    <span className="inline-flex items-center bg-amber-500/90 text-white rounded-full p-1">
                      <Star className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5",
                      p.available
                        ? "bg-emerald-500/90 text-white"
                        : "bg-slate-500/90 text-white"
                    )}
                  >
                    {p.available ? "Disponível" : "Oculto"}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">{p.name.pt}</h3>
                  <span className="font-mono text-sm tabular-nums shrink-0">{p.price.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.category.pt} · {p.condition.pt}
                </p>
                <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-flex items-center text-xs text-muted-foreground">
                    <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
                    Editar
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(p.id, e)}
                    className="ml-auto text-muted-foreground hover:text-destructive p-1 rounded"
                    aria-label="Apagar"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
