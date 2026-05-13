"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  CalendarDays,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV = [
  { href: "/painel", label: "Visão geral", Icon: LayoutDashboard, exact: true },
  { href: "/painel/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/painel/clientes", label: "Clientes", Icon: Users },
  { href: "/painel/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/painel/relatorios", label: "Relatórios", Icon: BarChart3 },
];

type Props = {
  user: { name?: string | null; email?: string | null };
};

export function Sidebar({ user }: Props) {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <aside className="hidden lg:flex h-screen sticky top-0 w-64 flex-col border-r border-dune-deep/10 bg-cream text-ink">
      <div className="px-6 pt-7 pb-5 border-b border-dune-deep/10">
        <Link
          href="/"
          aria-label="Voltar ao site público"
          className="inline-flex items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt="Reddune Solutions"
            width={120}
            height={38}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
          Painel interno
        </p>
      </div>

      <nav className="flex-1 px-3 py-5" aria-label="Navegação principal">
        <ul className="space-y-1">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "border-l-2",
                    active
                      ? "bg-ember/10 text-ember border-ember"
                      : "border-transparent text-ink-soft hover:bg-cream-deep hover:text-ink"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-ember" : "text-ink-mute group-hover:text-ink"
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
            className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-soft hover:bg-cream-deep hover:text-ink transition-colors"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Ver site público
          </Link>
        </div>
      </nav>

      <div className="border-t border-dune-deep/10 px-4 py-4 bg-sand-warm/40">
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
          <SignOutButton className="w-full justify-start text-ink-soft hover:text-ember" />
        </div>
      </div>
    </aside>
  );
}
