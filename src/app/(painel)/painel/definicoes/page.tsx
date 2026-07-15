import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { KanbanOrderSettings } from "@/components/painel/KanbanOrderSettings";
import { ProjetoTiposCustomEditor } from "@/components/painel/ProjetoTiposCustomEditor";
import { CompanyProfileForm } from "@/components/painel/CompanyProfileForm";
import { PushOptIn } from "@/components/painel/PushOptIn";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { getBaseTiposRemovidos } from "@/lib/mongodb/projeto-tipos-config";
import { getCompanySettings } from "@/lib/mongodb/settings";
import { requirePainelSession } from "@/lib/painel-auth";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
  await requirePainelSession();

  const [tiposCustom, baseRemovidos, companySettings] = await Promise.all([
    getAllProjetoTiposCustom(),
    getBaseTiposRemovidos(),
    getCompanySettings(),
  ]);

  return (
    <>
      <Topbar crumbs={["Definições"]} title="Definições" />

      <div className="set">
        <h3>Perfil da empresa</h3>
        <p>Dados usados em documentos e no portal do cliente.</p>
        <CompanyProfileForm settings={companySettings} />
      </div>

      <div className="set">
        <h3>Ordem das tabs</h3>
        <p>Move as tabs para reordenar a navegação da barra lateral. (Guardado neste dispositivo.)</p>
        <TabOrderSettings />
      </div>

      <div className="set">
        <h3>Tipos de serviço</h3>
        <p>Os tipos disponíveis ao criar um projecto. Adiciona ou remove aqui — só aqui.</p>
        <ProjetoTiposCustomEditor tipos={tiposCustom} baseRemovidos={baseRemovidos} />
      </div>

      <div className="set">
        <h3>Notificações</h3>
        <p>Recebe avisos de novos leads e comentários no portal.</p>
        <PushOptIn showFallback />
      </div>

      <div className="set">
        <h3>Ordem do Kanban</h3>
        <p>Move as colunas para reordenar a vista Kanban. (Guardado neste dispositivo.)</p>
        <KanbanOrderSettings />
      </div>
    </>
  );
}
