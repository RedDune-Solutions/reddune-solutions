import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

type Props = {
  title?: string;
  /** Optional HTML title (allows <em> ember-italic accent). Overrides `title` text. */
  titleHtml?: string;
  description?: string;
  /** Breadcrumb trail. Last crumb renders in ember. */
  crumbs?: string[];
  /** Right-aligned action(s), e.g. a primary button. */
  actions?: ReactNode;
  className?: string;
  hideSearch?: boolean;
};

/**
 * Topbar — Oasis v5 `.topbar`. Grid: left (crumbs + title + desc),
 * center (global search), right (bell + actions). Bell is decorative for now.
 */
export function Topbar({
  title,
  titleHtml,
  description,
  crumbs,
  actions,
  className,
  hideSearch = false,
}: Props) {
  return (
    <header className={cn("topbar", className)}>
      <div className="min-w-0">
        <div className="row" style={{ gap: 8 }}>
          <div className="min-w-0">
            {crumbs && crumbs.length > 0 && (
              <div className="crumbs">
                {crumbs.map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span className="dotsep">·</span>}
                    {i === crumbs.length - 1 ? <em>{c}</em> : c}
                  </span>
                ))}
              </div>
            )}
            {titleHtml ? (
              <h1 className="title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
            ) : (
              <h1 className="title">{title}</h1>
            )}
            {description && <div className="desc">{description}</div>}
          </div>
        </div>
      </div>

      {!hideSearch ? (
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      ) : (
        <div />
      )}

      <div className="row" style={{ gap: 8 }}>
        <button className="btn ghost icon" aria-label="Notificações" type="button">
          <Bell className="ic" aria-hidden="true" />
        </button>
        {actions}
      </div>
    </header>
  );
}
