/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ===== ICONS (lucide-style inline) =====
const Icon = ({ d, stroke = 1.7, size = 18 }) =>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

const Icons = {
  home: <Icon d={<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>} />,
  task: <Icon d={<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10M7 13h6" /><path d="M16 17l2 2 4-4" /></>} />,
  user: <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>} />,
  euro: <Icon d={<><path d="M18 7a6 6 0 100 10" /><path d="M5 10h9M5 14h9" /></>} />,
  note: <Icon d={<><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M15 3v5h5" /><path d="M9 13h6M9 17h6" /></>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  bell: <Icon d={<><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 004 0" /></>} />,
  menu: <Icon d={<><path d="M4 6h16M4 12h16M4 18h16" /></>} />,
  x: <Icon d={<><path d="M6 6l12 12M18 6L6 18" /></>} />,
  plus: <Icon d={<><path d="M12 5v14M5 12h14" /></>} />,
  out: <Icon d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>} />,
  cal: <Icon d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>} />,
  clock: <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  phone: <Icon d={<><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.4 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.4c.8.3 1.7.5 2.6.6A2 2 0 0122 16.9z" /></>} />,
  mail: <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />,
  map: <Icon d={<><path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></>} />,
  filter: <Icon d={<><path d="M3 5h18l-7 9v6l-4-2v-4z" /></>} />,
  arrowR: <Icon d={<><path d="M5 12h14M13 6l6 6-6 6" /></>} />,
  chev: <Icon d={<><path d="M6 9l6 6 6-6" /></>} />,
  check: <Icon d={<><path d="M5 12l5 5 9-11" /></>} />,
  folder: <Icon d={<><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></>} />,
  tag: <Icon d={<><path d="M20 12l-8 8a2 2 0 01-3 0L2 13V3h10z" /><circle cx="7" cy="8" r="1.5" /></>} />,
  edit: <Icon d={<><path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" /></>} />,
  trash: <Icon d={<><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" /></>} />,
  wrench: <Icon d={<><path d="M14.7 6.3a4 4 0 015.6 5.6l-10 10-4 1 1-4 10-10z" /></>} />,
  globe: <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>} />,
  disk: <Icon d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>} />,
  alert: <Icon d={<><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></>} />
};
window.Icons = Icons;

// ===== STATUS HELPERS =====
const STATUS_LABEL = { todo: 'Por fazer', prog: 'Em curso', wait: 'À espera', done: 'Concluído', urgent: 'Urgente' };
const PAY_LABEL = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado' };
const SERVICE_LABEL = { assistencia: 'Assistência', web: 'Web & Digital', software: 'Software & Dados' };
const SERVICE_ICON = { assistencia: Icons.wrench, web: Icons.globe, software: Icons.disk };

const Pill = ({ kind, children }) =>
<span className={`pill ${kind}`}><span className="pdot"></span>{children}</span>;

const Tag = ({ children }) => <span className="pill tag">{children}</span>;
window.Pill = Pill;window.Tag = Tag;
window.STATUS_LABEL = STATUS_LABEL;window.PAY_LABEL = PAY_LABEL;
window.SERVICE_LABEL = SERVICE_LABEL;window.SERVICE_ICON = SERVICE_ICON;

// ===== UTILS =====
const fmt = {
  eur: (n) => '€ ' + n.toFixed(2).replace('.', ','),
  date: (iso) => {const d = new Date(iso);return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });},
  dateLong: (iso) => {const d = new Date(iso);return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });},
  dateTime: (iso) => {const d = new Date(iso);return d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });},
  rel: (iso, todayStr = '2026-05-12') => {
    const today = new Date(todayStr);
    const d = new Date(iso);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'amanhã';
    if (diff === -1) return 'ontem';
    if (diff > 0 && diff < 7) return 'em ' + diff + 'd';
    if (diff < 0 && diff > -30) return 'há ' + -diff + 'd';
    return fmt.date(iso);
  },
  initials: (name) => name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
};
window.fmt = fmt;

// ===== SHELL =====
function Sidebar({ route, go, onClose }) {
  const data = window.RDB_DATA;
  const openTasks = data.tasks.filter((t) => t.status !== 'done').length;
  const overdue = data.payments.filter((p) => p.status === 'overdue').length;
  const items = [
  { id: 'overview', label: 'Overview', icon: Icons.home },
  { id: 'tarefas', label: 'Tarefas', icon: Icons.task, badge: openTasks },
  { id: 'clientes', label: 'Clientes', icon: Icons.user },
  { id: 'pagamentos', label: 'Pagamentos', icon: Icons.euro, badge: overdue || null },
  { id: 'notas', label: 'Notas', icon: Icons.note }];

  return (
    <aside className={`sidebar ${onClose ? 'open' : ''}`}>
      <div className="sb-brand">
        <img src="../assets/logo.png" alt="" data-comment-anchor="2e3b9a7e2d-img-90-9" />
        <span className="name">Red<span>Dune</span></span>
      </div>
      <div className="sb-section">Trabalho</div>
      <nav className="sb-nav">
        {items.map((it) =>
        <a key={it.id} className={`sb-item ${route.page === it.id ? 'active' : ''}`}
        onClick={() => {go({ page: it.id });onClose && onClose();}}>
            {it.icon}
            <span>{it.label}</span>
            {it.badge ? <span className="sb-badge">{it.badge}</span> : null}
          </a>
        )}
      </nav>
      <div className="sb-foot">
        <div className="sb-user">
          <div className="av">RD</div>
          <div className="who">
            <b>RedDune</b>
            <small>reddunesolutions@gmail.com</small>
          </div>
          <a className="out" title="Sair" onClick={() => {localStorage.removeItem('rdb_auth');go({ page: 'login' });}}>{Icons.out}</a>
        </div>
      </div>
    </aside>);

}

function TopBar({ title, crumbs, onHamb, right }) {
  return (
    <div className="topbar">
      <button className="hamb" onClick={onHamb} title="Menu">{Icons.menu}</button>
      {crumbs ?
      <div className="crumb">{crumbs}</div> :

      <h1>{title}</h1>
      }
      <div className="search">
        {Icons.search}
        <input placeholder="Pesquisar tarefas, clientes, notas…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="spacer" />
      {right}
      <button className="ico-btn" title="Notificações">{Icons.bell}<span className="dot" /></button>
    </div>);

}
window.Sidebar = Sidebar;window.TopBar = TopBar;

// ===== Drawer =====
function Drawer({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="drawer">
      <div className="scrim" onClick={onClose} />
      <div className="panel">
        <div className="ph">
          <h2>{title}</h2>
          <button className="x" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="pb">{children}</div>
      </div>
    </div>);

}
window.Drawer = Drawer;