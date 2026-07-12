"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Topbar } from "@/components/painel/Topbar";
import { ProductForm } from "./ProductForm";
import { conditionMeta, type Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  products: Product[];
};

type View = "disponiveis" | "ocultos" | "destaques";

export function LojaClient({ products }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("disponiveis");
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category?.pt) set.add(p.category.pt);
    return [...set].sort();
  }, [products]);

  const counts = useMemo(
    () => ({
      disponiveis: products.filter((p) => p.available).length,
      ocultos: products.filter((p) => !p.available).length,
      destaques: products.filter((p) => p.featured).length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (view === "disponiveis" && !p.available) return false;
      if (view === "ocultos" && p.available) return false;
      if (view === "destaques" && !p.featured) return false;
      if (cat !== "all" && p.category?.pt !== cat) return false;
      if (query && !(p.name.pt.toLowerCase().includes(query) || p.category?.pt?.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [products, view, cat, q]);

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

  const viewTab = (v: View, label: string, count: number) => (
    <button type="button" className={view === v ? "on" : undefined} onClick={() => setView(v)}>
      {label}
      {count > 0 && <span className="num">{count}</span>}
    </button>
  );

  return (
    <>
      <Topbar
        crumbs={["Loja"]}
        title="Loja"
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="btn-primary">
                <Plus className="ic" aria-hidden="true" /> Novo produto
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>Novo produto</SheetTitle>
              </SheetHeader>
              <ProductForm product={null} onSaved={handleSaved} onCancel={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        }
      />

      <div className="view-tabs" style={{ marginBottom: 18 }}>
        {viewTab("disponiveis", "Disponíveis", counts.disponiveis)}
        {viewTab("ocultos", "Ocultos", counts.ocultos)}
        {viewTab("destaques", "Destaques", counts.destaques)}
      </div>

      {(categorias.length > 0 || products.length > 0) && (
        <div className="chips">
          <button type="button" onClick={() => setCat("all")} className={cn("chip", cat === "all" && "on")}>
            Todas
          </button>
          {categorias.map((c) => (
            <button key={c} type="button" onClick={() => setCat(cat === c ? "all" : c)} className={cn("chip", cat === c && "on")}>
              {c}
            </button>
          ))}
          <input
            className="in-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome, categoria…"
            aria-label="Pesquisar produtos"
            style={{ marginLeft: "auto" }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <ShoppingBag aria-hidden="true" style={{ width: 22, height: 22, margin: "0 auto 8px" }} />
          <div className="t">{products.length === 0 ? "Sem produtos" : "Sem resultados"}</div>
          <div className="desc">{products.length === 0 ? "Cria o primeiro." : "Ajusta os filtros."}</div>
        </div>
      ) : (
        <div className="prod-grid">
          {filtered.map((p) => {
            const cm = conditionMeta(p.condition?.pt);
            return (
              <div key={p.id} className="prod group" style={{ position: "relative" }}>
                <Link href={`/painel/loja/${p.id}`} className="block">
                  <div className="ph">
                    {p.imageUrls[0] ? (
                      <Image
                        src={p.imageUrls[0]}
                        alt={p.name.pt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      "[ foto produto ]"
                    )}
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
                      {p.featured && <span className="pill warm">Destaque</span>}
                      {!p.available && <span className="pill mute">Oculto</span>}
                    </div>
                  </div>
                  <div className="pb">
                    <div className="pn">{p.name.pt}</div>
                    <div className="pt-row">
                      <span className="pp">{p.price.toLocaleString("pt-PT")} €</span>
                      <span className={cn("pill", cm.label === "Novo" ? "mute" : "ok")}>{cm.label}</span>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDelete(p.id, e)}
                  disabled={busyId === p.id}
                  className="icon-btn opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  style={{ position: "absolute", top: 8, right: 8, background: "var(--cream)" }}
                  aria-label={`Apagar ${p.name.pt}`}
                >
                  {busyId === p.id ? (
                    <Loader2 className="ic animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="ic" aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
