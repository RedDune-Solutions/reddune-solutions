import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Poppins, Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/painel/Sidebar";
import { BottomNav } from "@/components/painel/BottomNav";
import { ensureIndexes } from "@/lib/mongodb/init-indexes";
import { getAllProjetos } from "@/lib/mongodb/projetos";
import { getAllTarefas } from "@/lib/mongodb/tarefas";
import { getAllPagamentos } from "@/lib/mongodb/pagamentos";
import "./painel.css";

// Painel usa Poppins (display) + Inter (body) — igual ao mockup Oasis v5.
// Override scoped: o site público mantém Bricolage + DM Sans.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Painel — Reddune Solutions",
  robots: { index: false, follow: false },
};

// Contagens p/ badges da sidebar. Cache curto (20s) — antes corria 3 scans de
// colecção INTEIRA (projetos+tarefas+pagamentos) em CADA navegação no painel.
// Badges podem ficar até 20s desatualizados, aceitável para contadores.
// Apenas LÊ dados (read-only) — não altera nada.
const getSidebarCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const [projetos, tarefas, pagamentos] = await Promise.all([
      getAllProjetos(),
      getAllTarefas(),
      getAllPagamentos(),
    ]);
    const pagoPorProjeto = new Map<string, number>();
    for (const p of pagamentos) {
      pagoPorProjeto.set(p.projetoId, (pagoPorProjeto.get(p.projetoId) ?? 0) + p.valor);
    }
    const dividasCount = projetos.filter(
      (p) =>
        p.status === "terminado" &&
        p.valorEstimado != null &&
        (pagoPorProjeto.get(p.id) ?? 0) < p.valorEstimado
    ).length;

    // Tarefas pendentes só de projetos EM ABERTO (em curso / próximo).
    const projetoStatus = new Map(projetos.map((p) => [p.id, p.status]));
    const emAberto = new Set(["em-curso", "proximo"]);
    const tarefasPendentes = tarefas.filter(
      (t) => !t.feita && emAberto.has(projetoStatus.get(t.projetoId) ?? "")
    ).length;
    const projetosActivos = projetos.filter((p) => emAberto.has(p.status)).length;

    return {
      "/painel/tarefas": tarefasPendentes,
      "/painel/projetos": projetosActivos,
      "/painel/dividas": dividasCount,
    };
  },
  ["painel-sidebar-counts"],
  { revalidate: 20, tags: ["painel-counts"] }
);

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/entrar?from=/painel");
  }

  // Idempotente — cria indexes na primeira request, no-op nas seguintes.
  await ensureIndexes();

  // Contagens p/ badges da sidebar (cacheadas 20s — ver getSidebarCounts).
  const counts = await getSidebarCounts();

  return (
    <div
      className={`pnl painel-shell min-h-screen flex ${poppins.variable} ${inter.variable}`}
      style={{
        ["--font-display" as string]: "var(--font-poppins)",
        ["--font-body" as string]: "var(--font-inter)",
      }}
    >
      <Sidebar
        user={{ name: session.user.name, email: session.user.email }}
        counts={counts}
      />
      <main className="main flex-1 min-w-0 flex flex-col">{children}</main>
      <BottomNav counts={counts} />
    </div>
  );
}
