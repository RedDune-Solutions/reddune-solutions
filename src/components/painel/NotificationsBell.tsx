"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, FileText, UserPlus, MessageSquare, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { safeFetch } from "@/lib/safe-fetch";

type NotificationItem = {
  id: string;
  type: "lead" | "audit" | "comment";
  title: string;
  description: string;
  href: string;
  timestamp: string;
  unread: boolean;
};

type NotificationsPayload = {
  unread: number;
  items: NotificationItem[];
};

/** Intervalo de polling — refresca o feed em segundo plano (60s). */
const POLL_MS = 60_000;

// Notificações dispensadas (client-side): as notificações são derivadas de
// leads/comentários/audit, não há colecção própria, por isso "eliminar" é
// esconder localmente. Guardado por dispositivo; cap para não crescer sem fim.
const DISMISSED_KEY = "painel.notif.dismissed";
const DISMISSED_CAP = 300;

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-DISMISSED_CAP)));
  } catch {
    // ignore
  }
}

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
 * NotificationsBell — sino real (in-app) da Topbar.
 *
 * Fetch a /api/notifications no mount e a cada 60s. Cada item traz `unread`
 * (lead novo ou comentário por ler = novo; audit = histórico). O feed marca os
 * novos com um ponto e permite dispensar cada um (esconde localmente, não toca
 * na BD). O badge reflecte os por-tratar menos os que foram dispensados.
 */
export function NotificationsBell() {
  const [data, setData] = useState<NotificationsPayload | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(new Set(readDismissed()));
  }, []);

  const load = useCallback(async () => {
    const res = await safeFetch<NotificationsPayload>("/api/notifications");
    if (res.ok) setData(res.data);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const serverUnread = data?.unread ?? 0;

  // Itens visíveis = não dispensados. Badge = por-tratar do servidor menos os
  // itens por-tratar que o utilizador já dispensou (e ainda estão no feed).
  const visibleItems = allItems.filter((i) => !dismissed.has(i.id));
  const dismissedUnreadShown = allItems.filter((i) => i.unread && dismissed.has(i.id)).length;
  const badge = Math.max(0, serverUnread - dismissedUnreadShown);
  const hasBadge = badge > 0;

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeDismissed([...next]);
      return next;
    });
  }

  function dismissAll() {
    setDismissed((prev) => {
      const next = new Set(prev);
      for (const i of visibleItems) next.add(i.id);
      writeDismissed([...next]);
      return next;
    });
  }

  const ariaLabel = hasBadge ? `Notificações, ${badge} por tratar` : "Notificações";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={hasBadge ? "bell unread" : "bell"}
          aria-label={ariaLabel}
          type="button"
        >
          <Bell className="ic" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-dune-deep/10">
          <span className="font-headline text-sm font-semibold text-ink">
            Notificações
          </span>
          {visibleItems.length > 0 && (
            <button
              type="button"
              onClick={dismissAll}
              className="text-[11px] font-medium text-ink-soft hover:text-ember transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-sm font-medium text-ink">Sem novidades</div>
            <div className="mt-1 text-[12px] text-ink-soft">
              Novos leads e actividade aparecem aqui.
            </div>
          </div>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto py-1">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start transition-colors hover:bg-cream-deep"
              >
                <Link
                  href={item.href}
                  className="flex min-w-0 flex-1 items-start gap-2.5 px-3.5 py-2.5 outline-none focus-visible:bg-cream-deep"
                >
                  <span
                    aria-hidden="true"
                    className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        item.type === "lead" || item.type === "comment"
                          ? "rgba(214, 66, 42, 0.12)"
                          : "var(--cream-deep, #efe3cd)",
                      color:
                        item.type === "lead" || item.type === "comment"
                          ? "var(--ember, #d6422a)"
                          : "var(--ink-mute, #8a7a63)",
                    }}
                  >
                    {item.type === "lead" ? (
                      <UserPlus size={14} />
                    ) : item.type === "comment" ? (
                      <MessageSquare size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {item.unread && (
                        <span
                          aria-label="Nova"
                          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ember"
                        />
                      )}
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {item.title}
                      </span>
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {item.description}
                    </span>
                    <span className="mt-0.5 block text-[10.5px] text-ink-mute">
                      {fmtRelative(item.timestamp)}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dismiss(item.id);
                  }}
                  aria-label="Dispensar notificação"
                  title="Dispensar"
                  className="mt-2.5 mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-mute/70 transition-colors hover:bg-dune-deep/10 hover:text-ink"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
