"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductCondition } from "@/types/product";

export type CategoryValue = string | "all";
export type ConditionValue = string | "all";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  category: CategoryValue;
  onCategoryChange: (v: CategoryValue) => void;
  condition: ConditionValue;
  onConditionChange: (v: ConditionValue) => void;
  locale: "pt" | "en";
  availableCategories: ProductCategory[];
  availableConditions: ProductCondition[];
  sticky?: boolean;
};

const getCategoryKey = (c: ProductCategory) => `${c.pt}:::${c.en}`;
const getConditionKey = (c: ProductCondition) => `${c.pt}:::${c.en}`;

/**
 * ShopFilters — Phase 5c Oasis filter bar.
 *
 * Sticky at top:24px when `sticky` is true. Search + category select + a row
 * of pill-style condition chips. Geist Mono labels.
 *
 * Port of `.loja-toolbar` + `.loja-conditions` from
 * `design-handoff/project/site/loja/index.html`.
 */
export function ShopFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  condition,
  onConditionChange,
  locale,
  availableCategories,
  availableConditions,
  sticky = true,
}: Props) {
  const t = useTranslations("ShopPage");

  return (
    <div
      data-shop-filters
      className={cn(
        "z-30 mb-8",
        sticky && "sticky top-6",
      )}
    >
      <div
        className={cn(
          "rounded-card bg-cream/85 backdrop-blur-xl",
          "border border-dune-deep/10",
          "px-5 py-4 shadow-warm",
        )}
      >
        <div
          className={cn(
            "grid items-center gap-3",
            "grid-cols-1 md:grid-cols-[1fr_auto_auto]",
          )}
        >
          {/* Search */}
          <label className="relative">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className={cn(
                "w-full rounded-btn bg-white/60 backdrop-blur",
                "border border-dune-deep/10",
                "pl-10 pr-3 py-2.5",
                "font-mono text-[12px] text-ink placeholder:text-ink-mute",
                "focus:outline-none focus:ring-2 focus:ring-ember/40 focus:border-ember/40",
              )}
            />
          </label>

          {/* Category */}
          {availableCategories.length > 0 && (
            <label className="relative">
              <span className="sr-only">{t("filters.categoryLabel")}</span>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value as CategoryValue)}
                className={cn(
                  "w-full rounded-btn bg-white/60 backdrop-blur",
                  "border border-dune-deep/10",
                  "pl-3 pr-8 py-2.5",
                  "font-mono text-[12px] uppercase tracking-[0.12em] text-ink",
                  "appearance-none cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-ember/40 focus:border-ember/40",
                )}
              >
                <option value="all">{t("filters.allCategories")}</option>
                {availableCategories.map((cat) => (
                  <option key={getCategoryKey(cat)} value={getCategoryKey(cat)}>
                    {cat[locale]}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-xs"
              >
                ▾
              </span>
            </label>
          )}

          {/* Condition chips */}
          {availableConditions.length > 0 && (
            <div
              role="group"
              aria-label={t("filters.conditionLabel")}
              className="flex items-center gap-2 flex-wrap"
            >
              <button
                type="button"
                onClick={() => onConditionChange("all")}
                className={cn(
                  "rounded-btn px-3.5 py-2",
                  "font-mono text-[11px] uppercase tracking-[0.15em]",
                  "transition-all duration-300",
                  condition === "all"
                    ? "bg-ink text-cream"
                    : "bg-white/60 border border-dune-deep/10 text-ink-soft hover:text-ink",
                )}
              >
                {t("filters.allConditions")}
              </button>
              {availableConditions.map((cond) => {
                const key = getConditionKey(cond);
                const active = condition === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onConditionChange(key)}
                    className={cn(
                      "rounded-btn px-3.5 py-2",
                      "font-mono text-[11px] uppercase tracking-[0.15em]",
                      "transition-all duration-300",
                      active
                        ? "bg-ink text-cream"
                        : "bg-white/60 border border-dune-deep/10 text-ink-soft hover:text-ink",
                    )}
                  >
                    {cond[locale]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
