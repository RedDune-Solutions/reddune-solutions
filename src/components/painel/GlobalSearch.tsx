"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { Search, Loader2, FolderKanban, Users, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProcurarResultado, ProcurarResultados } from "@/lib/procurar";

type Props = {
  defaultValue?: string;
};

type GroupKey = keyof ProcurarResultados;

const GROUPS: { key: GroupKey; label: string; Icon: typeof FolderKanban }[] = [
  { key: "projetos", label: "Projectos", Icon: FolderKanban },
  { key: "clientes", label: "Clientes", Icon: Users },
  { key: "tarefas", label: "Lembretes", Icon: ListChecks },
];

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

/**
 * GlobalSearch — caixa `.search` do protótipo (dentro de .top-tools), com
 * dropdown live `.gsearch-pop` que filtra à medida que se escreve, sem sair
 * da página. Enter no formulário continua a ir para /painel/procurar?q=
 * (fallback). ⌘K / Ctrl+K foca o campo. ↑/↓ seleccionam, Enter abre,
 * Escape fecha e limpa.
 */
export function GlobalSearch({ defaultValue }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Só pesquisa depois de o utilizador escrever — evita abrir o dropdown
  // ao montar com defaultValue (ex.: na página /painel/procurar).
  const dirtyRef = useRef(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const [results, setResults] = useState<ProcurarResultados | null>(null);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [kbdHint, setKbdHint] = useState("Ctrl K");
  const [pending, startTransition] = useTransition();

  // Atalho ⌘K / Ctrl+K → foca o campo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hint do atalho conforme a plataforma (⌘K só em macOS/iOS).
  useEffect(() => {
    const plat = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
    if (/mac|iphone|ipad|ipod/i.test(plat)) setKbdHint("⌘K");
  }, []);

  // Pesquisa live: debounce 250ms + cancelamento do fetch anterior.
  useEffect(() => {
    if (!dirtyRef.current) return;
    abortRef.current?.abort();
    const q = value.trim();
    if (q.length < MIN_CHARS) {
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/procurar?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ProcurarResultados;
        setResults(data);
        setSel(0);
        setOpen(true);
        setLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoading(false);
        setOpen(false);
        toast({
          title: "Erro na pesquisa",
          description: "Não foi possível obter resultados. Tenta outra vez.",
          variant: "destructive",
        });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value, toast]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const flat: ProcurarResultado[] = useMemo(
    () => (results ? [...results.projetos, ...results.clientes, ...results.tarefas] : []),
    [results]
  );

  function close() {
    setOpen(false);
  }

  function go(href: string) {
    setOpen(false);
    startTransition(() => router.push(href));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);
    const trimmed = value.trim();
    startTransition(() => {
      router.push(trimmed ? `/painel/procurar?q=${encodeURIComponent(trimmed)}` : "/painel/procurar");
    });
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setResults(null);
      setValue("");
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (flat.length ? Math.min(s + 1, flat.length - 1) : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && flat.length > 0) {
      e.preventDefault();
      const item = flat[sel] ?? flat[0];
      go(item.href);
    }
    // Enter sem resultados → deixa o submit do form ir para /painel/procurar?q=
  }

  const busy = pending || loading;
  const trimmed = value.trim();
  const popId = `${uid}-gsearch-pop`;
  const offsets: Record<GroupKey, number> = {
    projetos: 0,
    clientes: results?.projetos.length ?? 0,
    tarefas: (results?.projetos.length ?? 0) + (results?.clientes.length ?? 0),
  };

  // w-fit: o wrapper encolhe para a largura da caixa (320px) para o
  // dropdown (left:0/right:0) alinhar exactamente com ela.
  return (
    <div className="gsearch-inline w-fit" ref={rootRef}>
      <form role="search" onSubmit={handleSubmit} className="search">
        {busy ? (
          <Loader2
            className="ic animate-spin"
            style={{ width: 15, height: 15 }}
            aria-hidden="true"
          />
        ) : (
          <Search className="ic" style={{ width: 15, height: 15 }} aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={value}
          onChange={(e) => {
            dirtyRef.current = true;
            setValue(e.target.value);
          }}
          onKeyDown={onInputKeyDown}
          onFocus={() => {
            if (results && trimmed.length >= MIN_CHARS) setOpen(true);
          }}
          placeholder="Procurar"
          aria-label="Procurar"
          aria-expanded={open}
          aria-controls={popId}
          aria-autocomplete="list"
          aria-activedescendant={open && flat.length > 0 ? `${uid}-opt-${sel}` : undefined}
          autoComplete="off"
        />
        <span className="k" aria-hidden="true">{kbdHint}</span>
      </form>

      {open && results && (
        <div className="gsearch-pop" id={popId} role="listbox" aria-label="Resultados da pesquisa">
          {flat.length === 0 ? (
            <>
              <div className="res-empty">Sem resultados</div>
              <Link
                href={`/painel/procurar?q=${encodeURIComponent(trimmed)}`}
                className="res"
                onClick={close}
              >
                <span className="r-ic">
                  <Search className="ic" aria-hidden="true" />
                </span>
                <b>Ver pesquisa completa</b>
              </Link>
            </>
          ) : (
            GROUPS.map(({ key, label, Icon }) => {
              const group = results[key];
              if (group.length === 0) return null;
              return (
                <Fragment key={key}>
                  <p className="res-group">{label}</p>
                  {group.map((r, i) => {
                    const idx = offsets[key] + i;
                    return (
                      <Link
                        key={`${r.tipo}-${r.id}`}
                        id={`${uid}-opt-${idx}`}
                        href={r.href}
                        className={idx === sel ? "res sel" : "res"}
                        role="option"
                        aria-selected={idx === sel}
                        onClick={close}
                        onMouseEnter={() => setSel(idx)}
                      >
                        <span className="r-ic">
                          <Icon className="ic" aria-hidden="true" />
                        </span>
                        <b>{r.titulo}</b>
                        {r.sub && <span className="muted">{r.sub}</span>}
                      </Link>
                    );
                  })}
                </Fragment>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
