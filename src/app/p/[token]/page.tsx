import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolvePortalToken } from "@/lib/portal-auth";
import { getClienteById } from "@/lib/mongodb/clientes";
import { getPagamentosByProjeto } from "@/lib/mongodb/pagamentos";
import { getComentariosByProjeto } from "@/lib/mongodb/portal";
import { getSandboxesByProjeto } from "@/lib/mongodb/portal-sandbox";
import { toPortalProjeto, toPortalCliente } from "@/lib/portal-dto";
import { PreviewFrame } from "@/components/portal/PreviewFrame";
import { SandboxFrame } from "@/components/portal/SandboxFrame";
import { ComentarioForm } from "@/components/portal/ComentarioForm";
import { FichaClienteForm } from "@/components/portal/FichaClienteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "O teu projecto · RedDune Solutions",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

const eur = (n: number) => `${n.toLocaleString("pt-PT")} €`;
const dataPt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

export default async function PortalPage({ params }: { params: Params }) {
  const { token } = await params;
  const projeto = await resolvePortalToken(token);
  if (!projeto) notFound();

  const [cliente, pagamentos, comentarios, sandboxes] = await Promise.all([
    projeto.clienteId ? getClienteById(projeto.clienteId) : Promise.resolve(null),
    getPagamentosByProjeto(projeto.id),
    getComentariosByProjeto(projeto.id),
    getSandboxesByProjeto(projeto.id),
  ]);
  const dto = toPortalProjeto(projeto, pagamentos);
  const arquivoSrc = (id: string) => `/api/portal/arquivo/${id}?t=${encodeURIComponent(token)}`;
  // Sandbox: capability própria no URL (não o token). entry codificado por segmento.
  const sandboxSrc = (s: { id: string; entry: string }) =>
    `/api/portal/sandbox/${s.id}/${s.entry.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <main className="min-h-screen bg-[#faf6f1] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Marca */}
        <header className="flex items-center justify-between">
          <p
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RedDune <span className="text-[#d6422a]">Solutions</span>
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Portal do cliente
          </p>
        </header>

        {/* Projecto */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            O teu projecto
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {dto.titulo}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[#d6422a]/10 px-3 py-1 font-semibold text-[#d6422a]">
              {dto.statusLabel}
            </span>
            {dto.tipoLabels.map((t) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {dto.prazo && <Info label="Prazo previsto" value={dataPt(dto.prazo)!} />}
            {dto.garantiaAte && <Info label="Garantia até" value={dataPt(dto.garantiaAte)!} />}
            {dto.hardware?.marca && (
              <Info
                label="Equipamento"
                value={[dto.hardware.marca, dto.hardware.modelo].filter(Boolean).join(" ")}
              />
            )}
          </dl>
        </section>

        {/* Valores */}
        {dto.valores && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Valores
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <Kpi label="Total" value={eur(dto.valores.orcado)} />
              <Kpi label="Pago" value={eur(dto.valores.pago)} />
              <Kpi label="Em falta" value={eur(dto.valores.emFalta)} accent={dto.valores.emFalta > 0} />
            </div>
            {dto.valores.categorias.length > 0 && (
              <ul className="mt-4 space-y-1 border-t pt-3 text-sm">
                {dto.valores.categorias.map((c) => (
                  <li key={c.label} className="flex justify-between">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium">{eur(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Entregáveis */}
        {(dto.arquivos.length > 0 || dto.links.length > 0 || sandboxes.length > 0) && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Entregáveis
            </h2>
            {sandboxes.map((s) => (
              <article key={s.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold">{s.nome}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">projeto web</p>
                </div>
                <SandboxFrame src={sandboxSrc(s)} title={s.nome} />
                <ComentarioForm token={token} sandboxId={s.id} compact />
              </article>
            ))}
            {dto.links.map((k) => (
              <article key={k.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
                <p className="font-semibold">{k.label}</p>
                <PreviewFrame src={k.url} title={k.label} />
                <ComentarioForm token={token} linkId={k.id} compact />
              </article>
            ))}
            {dto.arquivos.map((a) => (
              <article key={a.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="break-all font-semibold">{a.nome}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {Math.max(1, Math.round(a.tamanho / 1024))} KB
                  </p>
                </div>
                {a.tipo.startsWith("image/") ? (
                  // <img> deliberado: origem é o proxy autenticado, next/image não optimiza
                  <img
                    src={arquivoSrc(a.id)}
                    alt={a.nome}
                    className="max-h-[70vh] w-auto rounded-lg border"
                  />
                ) : a.tipo === "text/html" ? (
                  <PreviewFrame src={arquivoSrc(a.id)} title={a.nome} html />
                ) : a.tipo === "application/pdf" ? (
                  <PreviewFrame src={arquivoSrc(a.id)} title={a.nome} />
                ) : (
                  <a
                    href={arquivoSrc(a.id)}
                    className="text-sm font-semibold text-[#d6422a] hover:underline"
                  >
                    Descarregar ↓
                  </a>
                )}
                <ComentarioForm token={token} arquivoId={a.id} compact />
              </article>
            ))}
          </section>
        )}

        {/* Comentários */}
        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Opiniões e sugestões
          </h2>
          <ComentarioForm token={token} />
          {comentarios.length > 0 && (
            <ul className="space-y-3 border-t pt-4">
              {comentarios.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{c.autorNome ?? "Cliente"}</span>
                    {" · "}
                    {dataPt(c.criadoEm)}
                  </p>
                  <p className="whitespace-pre-wrap">{c.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ficha */}
        {cliente && (
          <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Os teus dados
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirma ou completa os teus dados — ajudam-nos a facturar e a contactar-te.
              </p>
            </div>
            <FichaClienteForm token={token} cliente={toPortalCliente(cliente)} />
          </section>
        )}

        <footer className="pb-6 text-center text-xs text-muted-foreground">
          Dúvidas? Escreve-nos: reddunesolutions@gmail.com
        </footer>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 px-2 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-bold" style={accent ? { color: "#d6422a" } : undefined}>
        {value}
      </p>
    </div>
  );
}
