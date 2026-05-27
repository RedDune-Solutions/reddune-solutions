import {
  LayoutDashboard,
  ListChecks,
  Users,
  CalendarDays,
  BarChart3,
  FolderKanban,
  AlertTriangle,
  Tag,
  ShoppingBag,
  Briefcase,
  Settings,
  History,
  type LucideIcon,
} from "lucide-react";

export type PainelNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
};

export const PAINEL_NAV_DEFAULT: PainelNavItem[] = [
  { href: "/painel", label: "Visão geral", Icon: LayoutDashboard, exact: true },
  { href: "/painel/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/painel/projetos", label: "Projectos", Icon: FolderKanban },
  { href: "/painel/clientes", label: "Clientes", Icon: Users },
  { href: "/painel/dividas", label: "Dívidas", Icon: AlertTriangle },
  { href: "/painel/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/painel/relatorios", label: "Relatórios", Icon: BarChart3 },
  { href: "/painel/precos", label: "Serviços", Icon: Tag },
  { href: "/painel/loja", label: "Loja", Icon: ShoppingBag },
  { href: "/painel/portfolio", label: "Portfólio", Icon: Briefcase },
  { href: "/painel/auditoria", label: "Auditoria", Icon: History },
  { href: "/painel/definicoes", label: "Definições", Icon: Settings },
];

export const TAB_ORDER_KEY = "painel.tabOrder";
export const TAB_ORDER_EVENT = "painel:tabOrderChanged";

/**
 * Aplica ordem custom (array de hrefs) ao NAV default. Itens não listados
 * ficam no fim na ordem default. Hrefs inválidos são ignorados.
 */
export function applyTabOrder(
  order: string[] | null,
  nav: PainelNavItem[] = PAINEL_NAV_DEFAULT
): PainelNavItem[] {
  if (!order || order.length === 0) return nav;
  const byHref = new Map(nav.map((n) => [n.href, n]));
  const result: PainelNavItem[] = [];
  const seen = new Set<string>();
  for (const href of order) {
    const item = byHref.get(href);
    if (item && !seen.has(href)) {
      result.push(item);
      seen.add(href);
    }
  }
  for (const item of nav) {
    if (!seen.has(item.href)) result.push(item);
  }
  return result;
}

export function readTabOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TAB_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((s) => typeof s === "string")
      ? (parsed as string[])
      : null;
  } catch {
    return null;
  }
}

export function writeTabOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order));
  window.dispatchEvent(new CustomEvent(TAB_ORDER_EVENT));
}

export function clearTabOrder(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TAB_ORDER_KEY);
  window.dispatchEvent(new CustomEvent(TAB_ORDER_EVENT));
}
