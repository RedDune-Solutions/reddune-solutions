"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Eye, Trash, Briefcase, Star, Loader2 } from "lucide-react";
import { PORTFOLIO_CATEGORIA_LABEL } from "@/types/portfolio";
import { SERVICO_SLUG } from "@/types/servico";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PortfolioForm } from "./PortfolioForm";
import type { PortfolioItem, PortfolioCategoria } from "@/types/portfolio";
import { cn } from "@/lib/utils";
import { safeDelete } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Props = {
  items: PortfolioItem[];
};

type Filter = "all" | PortfolioCategoria | "destaque";

export function PortfolioClient({ items }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, destaque: 0 };
    for (const s of SERVICO_SLUG) c[s] = 0;
    for (const it of items) {
      if (it.categoria) c[it.categoria] = (c[it.categoria] ?? 0) + 1;
      if (it.destaqueLanding) c.destaque += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "destaque") return items.filter((i) => i.destaqueLanding);
    return items.filter((i) => i.categoria === filter);
  }, [items, filter]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: "Apagar trabalho?",
      description: "Esta acção remove o trabalho do portfólio público.",
      confirmLabel: "Apagar",
      tone: "destructive",
    });
    if (!ok) return;
    setBusyId(id);
    const res = await safeDelete(`/api/portfolio/${encodeURIComponent(id)}`);
    if (!res.ok) {
      setBusyId(null);
      toast({ title: "Erro a apagar trabalho", description: res.error, variant: "destructive" });
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
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="tabs">
          <button type="button" onClick={() => setFilter("all")} className={filter === "all" ? "active" : undefined}>
            Todos <span className="num">{counts.all}</span>
          </button>
          {SERVICO_SLUG.map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={filter === s ? "active" : undefined}>
              {PORTFOLIO_CATEGORIA_LABEL[s]} <span className="num">{counts[s] ?? 0}</span>
            </button>
          ))}
          <button type="button" onClick={() => setFilter("destaque")} className={filter === "destaque" ? "active" : undefined}>
            Destaques <span className="num">{counts.destaque}</span>
          </button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="btn primary">
              <span>Adicionar trabalho</span>
              <span className="arr-circle"><Plus className="ic" aria-hidden="true" /></span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle>Novo trabalho</SheetTitle>
            </SheetHeader>
            <PortfolioForm item={null} onSaved={handleSaved} onCancel={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="ic"><Briefcase aria-hidden="true" /></div>
          <div className="t">{items.length === 0 ? "Sem trabalhos publicados" : "Sem resultados"}</div>
          <div className="desc">{items.length === 0 ? "Cria o primeiro." : "Ajusta o filtro."}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="tile-grid">
          {filtered.map((item) => (
            <div key={item.id} className="tile">
              <div className="img" style={{ aspectRatio: "1/1" }}>
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.title.pt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" style={{ position: "absolute", inset: 0 }} />
                ) : (
                  <span className="ph">sem capa</span>
                )}
                {item.destaqueLanding && (
                  <span className="pill feat">
                    <Star className="h-2.5 w-2.5" style={{ marginRight: 3 }} aria-hidden="true" /> Destaque
                  </span>
                )}
              </div>
              <div className="body">
                <div className="meta">{item.categoria ? PORTFOLIO_CATEGORIA_LABEL[item.categoria] : "Sem categoria"}</div>
                <div className="t">{item.title.pt}</div>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <Link href={`/painel/portfolio/${item.id}`} className="btn ghost tiny" style={{ flex: 1, justifyContent: "center" }}>
                    Editar
                  </Link>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn ghost tiny icon" aria-label="Ver no site">
                      <Eye className="ic" aria-hidden="true" />
                    </a>
                  )}
                  <button type="button" onClick={(e) => handleDelete(item.id, e)} disabled={busyId === item.id} className="btn ghost tiny icon" aria-label="Apagar">
                    {busyId === item.id ? <Loader2 className="ic animate-spin" aria-hidden="true" /> : <Trash className="ic" aria-hidden="true" />}
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
