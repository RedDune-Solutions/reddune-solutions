"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  CalendarDays,
  BarChart3,
  ExternalLink,
  FolderKanban,
  AlertTriangle,
  StickyNote,
  ShoppingBag,
  Briefcase,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV = [
  { href: "/painel", label: "Visão geral", Icon: LayoutDashboard, exact: true },
  { href: "/painel/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/painel/projetos", label: "Projectos", Icon: FolderKanban },
  { href: "/painel/clientes", label: "Clientes", Icon: Users },
  { href: "/painel/dividas", label: "Dívidas", Icon: AlertTriangle },
  { href: "/painel/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/painel/relatorios", label: "Relatórios", Icon: BarChart3 },
  { href: "/painel/notas", label: "Notas", Icon: StickyNote },
  { href: "/painel/loja", label: "Loja", Icon: ShoppingBag },
  { href: "/painel/portfolio", label: "Portfólio", Icon: Briefcase },
];

export function MobileMenuButton() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-ink-mute hover:bg-cream-deep hover:text-ink transition-colors"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0 bg-cream border-dune-deep/10 flex flex-col">
        <SheetHeader className="shrink-0 px-4 pt-5 pb-4 border-b border-dune-deep/10">
          <SheetTitle asChild>
            <Link
              href="/"
              aria-label="Voltar ao site público"
              className="inline-flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/logo.png"
                alt="Reddune Solutions"
                width={120}
                height={38}
                className="h-8 w-auto object-contain"
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
          <ul className="space-y-1">
            {NAV.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-2",
                      active
                        ? "bg-ember/10 text-ember border-ember"
                        : "border-transparent text-ink-soft hover:bg-cream-deep hover:text-ink"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-ember" : "text-ink-mute"
                      )}
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-dune-deep/10">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-soft hover:bg-cream-deep hover:text-ink transition-colors"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Ver site público
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
