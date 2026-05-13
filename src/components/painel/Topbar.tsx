import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { SyncButton } from "./SyncButton";

type Props = {
  title: string;
  description?: string;
  syncedAt?: string | null;
  syncCount?: number;
  className?: string;
  hideSearch?: boolean;
  hideSync?: boolean;
};

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Sem sync";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.round((now - then) / 60000);
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `Há ${diffH} h`;
    const diffD = Math.round(diffH / 24);
    return `Há ${diffD} dias`;
  } catch {
    return "Sem sync";
  }
}

export function Topbar({
  title,
  description,
  syncedAt,
  syncCount,
  className,
  hideSearch = false,
  hideSync = false,
}: Props) {
  const isSynced = Boolean(syncedAt);
  return (
    <header
      className={cn(
        "border-b border-dune-deep/10 bg-cream/70 backdrop-blur-xl px-6 lg:px-8 py-5 sticky top-0 z-30 shadow-warm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-ink-soft">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!hideSearch && <GlobalSearch />}
          {!hideSync && <SyncButton />}
          <div className="inline-flex items-center gap-2 rounded-btn border border-dune-deep/10 bg-white/70 px-3 py-1.5 text-xs shadow-xs">
            <span
              className={cn(
                "relative flex h-2 w-2 shrink-0",
                isSynced &&
                  "before:absolute before:inset-0 before:rounded-full before:bg-emerald-500 before:opacity-40 before:animate-ping"
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isSynced ? "bg-emerald-500" : "bg-ink-mute/40"
                )}
              />
            </span>
            <span className="font-mono uppercase tracking-tight text-ink-mute">Sync</span>
            <span className="font-medium tabular-nums text-ink">
              {formatRelative(syncedAt)}
            </span>
            {typeof syncCount === "number" && (
              <>
                <span className="text-ink-mute/50">·</span>
                <span className="text-ink-mute tabular-nums">
                  {syncCount} tarefas
                </span>
              </>
            )}
            <RefreshCw
              className="h-3 w-3 text-ink-mute/60 ml-1"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
