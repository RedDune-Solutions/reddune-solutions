import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { MobileMenuButton } from "./MobileMenuButton";

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
        "border-b border-dune-deep/10 bg-cream/70 backdrop-blur-xl px-4 lg:px-8 py-5 sticky top-0 z-30 shadow-warm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MobileMenuButton />
          <div className="min-w-0">
            <h1 className="font-display text-xl md:text-3xl font-semibold leading-tight tracking-tight text-ink">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!hideSearch && <GlobalSearch />}
        </div>
      </div>
    </header>
  );
}
