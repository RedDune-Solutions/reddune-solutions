

export type LocalizedText = {
  pt: string;
  en: string;
};

export type ProductCondition = LocalizedText;
export type ProductCategory = LocalizedText;

export type Product = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: ProductCategory;
  condition: ProductCondition;
  price: number;
  imageUrls: string[];
  available: boolean;
  featured: boolean;
  createdAt: string;
};

/**
 * Tom visual + label normalizado por condição (Novo / Recondicionado / Segunda mão).
 * Aceita o texto cru (pt/en, maiúsc/minúsc) e devolve cores coerentes.
 */
export function conditionMeta(raw: string | null | undefined): { label: string; bg: string; color: string } {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "novo" || v === "new") {
    return { label: "Novo", bg: "rgba(74, 124, 89, 0.16)", color: "#3f6a4d" };
  }
  if (v === "recondicionado" || v === "refurbished") {
    return { label: "Recondicionado", bg: "#d8e3f0", color: "#2f4d6e" };
  }
  if (v === "segunda mão" || v === "segunda mao" || v === "second-hand" || v === "usado" || v === "used") {
    return { label: "Segunda mão", bg: "#fbe9c8", color: "#8a5a13" };
  }
  // fallback — capitaliza primeira letra
  const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "—";
  return { label, bg: "var(--cream-deep)", color: "var(--ink-soft)" };
}
