"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ExternalLink, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  PAINEL_NAV_DEFAULT,
  applyTabOrder,
  readTabOrder,
  TAB_ORDER_EVENT,
  type PainelNavItem,
} from "@/lib/painel-nav";

type Props = {
  user: { name?: string | null; email?: string | null };
};

export function MobileMenuButton({ user }: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [nav, setNav] = useState<PainelNavItem[]>(PAINEL_NAV_DEFAULT);

  useEffect(() => {
    const refresh = () => setNav(applyTabOrder(readTabOrder()));
    refresh();
    window.addEventListener(TAB_ORDER_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TAB_ORDER_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

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
            {nav.map(({ href, label, Icon, exact }) => {
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
            <p className="px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              Atalhos
            </p>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-soft hover:bg-cream-deep hover:text-ink transition-colors"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Ver site público
            </Link>
          </div>
        </nav>

        <div className="shrink-0 border-t border-dune-deep/10 bg-sand-warm/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ember/15 text-ember font-semibold text-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-ink">
                {user.name ?? "Equipa"}
              </p>
              <p className="text-xs text-ink-mute truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <SignOutButton className="w-full justify-start text-ink-soft hover:bg-ember hover:text-cream" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
