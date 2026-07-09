"use client";

import { useState } from "react";

type Props = {
  src: string;
  title: string;
  /**
   * html=true: mockup HTML nosso (não-confiável). É carregado via fetch pelo
   * componente pai (contexto de confiança, com token) e injectado por `srcdoc`
   * num iframe sandboxed — assim o token NUNCA entra no URL do iframe, logo um
   * script no mockup não o consegue ler de window.location nem exfiltrá-lo.
   */
  html?: boolean;
};

const frameCls =
  "mt-3.5 w-full rounded-[20px] border border-dashed border-[rgba(90,14,14,0.20)] bg-white/55";

export function PreviewFrame({ src, title, html }: Props) {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function abrir() {
    if (open) {
      setOpen(false);
      return;
    }
    if (html && doc === null) {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(String(res.status));
        setDoc(await res.text());
      } catch {
        setErro("Não foi possível carregar a pré-visualização.");
        return;
      }
    }
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={abrir}
          className="text-sm font-semibold text-ember transition-colors hover:text-dune hover:underline"
        >
          {open ? "Fechar pré-visualização" : "Pré-visualizar aqui"}
        </button>
        {/* HTML não-confiável NÃO abre top-level (levaria o token no URL). Só
            PDFs e links externos ganham "abrir em nova janela". */}
        {!html && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13.5px] text-ink-mute transition-colors hover:text-ink-soft hover:underline"
          >
            Abrir em nova janela ↗
          </a>
        )}
      </div>
      {erro && <p className="mt-2 text-sm text-dune">{erro}</p>}
      {open &&
        (html ? (
          <iframe
            srcDoc={doc ?? ""}
            title={title}
            sandbox="allow-scripts"
            className={frameCls}
            style={{ height: "70vh" }}
          />
        ) : (
          <iframe
            src={src}
            title={title}
            // Cross-origin (PDF/link): sandbox sem allow-top-navigation impede
            // que um preview comprometido sequestre o separador do portal.
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            className={frameCls}
            style={{ height: "62vh" }}
          />
        ))}
    </div>
  );
}
