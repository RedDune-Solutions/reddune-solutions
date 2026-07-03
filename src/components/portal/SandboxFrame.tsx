"use client";

import { useState } from "react";

type Props = { src: string; title: string };

/**
 * Iframe de um sandbox (projeto multi-ficheiro hospedado no site). O `src` leva
 * a CAPABILITY do sandbox (não o token do portal), por isso "abrir em nova
 * janela" é seguro. O iframe é sandboxed (origem opaca) — o protótipo corre
 * isolado do site. Os flags têm de bater com o CSP servido pela rota.
 */
export function SandboxFrame({ src, title }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-[#d6422a] hover:underline"
        >
          {open ? "Fechar" : "Abrir projeto"}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:underline"
        >
          Ecrã inteiro ↗
        </a>
      </div>
      {open && (
        <iframe
          src={src}
          title={title}
          sandbox="allow-scripts allow-forms allow-modals"
          className="mt-3 w-full rounded-lg border bg-white"
          style={{ height: "75vh" }}
        />
      )}
    </div>
  );
}
