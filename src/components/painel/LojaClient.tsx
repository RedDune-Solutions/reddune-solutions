"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil, Trash, Search, Package, ShoppingBag, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductForm } from "./ProductForm";
import { conditionMeta, type Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  products: Product[];
};

export function LojaClient({ products }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category?.pt) set.add(p.category.pt);
    return [...set].sort();
  }, [products]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category?.pt !== cat) return false;
      if (query && !(p.name.pt.toLowerCase().includes(query) || p.category?.pt?.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [products, cat, q]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: "Apagar produto?",
      description: "Esta acção remove o produto da loja e apaga as imagens associadas. Não pode ser desfeita.",
      confirmLabel: "Apagar",
      tone: "destructive",
    });
    if (!ok) return;
    setBusyId(id);
    const res = await safeDelete(`/api/products/${encodeURIComponent(id)}`);
    if (!res.ok) {
      setBusyId(null);
      toast({ title: "Erro a apagar produto", description: res.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.refresh());
  }

  function handleSaved() {
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      {/* Filtros */}
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="tabs">
          <button className="active">Catálogo <span className="num">{products.length}</span></button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="btn primary">
              <span>Novo produto</span>
              <span className="arr-circle"><Plus className="ic" aria-hidden="true" /></span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Novo produto</SheetTitle>
            </SheetHeader>
            <ProductForm product={null} onSaved={handleSaved} onCancel={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="filterbar">
        <button type="button" onClick={() => setCat("all")} className={cn("chip", cat === "all" && "active")}>
          <Package className="ic" aria-hidden="true" /> Todas
        </button>
        {categorias.map((c) => (
          <button key={c} type="button" onClick={() => setCat(cat === c ? "all" : c)} className={cn("chip", cat === c && "active")}>
            {c}
          </button>
        ))}
        <div className="search-mini">
          <Search className="ic" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, categoria…" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="ic"><ShoppingBag aria-hidden="true" /></div>
          <div className="t">{products.length === 0 ? "Sem produtos" : "Sem resultados"}</div>
          <div className="desc">{products.length === 0 ? "Cria o primeiro." : "Ajusta os filtros."}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="tile-grid">
          {filtered.map((p) => (
            <div key={p.id} className="tile">
              <div className="img">
                {p.imageUrls[0] ? (
                  <Image src={p.imageUrls[0]} alt={p.name.pt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" style={{ position: "absolute", inset: 0 }} />
                ) : (
                  <span className="ph">sem imagem</span>
                )}
                {p.featured && <span className="pill feat">Destaque</span>}
                {!p.available && <span className="pill" style={{ background: "var(--ink)", color: "#faf4e3" }}>Oculto</span>}
              </div>
              <div className="body">
                <div className="row between" style={{ gap: 6 }}>
                  <span className="meta">{p.category?.pt ?? "—"}</span>
                  {(() => {
                    const cm = conditionMeta(p.condition?.pt);
                    return (
                      <span className="badge" style={{ background: cm.bg, color: cm.color }}>
                        <span className="dot" /> {cm.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="t">{p.name.pt}</div>
                <div className="row between" style={{ marginTop: 4 }}>
                  <span className="price">{p.price.toFixed(2)}€</span>
                  <span className={cn("badge", p.available ? "terminado" : "cancelado")}>
                    <span className="dot" /> {p.available ? "Disponível" : "Oculto"}
                  </span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <Link href={`/painel/loja/${p.id}`} className="btn ghost tiny" style={{ flex: 1, justifyContent: "center" }}>
                    <Pencil className="ic" aria-hidden="true" /> Editar
                  </Link>
                  <button type="button" onClick={(e) => handleDelete(p.id, e)} disabled={busyId === p.id} className="btn ghost tiny icon" aria-label="Apagar">
                    {busyId === p.id ? <Loader2 className="ic animate-spin" aria-hidden="true" /> : <Trash className="ic" aria-hidden="true" />}
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
