"use client";

import { useState } from "react";

type Props = { src: string; title: string; sandbox?: boolean };

/** Preview colapsável em iframe. sandbox=true para mockups HTML nossos. */
export function PreviewFrame({ src, title, sandbox }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-[#d6422a] hover:underline"
        >
          {open ? "Fechar pré-visualização" : "Pré-visualizar aqui"}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:underline"
        >
          Abrir em nova janela ↗
        </a>
      </div>
      {open && (
        <iframe
          src={src}
          title={title}
          {...(sandbox ? { sandbox: "allow-scripts" } : {})}
          className="mt-3 w-full rounded-lg border bg-white"
          style={{ height: "70vh" }}
        />
      )}
    </div>
  );
}
