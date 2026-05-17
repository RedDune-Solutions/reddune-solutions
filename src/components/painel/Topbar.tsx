import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { GlobalSearch } from "./GlobalSearch";
import { MobileMenuButton } from "./MobileMenuButton";

type Props = {
  title: string;
  description?: string;
  className?: string;
  hideSearch?: boolean;
};

export async function Topbar({
  title,
  description,
  className,
  hideSearch = false,
}: Props) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : { name: null, email: null };

  return (
    <header
      className={cn(
        "border-b border-dune-deep/10 bg-cream/70 backdrop-blur-xl px-4 lg:px-8 py-4 sticky top-0 z-30 shadow-warm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MobileMenuButton user={user} />
          <div className="min-w-0">
            <h1 className="font-display text-lg md:text-3xl font-semibold leading-tight tracking-tight text-ink truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs md:text-sm text-ink-soft truncate">{description}</p>
            )}
          </div>
        </div>

        {/* Right: search on desktop */}
        {!hideSearch && (
          <div className="hidden sm:flex items-center shrink-0">
            <GlobalSearch />
          </div>
        )}
      </div>

      {/* Search below on mobile */}
      {!hideSearch && (
        <div className="sm:hidden mt-3">
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
