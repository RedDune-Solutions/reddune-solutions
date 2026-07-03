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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={abrir}
          className="text-sm font-semibold text-[#d6422a] hover:underline"
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
            className="text-sm text-muted-foreground hover:underline"
          >
            Abrir em nova janela ↗
          </a>
        )}
      </div>
      {erro && <p className="mt-2 text-sm text-rose-700">{erro}</p>}
      {open &&
        (html ? (
          <iframe
            srcDoc={doc ?? ""}
            title={title}
            sandbox="allow-scripts"
            className="mt-3 w-full rounded-lg border bg-white"
            style={{ height: "70vh" }}
          />
        ) : (
          <iframe
            src={src}
            title={title}
            // Cross-origin (PDF/link): sandbox sem allow-top-navigation impede
            // que um preview comprometido sequestre o separador do portal.
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            className="mt-3 w-full rounded-lg border bg-white"
            style={{ height: "70vh" }}
          />
        ))}
    </div>
  );
}
