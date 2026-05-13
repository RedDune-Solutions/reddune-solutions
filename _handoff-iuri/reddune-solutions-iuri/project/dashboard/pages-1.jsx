/* global React, RDB_DATA, Pill, Tag, Drawer, fmt, Icons */
const { useState: useS1, useMemo: useM1 } = React;

// ===== OVERVIEW =====
function PageOverview({ go }){
  const data = window.RDB_DATA;
  const open = data.tasks.filter(t => t.status !== 'done');
  const urgent = data.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  const dueSoon = open.filter(t => {
    const diff = (new Date(t.due) - new Date(data.today)) / 86400000;
    return diff <= 3;
  });
  const overdueP = data.payments.filter(p => p.status === 'overdue').reduce((s,p)=>s+p.amount,0);
  const pendingP = data.payments.filter(p => p.status === 'pending').reduce((s,p)=>s+p.amount,0);
  const monthIncome = data.payments
    .filter(p => p.status === 'paid' && p.paidOn && p.paidOn.startsWith('2026-05'))
    .reduce((s,p)=>s+p.amount,0);

  const activity = data.tasks.flatMap(t => t.activity.map(a => ({...a, taskId:t.id, taskTitle:t.title })))
    .sort((a,b)=> new Date(b.when) - new Date(a.when)).slice(0,8);

  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">{Icons.task} Tarefas abertas</div>
          <div className="val">{open.length}</div>
          <div className="delta"><b className="up">{urgent.length}</b> urgentes · <b>{dueSoon.length}</b> próximos 3 dias</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.euro} A receber</div>
          <div className="val">{fmt.eur(pendingP)}</div>
          <div className="delta">{data.payments.filter(p=>p.status==='pending').length} pagamentos pendentes</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.alert} Em atraso</div>
          <div className="val" style={{color: overdueP ? 'var(--dune)' : undefined}}>{fmt.eur(overdueP)}</div>
          <div className="delta">{data.payments.filter(p=>p.status==='overdue').length} faturas</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.cal} Recebido em Maio</div>
          <div className="val">{fmt.eur(monthIncome)}</div>
          <div className="delta"><b className="up">+12%</b> vs Abril</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-3">
            <div className="ch">
              <h3>Próximas tarefas</h3>
              <span className="sub">— ordenadas por prazo</span>
              <span className="spacer"/>
              <button className="btn ghost sm" onClick={()=>go({page:'tarefas'})}>Ver todas</button>
            </div>
            <div className="cb" style={{padding:0}}>
              <table className="tbl">
                <thead><tr>
                  <th>Tarefa</th><th>Cliente</th><th>Estado</th><th>Prazo</th><th className="num">Valor</th>
                </tr></thead>
                <tbody>
                  {open.sort((a,b)=> new Date(a.due) - new Date(b.due)).slice(0,6).map(t => {
                    const c = data.clients.find(c=>c.id===t.clientId);
                    const late = new Date(t.due) < new Date(data.today);
                    return (
                      <tr key={t.id} onClick={()=>go({page:'tarefas', id:t.id})}>
                        <td data-l="Tarefa"><b>{t.title}</b><span className="sub">{window.SERVICE_LABEL[t.service]}</span></td>
                        <td data-l="Cliente">{c.name}</td>
                        <td data-l="Estado"><Pill kind={t.priority==='urgent'?'urgent':t.status}>{t.priority==='urgent'?'Urgente':window.STATUS_LABEL[t.status]}</Pill></td>
                        <td data-l="Prazo" style={{color: late ? 'var(--dune)' : undefined, fontWeight: late ? 600 : 500}}>{fmt.rel(t.due, data.today)}</td>
                        <td data-l="Valor" className="num">{t.price ? fmt.eur(t.price) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="ch">
              <h3>Atividade recente</h3>
            </div>
            <div className="cb">
              <div className="tl">
                {activity.map((a,i) => (
                  <div key={i} className={`tl-item ${a.what.includes('Concluído') || a.what.includes('Relatório')?'done':''}`}>
                    <div className="when">{fmt.dateTime(a.when)}</div>
                    <b>{a.taskTitle}</b> — {a.what}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-3">
            <div className="ch"><h3>Hoje</h3></div>
            <div className="cb">
              <div style={{fontSize:13, lineHeight:1.7}}>
                <p style={{marginBottom:10}}><b>{new Date(data.today).toLocaleDateString('pt-PT', { weekday:'long', day:'2-digit', month:'long' })}</b></p>
                <p className="text-mute" style={{marginBottom:12}}>3 tarefas com prazo até quinta · 1 visita à tarde (Pastelaria Mané)</p>
                <div style={{borderTop:'1px dashed var(--line)', paddingTop:12}}>
                  <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-mute)', fontWeight:600, marginBottom:8}}>Lembretes</div>
                  <div style={{display:'flex', alignItems:'flex-start', gap:8, marginBottom:6}}>
                    <span style={{width:6, height:6, borderRadius:'50%', background:'var(--ember)', marginTop:6, flex:'0 0 6px'}}/>
                    <span>Peça iPhone 12 chega amanhã (rastreio CTT)</span>
                  </div>
                  <div style={{display:'flex', alignItems:'flex-start', gap:8, marginBottom:6}}>
                    <span style={{width:6, height:6, borderRadius:'50%', background:'var(--apricot)', marginTop:6, flex:'0 0 6px'}}/>
                    <span>Enviar relatório recuperação a Miguel Costa (sex)</span>
                  </div>
                  <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                    <span style={{width:6, height:6, borderRadius:'50%', background:'var(--ink-mute)', marginTop:6, flex:'0 0 6px'}}/>
                    <span>Comprar pasta térmica MX-4 (acabou)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><h3>Ações rápidas</h3></div>
            <div className="cb" style={{display:'grid', gap:8}}>
              <button className="btn primary" style={{justifyContent:'flex-start'}}>{Icons.plus} Nova tarefa</button>
              <button className="btn ghost" style={{justifyContent:'flex-start'}}>{Icons.user} Novo cliente</button>
              <button className="btn ghost" style={{justifyContent:'flex-start'}}>{Icons.euro} Registar pagamento</button>
              <button className="btn ghost" style={{justifyContent:'flex-start'}}>{Icons.note} Nova nota</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
window.PageOverview = PageOverview;

// ===== TASKS =====
function TaskDrawer({ taskId, onClose, go }){
  const data = window.RDB_DATA;
  const t = data.tasks.find(x => x.id === taskId);
  const [checks, setChecks] = useS1(t ? t.checklist.map(c => c.d) : []);
  const [note, setNote] = useS1('');
  if (!t) return null;
  const c = data.clients.find(x => x.id === t.clientId);
  const pay = t.paymentId ? data.payments.find(p => p.id === t.paymentId) : null;
  const late = new Date(t.due) < new Date(data.today) && t.status !== 'done';

  return (
    <Drawer title={t.title} onClose={onClose}>
      <div className="flex mb-4" style={{gap:6, flexWrap:'wrap'}}>
        <Pill kind={t.priority === 'urgent' ? 'urgent' : t.status}>
          {t.priority === 'urgent' ? 'Urgente' : window.STATUS_LABEL[t.status]}
        </Pill>
        <Tag>{window.SERVICE_LABEL[t.service]}</Tag>
        <span className="spacer"/>
        <button className="btn ghost sm">{Icons.edit} Editar</button>
      </div>

      <div className="sec">
        <h4>Descrição</h4>
        <p style={{fontSize:13.5, lineHeight:1.65, color:'var(--ink-soft)'}}>{t.desc}</p>
      </div>

      <div className="sec">
        <h4>Detalhes</h4>
        <div className="row"><span className="lab">Cliente</span><span className="v">
          <a onClick={()=>{onClose(); go({page:'clientes', id:c.id});}} style={{color:'var(--ember)', cursor:'pointer'}}>{c.name}</a> · {c.tag}
        </span></div>
        <div className="row"><span className="lab">Prazo</span><span className="v" style={{color: late?'var(--dune)':undefined}}>{fmt.dateLong(t.due)} · {fmt.rel(t.due, data.today)}</span></div>
        <div className="row"><span className="lab">Criada</span><span className="v">{fmt.dateLong(t.created)}</span></div>
        <div className="row"><span className="lab">Valor</span><span className="v">{t.price ? fmt.eur(t.price) : 'Sem valor associado'} {pay && <Pill kind={pay.status}>{window.PAY_LABEL[pay.status]}</Pill>}</span></div>
      </div>

      {t.checklist.length > 0 && (
        <div className="sec">
          <h4>Checklist</h4>
          {t.checklist.map((item, i) => (
            <label key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', cursor:'pointer', borderBottom:'1px dashed var(--line)', fontSize:13}}>
              <input type="checkbox" checked={checks[i]} onChange={()=>{ const n=[...checks]; n[i]=!n[i]; setChecks(n); }} />
              <span style={{textDecoration: checks[i]?'line-through':'none', color: checks[i]?'var(--ink-mute)':'var(--ink)'}}>{item.t}</span>
            </label>
          ))}
        </div>
      )}

      <div className="sec">
        <h4>Atividade</h4>
        <div className="tl">
          {t.activity.map((a,i) => (
            <div key={i} className="tl-item">
              <div className="when">{fmt.dateTime(a.when)}</div>
              {a.what}
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h4>Observações</h4>
        <p style={{fontSize:13, lineHeight:1.65, color:'var(--ink-soft)', marginBottom:10, padding:'10px 12px', background:'var(--cream-soft)', border:'1px dashed var(--line)', borderRadius:8}}>
          Espaço para notas soltas sobre este projeto — sincronizadas do Obsidian.
        </p>
        <textarea rows="3" placeholder="Acrescentar observação rápida…" value={note} onChange={e=>setNote(e.target.value)} />
        <div className="flex mt-2" style={{justifyContent:'flex-end'}}>
          <button className="btn primary sm" onClick={()=>{ setNote(''); alert('Mock — observação guardada.'); }}>Guardar</button>
        </div>
      </div>
    </Drawer>
  );
}

function PageTarefas({ route, go }){
  const data = window.RDB_DATA;
  const [view, setView] = useS1('kanban');
  const [filter, setFilter] = useS1('all');
  const [search, setSearch] = useS1('');

  const filtered = data.tasks.filter(t => {
    if (filter === 'mine') return true;
    if (filter === 'urgent') return t.priority === 'urgent';
    if (filter === 'done') return t.status === 'done';
    if (filter !== 'all' && t.service !== filter) return false;
    return true;
  }).filter(t => {
    if (!search) return true;
    const c = data.clients.find(c=>c.id===t.clientId);
    return (t.title + ' ' + c.name).toLowerCase().includes(search.toLowerCase());
  });

  const cols = [
    { id:'todo', label:'Por fazer' },
    { id:'prog', label:'Em curso' },
    { id:'wait', label:'À espera' },
    { id:'done', label:'Concluído' },
  ];

  return (
    <>
      <div className="flex mb-3" style={{flexWrap:'wrap', gap:10}}>
        <h2 className="h-title">Tarefas</h2>
        <span className="text-mute" style={{fontSize:13}}>{filtered.length} de {data.tasks.length}</span>
        <span className="spacer"/>
        <div className="flex" style={{background:'var(--paper)', border:'1px solid var(--line)', borderRadius:100, padding:3}}>
          <button className={`chip ${view==='kanban'?'on':''}`} style={{border:'none', padding:'5px 12px'}} onClick={()=>setView('kanban')}>Kanban</button>
          <button className={`chip ${view==='list'?'on':''}`} style={{border:'none', padding:'5px 12px'}} onClick={()=>setView('list')}>Lista</button>
        </div>
        <button className="btn primary">{Icons.plus} Nova tarefa</button>
      </div>

      <div className="filterbar">
        <div className="searchbox">{Icons.search}<input placeholder="Pesquisar…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
        {['all','urgent','assistencia','web','software','done'].map(k => (
          <button key={k} className={`chip ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>
            {k==='all'?'Todas':k==='urgent'?'Urgentes':k==='done'?'Concluídas':window.SERVICE_LABEL[k]}
          </button>
        ))}
      </div>

      {view === 'kanban' ? (
        <div className="kanban">
          {cols.map(col => {
            const items = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="kcol">
                <div className="kcol-h">
                  <span className="pdot" style={{display:'inline-block', width:8, height:8, borderRadius:'50%', background:`var(--st-${col.id})`}}/>
                  <b>{col.label}</b>
                  <span className="ct">{items.length}</span>
                </div>
                {items.map(t => {
                  const c = data.clients.find(c=>c.id===t.clientId);
                  const late = new Date(t.due) < new Date(data.today) && t.status !== 'done';
                  return (
                    <div key={t.id} className="kcard" onClick={()=>go({page:'tarefas', id:t.id})}>
                      <h4>{t.title}</h4>
                      <div className="meta">
                        {t.priority === 'urgent' && <Pill kind="urgent">Urgente</Pill>}
                        <Tag>{window.SERVICE_LABEL[t.service]}</Tag>
                      </div>
                      <div className="cli">
                        <span className="av">{fmt.initials(c.name)}</span>
                        <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.name}</span>
                        <span className={`due ${late?'late':''}`}>{Icons.clock} {fmt.rel(t.due, data.today)}</span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div style={{textAlign:'center', padding:'18px 0', color:'var(--ink-dim)', fontSize:12}}>—</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Tarefa</th><th>Cliente</th><th>Serviço</th><th>Estado</th><th>Prazo</th><th className="num">Valor</th>
            </tr></thead>
            <tbody>
              {filtered.sort((a,b)=> new Date(a.due) - new Date(b.due)).map(t => {
                const c = data.clients.find(c=>c.id===t.clientId);
                const late = new Date(t.due) < new Date(data.today) && t.status !== 'done';
                return (
                  <tr key={t.id} onClick={()=>go({page:'tarefas', id:t.id})}>
                    <td data-l="Tarefa"><b>{t.title}</b></td>
                    <td data-l="Cliente">{c.name} <span className="sub">{c.tag}</span></td>
                    <td data-l="Serviço">{window.SERVICE_LABEL[t.service]}</td>
                    <td data-l="Estado"><Pill kind={t.priority==='urgent'?'urgent':t.status}>{t.priority==='urgent'?'Urgente':window.STATUS_LABEL[t.status]}</Pill></td>
                    <td data-l="Prazo" style={{color:late?'var(--dune)':undefined, fontWeight:late?600:500}}>{fmt.rel(t.due, data.today)}</td>
                    <td data-l="Valor" className="num">{t.price?fmt.eur(t.price):'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {route.id && <TaskDrawer taskId={route.id} onClose={()=>go({page:'tarefas'})} go={go} />}
    </>
  );
}
window.PageTarefas = PageTarefas;
