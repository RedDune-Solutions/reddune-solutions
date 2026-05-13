/* global React, RDB_DATA, Pill, Tag, Drawer, fmt, Icons */
const { useState: useS2, useMemo: useM2 } = React;

// ===== CLIENTS =====
function PageClientes({ route, go }) {
  const data = window.RDB_DATA;
  const [search, setSearch] = useS2('');
  const [filter, setFilter] = useS2('all');

  if (route.id) return <ClienteDetalhe id={route.id} go={go} />;

  const list = data.clients.filter((c) => {
    if (filter === 'b2c' && c.tag !== 'B2C') return false;
    if (filter === 'b2b' && c.tag !== 'B2B') return false;
    if (filter === 'recurring' && !c.tags.includes('recorrente') && !c.tags.includes('contrato')) return false;
    if (!search) return true;
    return (c.name + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(search.toLowerCase());
  });

  const enriched = list.map((c) => {
    const tasks = data.tasks.filter((t) => t.clientId === c.id);
    const open = tasks.filter((t) => t.status !== 'done').length;
    const paid = data.payments.filter((p) => p.clientId === c.id && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = data.payments.filter((p) => p.clientId === c.id && p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
    return { ...c, tasksTotal: tasks.length, tasksOpen: open, totalPaid: paid, totalPending: pending };
  });

  return (
    <>
      <div className="flex mb-3" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2 className="h-title">Clientes</h2>
        <span className="text-mute" style={{ fontSize: 13 }}>{list.length} de {data.clients.length}</span>
        <span className="spacer" />
        <button className="btn primary">{Icons.plus} Novo cliente</button>
      </div>

      <div className="filterbar">
        <div className="searchbox">{Icons.search}<input placeholder="Nome, email, telefone…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {[['all', 'Todos'], ['b2c', 'B2C'], ['b2b', 'B2B'], ['recurring', 'Recorrentes']].map(([k, l]) =>
        <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        )}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Cliente</th><th>Contacto</th><th>Localização</th><th>Tarefas</th><th className="num">Total pago</th><th className="num">A receber</th>
          </tr></thead>
          <tbody>
            {enriched.map((c) =>
            <tr key={c.id} onClick={() => go({ page: 'clientes', id: c.id })}>
                <td data-l="Cliente">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--peach)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{fmt.initials(c.name)}</span>
                    <div>
                      <b>{c.name}</b>
                      <span className="sub">{c.tag} · desde {c.since}</span>
                    </div>
                  </div>
                </td>
                <td data-l="Contacto">{c.phone}<span className="sub">{c.email}</span></td>
                <td data-l="Local">{c.address.split(',').pop().trim()}</td>
                <td data-l="Tarefas">{c.tasksTotal} <span className="text-mute" style={{ fontSize: 12 }}>({c.tasksOpen} abertas)</span></td>
                <td data-l="Pago" className="num">{fmt.eur(c.totalPaid)}</td>
                <td data-l="A receber" className="num" style={{ color: c.totalPending ? 'var(--dune)' : 'var(--ink-mute)' }}>{c.totalPending ? fmt.eur(c.totalPending) : '—'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>);

}

function ClienteDetalhe({ id, go }) {
  const data = window.RDB_DATA;
  const c = data.clients.find((x) => x.id === id);
  if (!c) return <div className="empty">Cliente não encontrado.</div>;
  const tasks = data.tasks.filter((t) => t.clientId === id).sort((a, b) => new Date(b.created) - new Date(a.created));
  const payments = data.payments.filter((p) => p.clientId === id).sort((a, b) => new Date(b.issued) - new Date(a.issued));
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <div className="flex mb-3">
        <a onClick={() => go({ page: 'clientes' })} style={{ cursor: 'pointer', color: 'var(--ink-mute)', fontSize: 13 }}>← Clientes</a>
      </div>

      <div className="profile-hd">
        <div className="av-lg">{fmt.initials(c.name)}</div>
        <div>
          <h2>{c.name}</h2>
          <div className="sub">{c.tag} · cliente desde {c.since}</div>
          <div className="flex mt-2" style={{ gap: 6, flexWrap: 'wrap' }}>{c.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        </div>
        <div className="stats">
          <div><span className="n">{tasks.length}</span><span className="l">Tarefas</span></div>
          <div><span className="n">{fmt.eur(totalPaid)}</span><span className="l">Pago</span></div>
          <div><span className="n" style={{ color: totalPending ? 'var(--dune)' : undefined }}>{fmt.eur(totalPending)}</span><span className="l">A receber</span></div>
        </div>
      </div>
      <div className="profile-body">
        <div className="grid-2">
          <div>
            <div className="card mb-3">
              <div className="ch"><h3>Histórico de tarefas</h3></div>
              <div className="cb" style={{ padding: 0 }}>
                <table className="tbl">
                  <thead><tr><th>Tarefa</th><th>Estado</th><th>Prazo</th><th className="num">Valor</th></tr></thead>
                  <tbody>
                    {tasks.map((t) =>
                    <tr key={t.id} onClick={() => go({ page: 'tarefas', id: t.id })}>
                        <td data-l="Tarefa"><b>{t.title}</b><span className="sub">{window.SERVICE_LABEL[t.service]}</span></td>
                        <td data-l="Estado"><Pill kind={t.priority === 'urgent' ? 'urgent' : t.status}>{t.priority === 'urgent' ? 'Urgente' : window.STATUS_LABEL[t.status]}</Pill></td>
                        <td data-l="Prazo">{fmt.date(t.due)}</td>
                        <td data-l="Valor" className="num">{t.price ? fmt.eur(t.price) : '—'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="ch"><h3>Pagamentos</h3></div>
              <div className="cb" style={{ padding: 0 }}>
                <table className="tbl">
                  <thead><tr><th>Emitido</th><th>Descrição</th><th>Método</th><th>Estado</th><th className="num">Valor</th></tr></thead>
                  <tbody>
                    {payments.map((p) => {
                      const t = p.taskId ? data.tasks.find((t) => t.id === p.taskId) : null;
                      return (
                        <tr key={p.id}>
                          <td data-l="Emitido">{fmt.date(p.issued)}</td>
                          <td data-l="Descrição">{t ? t.title : p.note || '—'}</td>
                          <td data-l="Método" style={{ textTransform: 'capitalize' }}>{p.method}</td>
                          <td data-l="Estado"><Pill kind={p.status}>{window.PAY_LABEL[p.status]}</Pill></td>
                          <td data-l="Valor" className="num">{fmt.eur(p.amount)}</td>
                        </tr>);

                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="card mb-3">
              <div className="ch"><h3>Contacto</h3></div>
              <div className="cb">
                <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 13 }}>
                  {Icons.phone}<span><a href={`tel:${c.phone}`} style={{ fontWeight: 500 }}>{c.phone}</a></span>
                </div>
                <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 13 }}>
                  {Icons.mail}<span><a href={`mailto:${c.email}`} style={{ fontWeight: 500 }}>{c.email}</a></span>
                </div>
                <div className="row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', fontSize: 13 }}>
                  {Icons.map}<span>{c.address}</span>
                </div>
                <div className="flex mt-2" style={{ gap: 8 }}>
                  <a className="btn primary sm" href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank">WhatsApp</a>
                  <a className="btn ghost sm" href={`tel:${c.phone}`}>Ligar</a>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="ch"><h3>Notas</h3></div>
              <div className="cb">
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-soft)' }}>{c.notes}</p>
                <button className="btn ghost sm mt-2">{Icons.edit} Editar notas</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);

}
window.PageClientes = PageClientes;

// ===== PAYMENTS =====
function PagePagamentos({ go }) {
  const data = window.RDB_DATA;
  const [filter, setFilter] = useS2('all');

  const list = data.payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  }).sort((a, b) => new Date(b.issued) - new Date(a.issued));

  const totals = {
    paid: data.payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: data.payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    overdue: data.payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  };

  return (
    <>
      <div className="flex mb-3" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2 className="h-title">Pagamentos</h2>
        <span className="spacer" />
        <button className="btn primary">{Icons.plus} Registar pagamento</button>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">{Icons.check} Pagos</div>
          <div className="val">{fmt.eur(totals.paid)}</div>
          <div className="delta">{data.payments.filter((p) => p.status === 'paid').length} pagamentos</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.clock} Pendentes</div>
          <div className="val">{fmt.eur(totals.pending)}</div>
          <div className="delta">{data.payments.filter((p) => p.status === 'pending').length} pagamentos</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.alert} Atrasados</div>
          <div className="val" style={{ color: 'var(--dune)' }}>{fmt.eur(totals.overdue)}</div>
          <div className="delta">{data.payments.filter((p) => p.status === 'overdue').length} pagamentos</div>
        </div>
        <div className="stat">
          <div className="label">{Icons.euro} Total ciclo</div>
          <div className="val">{fmt.eur(totals.paid + totals.pending + totals.overdue)}</div>
          <div className="delta">desde Out/2025</div>
        </div>
      </div>

      <div className="filterbar">
        {[['all', 'Todos'], ['pending', 'Pendentes'], ['overdue', 'Atrasados'], ['paid', 'Pagos']].map(([k, l]) =>
        <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l} <span className="ct">{k === 'all' ? data.payments.length : data.payments.filter((p) => p.status === k).length}</span></button>
        )}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Emitido</th><th>Cliente</th><th data-comment-anchor="78fe923439-th-240-45">Descrição</th><th>Método</th><th>Vencimento</th><th>Estado</th><th className="num">Valor</th>
          </tr></thead>
          <tbody>
            {list.map((p) => {
              const c = data.clients.find((c) => c.id === p.clientId);
              const t = p.taskId ? data.tasks.find((t) => t.id === p.taskId) : null;
              return (
                <tr key={p.id} onClick={() => t ? go({ page: 'tarefas', id: t.id }) : go({ page: 'clientes', id: c.id })}>
                  <td data-l="Emitido">{fmt.date(p.issued)}</td>
                  <td data-l="Cliente"><b>{c.name}</b><span className="sub">{c.tag}</span></td>
                  <td data-l="Descrição">{t ? t.title : p.note || '—'}</td>
                  <td data-l="Método" style={{ textTransform: 'capitalize' }}>{p.method}</td>
                  <td data-l="Vencimento">{fmt.date(p.due)}</td>
                  <td data-l="Estado"><Pill kind={p.status}>{window.PAY_LABEL[p.status]}</Pill></td>
                  <td data-l="Valor" className="num">{fmt.eur(p.amount)}</td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </>);

}
window.PagePagamentos = PagePagamentos;