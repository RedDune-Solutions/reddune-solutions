"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, FileText, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { safeFetch } from "@/lib/safe-fetch";

type NotificationItem = {
  id: string;
  type: "lead" | "audit";
  title: string;
  description: string;
  href: string;
  timestamp: string;
};

type NotificationsPayload = {
  unread: number;
  items: NotificationItem[];
};

/** Intervalo de polling — refresca o feed em segundo plano (60s). */
const POLL_MS = 60_000;

function fmtRelative(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}

/**
 * NotificationsBell — sino real (in-app, só leitura) da Topbar.
 *
 * Faz fetch a /api/notifications no mount e a cada 60s. O badge mostra `unread`
 * (leads por tratar). Clicar abre um dropdown (Radix) com os items reais, cada
 * um linkável (Link do next) para /painel/leads ou /painel/auditoria. Estado
 * vazio honesto. Nenhuma escrita na BD — deriva de dados existentes.
 */
export function NotificationsBell() {
  const [data, setData] = useState<NotificationsPayload | null>(null);

  const load = useCallback(async () => {
    const res = await safeFetch<NotificationsPayload>("/api/notifications");
    if (res.ok) setData(res.data);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];
  const hasBadge = unread > 0;
  const badgeLabel = unread > 9 ? "9+" : String(unread);

  const ariaLabel = hasBadge
    ? `Notificações, ${unread} ${unread === 1 ? "lead novo" : "leads novos"}`
    : "Notificações";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="btn ghost icon"
          aria-label={ariaLabel}
          type="button"
          style={{ position: "relative" }}
        >
          <Bell className="ic" aria-hidden="true" />
          {hasBadge && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--ember, #d6422a)",
                color: "#fff",
                fontSize: 9.5,
                fontWeight: 700,
                lineHeight: "16px",
                textAlign: "center",
                boxShadow: "0 0 0 2px var(--cream, #f7eedb)",
              }}
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-dune-deep/10">
          <span className="font-headline text-sm font-semibold text-ink">
            Notificações
          </span>
          {hasBadge && (
            <span className="text-[11px] font-medium text-ember">
              {unread} por tratar
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-sm font-medium text-ink">Sem novidades</div>
            <div className="mt-1 text-[12px] text-ink-soft">
              Novos leads e actividade aparecem aqui.
            </div>
          </div>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-2.5 px-3.5 py-2.5 outline-none transition-colors hover:bg-cream-deep focus-visible:bg-cream-deep"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        item.type === "lead"
                          ? "rgba(214, 66, 42, 0.12)"
                          : "var(--cream-deep, #efe3cd)",
                      color:
                        item.type === "lead"
                          ? "var(--ember, #d6422a)"
                          : "var(--ink-mute, #8a7a63)",
                    }}
                  >
                    {item.type === "lead" ? (
                      <UserPlus size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {item.title}
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {item.description}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] text-ink-mute">
                      {fmtRelative(item.timestamp)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
