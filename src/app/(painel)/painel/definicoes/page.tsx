import { User, Monitor, Columns3, FolderKanban } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { KanbanOrderSettings } from "@/components/painel/KanbanOrderSettings";
import { ProjetoTiposCustomEditor } from "@/components/painel/ProjetoTiposCustomEditor";
import { CompanyProfileForm } from "@/components/painel/CompanyProfileForm";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { getCompanySettings } from "@/lib/mongodb/settings";

export const dynamic = "force-dynamic";

const NAV = [
  { id: "perfil", label: "Perfil · empresa", icon: User },
  { id: "aparencia", label: "Aparência · tabs", icon: Monitor },
  { id: "aparencia-kanban", label: "Aparência · Kanban", icon: Columns3 },
  { id: "tipos", label: "Tipos de projecto", icon: FolderKanban },
];

export default async function DefinicoesPage() {
  const [tiposCustom, companySettings] = await Promise.all([
    getAllProjetoTiposCustom(),
    getCompanySettings(),
  ]);

  return (
    <>
      <Topbar
        crumbs={["Painel", "Sistema", "Definições"]}
        title="Definições"
        description="Configuração do painel, integrações e perfil da empresa."
      />

      <div className="content" style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 24 }}>
        {/* Settings nav */}
        <nav className="col def-nav" style={{ gap: 2 }}>
          {NAV.map((n, i) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={i === 0 ? "active" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: "var(--ink-soft)" }}
            >
              <n.icon className="h-4 w-4" aria-hidden="true" />
              <span>{n.label}</span>
            </a>
          ))}
        </nav>

        {/* Main */}
        <div className="col" style={{ gap: 18 }}>
          {/* Perfil da empresa */}
          <section id="perfil" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Perfil da empresa</div>
                <div className="t">Identidade &amp; contactos</div>
              </div>
            </div>
            <div className="cb">
              <CompanyProfileForm settings={companySettings} />
            </div>
          </section>

          {/* Aparência — definições reais funcionais */}
          <section id="aparencia" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Aparência</div>
                <div className="t">Ordem das tabs</div>
              </div>
            </div>
            <div className="cb">
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Reordena as tabs do menu lateral. Guardado no dispositivo actual.</p>
              <TabOrderSettings />
            </div>
          </section>

          <section id="aparencia-kanban" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Aparência</div>
                <div className="t">Ordem das colunas Kanban</div>
              </div>
            </div>
            <div className="cb">
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Reordena as colunas da vista Kanban. Guardado no dispositivo actual.</p>
              <KanbanOrderSettings />
            </div>
          </section>

          {/* Tipos de projecto — real */}
          <section id="tipos" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Projectos</div>
                <div className="t">Tipos de projecto personalizados</div>
              </div>
            </div>
            <div className="cb">
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Adiciona subcategorias extra às 3 categorias base (AT, Web, Software). Aparecem no formulário de projecto.</p>
              <ProjetoTiposCustomEditor tipos={tiposCustom} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
