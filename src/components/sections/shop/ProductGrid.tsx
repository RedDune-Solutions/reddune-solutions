"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ShopFilters, type CategoryValue, type ConditionValue } from "./ShopFilters";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type {
  Product,
  ProductCategory,
  ProductCondition,
} from "@/types/product";

type Props = {
  products: Product[];
};

const getCategoryKey = (v: ProductCategory) => `${v.pt}:::${v.en}`;
const getConditionKey = (v: ProductCondition) => `${v.pt}:::${v.en}`;

export function ProductGrid({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryValue>("all");
  const [condition, setCondition] = useState<ConditionValue>("all");
  const t = useTranslations("ShopPage");
  const locale = useLocale() === "en" ? "en" : "pt";

  const availableCategories = useMemo(() => {
    const cats = new Map<string, ProductCategory>();
    products.forEach((p) => cats.set(getCategoryKey(p.category), p.category));
    return Array.from(cats.values());
  }, [products]);

  const availableConditions = useMemo(() => {
    const conds = new Map<string, ProductCondition>();
    products.forEach((p) =>
      conds.set(getConditionKey(p.condition), p.condition),
    );
    return Array.from(conds.values());
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (category !== "all") {
      result = result.filter((p) => getCategoryKey(p.category) === category);
    }
    if (condition !== "all") {
      result = result.filter((p) => getConditionKey(p.condition) === condition);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name[locale].toLowerCase().includes(query) ||
          p.description[locale].toLowerCase().includes(query),
      );
    }
    return result;
  }, [products, category, condition, search, locale]);

  const isFiltering =
    Boolean(search.trim()) || category !== "all" || condition !== "all";

  return (
    <div className="mx-auto w-full max-w-content px-8">
      <ShopFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        condition={condition}
        onConditionChange={setCondition}
        locale={locale}
        availableCategories={availableCategories}
        availableConditions={availableConditions}
      />

      {filtered.length === 0 ? (
        <ShopEmptyState filtering={isFiltering} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <Reveal key={product.id}>
              <ProductCard product={product} locale={locale} />
            </Reveal>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="sr-only">
          {isFiltering ? t("noResults") : t("emptyState")}
        </p>
      )}
    </div>
  );
}

function ShopEmptyState({ filtering }: { filtering: boolean }) {
  const t = useTranslations("ShopPage");
  return (
    <Reveal>
      <div
        className={cn(
          "mx-auto max-w-[640px] text-center",
          "rounded-card bg-sand-warm/70",
          "px-10 py-16 mt-6",
        )}
      >
        <div
          className={cn(
            "mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center",
            "rounded-full bg-ink text-cream",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M3 9l1-5h16l1 5" />
            <path d="M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9" />
            <path d="M9 13h6" />
          </svg>
        </div>
        <h3 className="font-display text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink mb-3">
          {filtering ? t("noResults") : t("emptyState")}
        </h3>
        <p className="text-[15px] leading-[1.55] text-ink-soft mb-7">
          {filtering
            ? "Tenta limpar os filtros ou pesquisar por outro termo."
            : "A loja está em preparação — novos produtos estarão disponíveis em breve. Fala connosco se procuras algo específico."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={waLink("Olá! Procuro um produto específico: ")}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-3 rounded-btn",
              "bg-ink text-cream px-7 py-4",
              "text-[14px] font-semibold",
              "transition-all duration-300",
              "hover:bg-ember hover:scale-[1.04]",
            )}
          >
            Pedir produto
            <ArrowRight
              className="size-[15px] shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
          </a>
          <Link
            href="/contacto?from=shop"
            className={cn(
              "inline-flex items-center",
              "rounded-btn border border-dune-deep/15 bg-white/60",
              "px-6 py-4",
              "text-[14px] font-medium text-ink",
              "transition-all duration-300",
              "hover:border-ember hover:bg-white/80 hover:text-ember",
            )}
          >
            Falar connosco
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
