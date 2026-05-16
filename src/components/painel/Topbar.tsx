import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

type Props = {
  title: string;
  description?: string;
  className?: string;
  hideSearch?: boolean;
};

export function Topbar({
  title,
  description,
  className,
  hideSearch = false,
}: Props) {
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
        </div>
      </div>
    </header>
  );
}
