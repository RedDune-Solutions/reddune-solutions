import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsBell } from "./NotificationsBell";

type Props = {
  title?: string;
  /** Optional HTML title (allows <em> ember-italic accent). Overrides `title` text. */
  titleHtml?: string;
  description?: string;
  /** Breadcrumb trail — renderizado como .eyebrow (join com " · "). */
  crumbs?: string[];
  /** Right-aligned action(s), e.g. a primary button (.btn-primary). */
  actions?: ReactNode;
  className?: string;
  hideSearch?: boolean;
  /** Pré-preenche a caixa da pesquisa global (ex.: termo já pesquisado). */
  searchDefault?: string;
};

/**
 * Topbar — padrão `.top` do protótipo (Painel.html): à esquerda eyebrow +
 * .greet (com <em> a gradiente) + .sub; à direita .top-tools com a pesquisa
 * global, o sino e as actions da página. `.page-head` acompanha sempre
 * (o protótipo usa "top page-head" nas páginas internas — visual igual).
 */
export function Topbar({
  title,
  titleHtml,
  description,
  crumbs,
  actions,
  className,
  hideSearch = false,
  searchDefault,
}: Props) {
  return (
    <header className={cn("top", "page-head", className)}>
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <p className="eyebrow">{crumbs.join(" · ")}</p>
        )}
        {titleHtml ? (
          <h1 className="greet" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        ) : (
          title && <h1 className="greet">{title}</h1>
        )}
        {description && <p className="sub">{description}</p>}
      </div>

      <div className="top-tools">
        {!hideSearch && <GlobalSearch defaultValue={searchDefault} />}
        <NotificationsBell />
        {actions}
      </div>
    </header>
  );
}
