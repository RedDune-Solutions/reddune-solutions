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
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-ember transition-colors hover:text-dune hover:underline"
        >
          {open ? "Fechar" : "Abrir projeto"}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13.5px] text-ink-mute transition-colors hover:text-ink-soft hover:underline"
        >
          Ecrã inteiro ↗
        </a>
      </div>
      {open && (
        <iframe
          src={src}
          title={title}
          sandbox="allow-scripts allow-forms allow-modals"
          className="mt-3.5 w-full rounded-[20px] border border-dashed border-[rgba(90,14,14,0.20)] bg-white/55"
          style={{ height: "68vh" }}
        />
      )}
    </div>
  );
}
