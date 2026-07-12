"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Eye, Trash2, Briefcase, Globe, Loader2 } from "lucide-react";
import { PORTFOLIO_CATEGORIA_LABEL } from "@/types/portfolio";
import { SERVICO_SLUG } from "@/types/servico";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Topbar } from "@/components/painel/Topbar";
import { PortfolioForm } from "./PortfolioForm";
import type { PortfolioItem, PortfolioCategoria } from "@/types/portfolio";
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

  const tab = (f: Filter, label: string, count: number) => (
    <button type="button" className={filter === f ? "on" : undefined} onClick={() => setFilter(f)}>
      {label}
      {count > 0 && <span className="num">{count}</span>}
    </button>
  );

  return (
    <>
      <Topbar
        crumbs={["Portfólio"]}
        title="Portfólio"
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="btn-primary">
                <Plus className="ic" aria-hidden="true" /> Novo trabalho
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>Novo trabalho</SheetTitle>
              </SheetHeader>
              <PortfolioForm item={null} onSaved={handleSaved} onCancel={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        }
      />

      <div className="note-strip">
        <Globe className="ic" aria-hidden="true" /> Controla a landing e a página /portfólio do site
      </div>

      <div className="view-tabs" style={{ marginBottom: 18 }}>
        {tab("all", "Todos", counts.all)}
        {SERVICO_SLUG.map((s) => (
          <button key={s} type="button" className={filter === s ? "on" : undefined} onClick={() => setFilter(s)}>
            {PORTFOLIO_CATEGORIA_LABEL[s]}
            {(counts[s] ?? 0) > 0 && <span className="num">{counts[s]}</span>}
          </button>
        ))}
        {tab("destaque", "Destaques", counts.destaque)}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <Briefcase aria-hidden="true" style={{ width: 22, height: 22, margin: "0 auto 8px" }} />
          <div className="t">{items.length === 0 ? "Sem trabalhos publicados" : "Sem resultados"}</div>
          <div className="desc">{items.length === 0 ? "Cria o primeiro." : "Ajusta o filtro."}</div>
        </div>
      ) : (
        <div className="port-grid">
          {filtered.map((item) => (
            <div key={item.id} className="port group" style={{ position: "relative" }}>
              <Link href={`/painel/portfolio/${item.id}`} className="block">
                <div className="ph">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title.pt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    "[ imagem trabalho ]"
                  )}
                  {item.destaqueLanding && (
                    <span className="pill warm" style={{ position: "absolute", top: 8, left: 8 }}>
                      Destaque
                    </span>
                  )}
                </div>
                <div className="pb">
                  <div className="pt">{item.categoria ? PORTFOLIO_CATEGORIA_LABEL[item.categoria] : "Sem categoria"}</div>
                  <div className="pn">{item.title.pt}</div>
                </div>
              </Link>
              <div
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}
              >
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-btn"
                    style={{ background: "var(--cream)" }}
                    aria-label={`Ver ${item.title.pt} no site`}
                  >
                    <Eye className="ic" aria-hidden="true" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  disabled={busyId === item.id}
                  className="icon-btn"
                  style={{ background: "var(--cream)" }}
                  aria-label={`Apagar ${item.title.pt}`}
                >
                  {busyId === item.id ? (
                    <Loader2 className="ic animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="ic" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
