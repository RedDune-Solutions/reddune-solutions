import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
  className?: string;
};

export function Markdown({ children, className }: Props) {
  return (
    <div className={"text-sm text-foreground leading-relaxed " + (className ?? "")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="font-headline text-xl font-semibold mt-6 mb-3 text-foreground" {...p} />,
          h2: (p) => <h2 className="font-headline text-lg font-semibold mt-5 mb-2 text-foreground" {...p} />,
          h3: (p) => <h3 className="font-headline text-base font-semibold mt-4 mb-2 text-foreground" {...p} />,
          h4: (p) => <h4 className="font-headline text-sm font-semibold mt-3 mb-1 text-foreground" {...p} />,
          p: (p) => <p className="my-2 leading-relaxed" {...p} />,
          ul: (p) => <ul className="my-2 ml-5 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="my-2 ml-5 list-decimal space-y-1" {...p} />,
          li: (p) => <li className="text-sm" {...p} />,
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          code: ({ children, ...p }) => (
            <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono" {...p}>
              {children}
            </code>
          ),
          pre: (p) => <pre className="my-3 p-3 rounded bg-muted text-xs overflow-x-auto" {...p} />,
          blockquote: (p) => (
            <blockquote className="my-3 border-l-2 border-accent/40 pl-3 text-muted-foreground italic" {...p} />
          ),
          hr: () => <hr className="my-4 border-border" />,
          table: (p) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse" {...p} />
            </div>
          ),
          thead: (p) => <thead className="bg-muted/50" {...p} />,
          th: (p) => <th className="border border-border px-2 py-1 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-border px-2 py-1 align-top" {...p} />,
          a: ({ href, children, ...p }) => {
            const text = String(children);
            const wiki = text.match(/^\[\[(.+?)\]\]$/);
            if (wiki) return <span className="text-muted-foreground">[[{wiki[1]}]]</span>;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
                {...p}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
