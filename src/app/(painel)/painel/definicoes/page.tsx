import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { KanbanOrderSettings } from "@/components/painel/KanbanOrderSettings";
import { ProjetoTiposCustomEditor } from "@/components/painel/ProjetoTiposCustomEditor";
import { CompanyProfileForm } from "@/components/painel/CompanyProfileForm";
import { PushOptIn } from "@/components/painel/PushOptIn";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";
import { getCompanySettings } from "@/lib/mongodb/settings";

export const dynamic = "force-dynamic";

export default async function DefinicoesPage() {
  const [tiposCustom, companySettings] = await Promise.all([
    getAllProjetoTiposCustom(),
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
        <p>Os tipos disponíveis ao criar um projecto. Podes adicionar mais quando precisares.</p>
        <ProjetoTiposCustomEditor tipos={tiposCustom} />
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
