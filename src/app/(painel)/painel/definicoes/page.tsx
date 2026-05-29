import Image from "next/image";
import { User, Bell, Code, Receipt, Users, Monitor, HardDrive, Mail, Calendar, Coins, Phone, FileText, Plus } from "lucide-react";
import { Topbar } from "@/components/painel/Topbar";
import { TabOrderSettings } from "@/components/painel/TabOrderSettings";
import { KanbanOrderSettings } from "@/components/painel/KanbanOrderSettings";
import { ProjetoTiposCustomEditor } from "@/components/painel/ProjetoTiposCustomEditor";
import { getAllProjetoTiposCustom } from "@/lib/mongodb/projeto-tipos-custom";

export const dynamic = "force-dynamic";

const NAV = [
  { id: "perfil", label: "Perfil · empresa", icon: User },
  { id: "notif", label: "Notificações", icon: Bell },
  { id: "integ", label: "Integrações", icon: Code },
  { id: "fact", label: "Facturação", icon: Receipt },
  { id: "user", label: "Utilizadores", icon: Users },
  { id: "aparencia", label: "Aparência", icon: Monitor },
  { id: "backup", label: "Backups & exportações", icon: HardDrive },
];

const NOTIF = [
  { l: "Novo projecto criado", d: "Notificar sempre", on: true, ch: ["email", "push"] },
  { l: "Tarefa em atraso", d: "Lembrete diário às 09:00", on: true, ch: ["push"] },
  { l: "Pagamento recebido", d: "Push imediato + email diário", on: true, ch: ["email", "push"] },
  { l: "Nova mensagem do site", d: "Email imediato", on: true, ch: ["email"] },
  { l: "Resumo semanal", d: "Domingo às 19h00", on: false, ch: ["email"] },
];

const INTEG = [
  { n: "Google Calendar", d: "Sincroniza eventos do painel", on: true, ic: Calendar, c: "#3f6a4d" },
  { n: "Stripe", d: "Pagamentos da loja online", on: true, ic: Coins, c: "var(--ember)" },
  { n: "MB Way · IfThenPay", d: "Pagamentos rápidos por referência", on: true, ic: Phone, c: "#2f4d6e" },
  { n: "Notion", d: "Sincronização de tarefas", on: false, ic: FileText, c: "var(--ink-mute)" },
];

export default async function DefinicoesPage() {
  const tiposCustom = await getAllProjetoTiposCustom();

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
              <div className="row" style={{ gap: 18, marginBottom: 20 }}>
                <div style={{ width: 88, height: 88, borderRadius: 16, background: "var(--cream-deep)", display: "grid", placeItems: "center", border: "1px solid rgba(90, 14, 14, 0.10)" }}>
                  <Image src="/logo-mark.png" alt="" width={56} height={56} style={{ objectFit: "contain" }} />
                </div>
                <div className="col" style={{ gap: 4, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>RedDune Solutions</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>PNG ou SVG · máx. 2 MB · recomendado 512×512</div>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <button type="button" className="btn ghost tiny">Alterar logo</button>
                    <button type="button" className="btn ghost tiny" style={{ color: "var(--ember)" }}>Remover</button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Nome legal</label>
                  <input className="ipt" defaultValue="RedDune Solutions" />
                </div>
                <div className="field">
                  <label>NIF</label>
                  <input className="ipt" defaultValue="" placeholder="—" />
                </div>
                <div className="field">
                  <label>Email principal</label>
                  <input className="ipt" defaultValue="reddunesolutions@gmail.com" />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input className="ipt" defaultValue="" placeholder="—" />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Morada</label>
                  <input className="ipt" defaultValue="Fuseta · Algarve" />
                </div>
              </div>
            </div>
          </section>

          {/* Notificações */}
          <section id="notif" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Notificações</div>
                <div className="t">Como sou avisado</div>
              </div>
            </div>
            <div className="cb">
              {NOTIF.map((s, i) => (
                <div key={s.l} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: i < NOTIF.length - 1 ? "1px dashed rgba(90, 14, 14, 0.10)" : "0" }}>
                  <div>
                    <div style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13.5 }}>{s.l}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    {s.ch.map((c) => (
                      <span key={c} className="badge" style={{ background: "var(--cream-deep)", fontSize: 9.5 }}>
                        {c === "email" ? <Mail className="h-2.5 w-2.5" style={{ marginRight: 3 }} aria-hidden="true" /> : <Bell className="h-2.5 w-2.5" style={{ marginRight: 3 }} aria-hidden="true" />}
                        {c}
                      </span>
                    ))}
                  </div>
                  <span className={"toggle " + (s.on ? "on" : "")}><span className="sw" /></span>
                </div>
              ))}
            </div>
          </section>

          {/* Integrações */}
          <section id="integ" className="card">
            <div className="ch">
              <div>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Integrações</div>
                <div className="t">Serviços externos ligados</div>
              </div>
              <button type="button" className="btn ghost tiny"><Plus className="ic" aria-hidden="true" /> Adicionar</button>
            </div>
            <div className="cb" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {INTEG.map((x) => (
                <div key={x.n} style={{ padding: "14px 16px", border: "1px solid rgba(90, 14, 14, 0.10)", borderRadius: 12, background: x.on ? "var(--sand-warm)" : "transparent", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: x.on ? "rgba(214, 66, 42, 0.10)" : "var(--cream-deep)", display: "grid", placeItems: "center", color: x.c }}>
                    <x.ic className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13.5 }}>{x.n}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{x.d}</div>
                  </div>
                  <span className={"toggle " + (x.on ? "on" : "")}><span className="sw" /></span>
                </div>
              ))}
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

          <section className="card">
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
          <section id="backup" className="card">
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
