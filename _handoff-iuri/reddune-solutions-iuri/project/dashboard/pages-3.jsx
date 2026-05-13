/* global React, RDB_DATA, Pill, Tag, fmt, Icons */
const { useState: useS3, useMemo: useM3 } = React;

// ===== NOTES (Obsidian-like) =====
// Tiny markdown-ish renderer with [[wiki]] links

function renderNoteBody(text, notes, onNav) {
  const lines = text.split('\n');
  const out = [];
  let inList = null; // null | 'ul' | 'ol'
  let listBuf = [];
  let inTable = false;
  let tableRows = [];

  function flushList() {
    if (inList === 'ul') out.push(<ul key={'u'+out.length}>{listBuf}</ul>);
    if (inList === 'ol') out.push(<ol key={'o'+out.length}>{listBuf}</ol>);
    listBuf = []; inList = null;
  }
  function flushTable() {
    if (!tableRows.length) return;
    const head = tableRows[0]; const body = tableRows.slice(2);
    out.push(
      <table key={'tb'+out.length} style={{width:'100%', borderCollapse:'collapse', margin:'10px 0', fontSize:13}}>
        <thead><tr>{head.map((h,i)=><th key={i} style={{textAlign:'left', borderBottom:'1px solid var(--line)', padding:'6px 8px', color:'var(--ink-mute)', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em'}}>{inlineMd(h, notes, onNav)}</th>)}</tr></thead>
        <tbody>{body.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{padding:'6px 8px', borderBottom:'1px dashed var(--line)'}}>{inlineMd(c, notes, onNav)}</td>)}</tr>)}</tbody>
      </table>
    );
    tableRows = []; inTable = false;
  }

  lines.forEach((raw, idx) => {
    const ln = raw.trimEnd();
    // table row
    if (ln.startsWith('|') && ln.endsWith('|')) {
      const cells = ln.slice(1,-1).split('|').map(s=>s.trim());
      tableRows.push(cells);
      inTable = true;
      return;
    } else if (inTable) { flushTable(); }

    if (ln.startsWith('### ')) { flushList(); out.push(<h3 key={idx}>{inlineMd(ln.slice(4), notes, onNav)}</h3>); return; }
    if (ln.startsWith('#### ')) { flushList(); out.push(<h4 key={idx}>{inlineMd(ln.slice(5), notes, onNav)}</h4>); return; }
    if (/^\s*[-*]\s+\[(x| )\]\s+/.test(ln)) {
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      const checked = /\[x\]/.test(ln);
      const txt = ln.replace(/^\s*[-*]\s+\[(x| )\]\s+/, '');
      listBuf.push(<li key={idx} style={{listStyle:'none', marginLeft:-18, display:'flex', gap:8, alignItems:'flex-start'}}>
        <input type="checkbox" defaultChecked={checked} style={{marginTop:5}} />
        <span style={{textDecoration: checked?'line-through':'none', color: checked?'var(--ink-mute)':undefined}}>{inlineMd(txt, notes, onNav)}</span>
      </li>);
      return;
    }
    if (/^\s*[-*]\s+/.test(ln)) {
      if (inList !== 'ul') { flushList(); inList = 'ul'; }
      listBuf.push(<li key={idx}>{inlineMd(ln.replace(/^\s*[-*]\s+/,''), notes, onNav)}</li>);
      return;
    }
    if (/^\s*\d+\.\s+/.test(ln)) {
      if (inList !== 'ol') { flushList(); inList = 'ol'; }
      listBuf.push(<li key={idx}>{inlineMd(ln.replace(/^\s*\d+\.\s+/,''), notes, onNav)}</li>);
      return;
    }
    if (ln.startsWith('> ')) { flushList(); out.push(<blockquote key={idx}>{inlineMd(ln.slice(2), notes, onNav)}</blockquote>); return; }
    if (ln.trim() === '') { flushList(); return; }
    flushList();
    out.push(<p key={idx}>{inlineMd(ln, notes, onNav)}</p>);
  });
  flushList();
  flushTable();
  return out;
}

function inlineMd(text, notes, onNav) {
  const parts = [];
  let i = 0;
  // Regex: [[wiki-id|label]] or [[wiki-id]] · **bold** · `code`
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let m; let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    if (m[1]) {
      const slug = m[1].trim();
      const label = (m[2] || slug).trim();
      const target = notes.find(n => n.id === slug || n.title.toLowerCase().replace(/[^\w]+/g,'-').includes(slug) || slug.includes(n.id));
      parts.push(<a key={key++} className="wiki" onClick={() => target ? onNav(target.id) : null} style={{cursor: target?'pointer':'default'}}>{label}</a>);
    } else if (m[3]) {
      parts.push(<b key={key++}>{m[3]}</b>);
    } else if (m[4]) {
      parts.push(<code key={key++}>{m[4]}</code>);
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

function PageNotas({ route, go }){
  const data = window.RDB_DATA;
  const noteId = route.id || data.notes[0].id;
  const note = data.notes.find(n => n.id === noteId) || data.notes[0];
  const [search, setSearch] = useS3('');

  const folders = useM3(() => {
    const m = {};
    data.notes.forEach(n => { (m[n.folder] = m[n.folder] || []).push(n); });
    return m;
  }, []);

  const filtered = search
    ? data.notes.filter(n => (n.title + ' ' + n.body + ' ' + n.tags.join(' ')).toLowerCase().includes(search.toLowerCase()))
    : null;

  const backlinks = data.notes.filter(n => n.id !== note.id && n.body.includes(note.id));

  return (
    <>
      <div className="flex mb-3" style={{flexWrap:'wrap', gap:10}}>
        <h2 className="h-title">Notas</h2>
        <span className="text-mute" style={{fontSize:13}}>· {data.notes.length} notas · {Object.keys(folders).length} pastas</span>
        <span className="spacer"/>
        <button className="btn primary">{Icons.plus} Nova nota</button>
      </div>

      <div className="notes-shell">
        <div className="notes-tree">
          <div className="searchbox" style={{marginBottom:10, maxWidth:'none'}}>
            {Icons.search}
            <input placeholder="Pesquisar…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {filtered ? (
            <>
              <div className="nt-section">Resultados ({filtered.length})</div>
              {filtered.map(n => (
                <div key={n.id} className={`nt-item ${n.id===note.id?'on':''}`} onClick={()=>go({page:'notas', id:n.id})}>
                  {React.cloneElement(Icons.note, {})}
                  <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title}</span>
                </div>
              ))}
            </>
          ) : (
            Object.entries(folders).map(([f, items]) => (
              <div key={f}>
                <div className="nt-section" style={{display:'flex', alignItems:'center', gap:6}}>{Icons.folder} {f}</div>
                {items.map(n => (
                  <div key={n.id} className={`nt-item ${n.id===note.id?'on':''}`} onClick={()=>go({page:'notas', id:n.id})}>
                    <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title}</span>
                    <span className="ct">{fmt.rel(n.updated, data.today)}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="notes-edit">
          <div className="ne-head">
            <div style={{flex:1}}>
              <div style={{fontSize:11, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:4}}>{note.folder} · atualizada {fmt.rel(note.updated, data.today)}</div>
              <h2>{note.title}</h2>
            </div>
            <div className="tags">
              {note.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </div>
            <button className="btn ghost sm">{Icons.edit} Editar</button>
          </div>
          <div className="ne-body">
            {renderNoteBody(note.body, data.notes, (id)=>go({page:'notas', id}))}
            {backlinks.length > 0 && (
              <div style={{marginTop:32, paddingTop:18, borderTop:'1px dashed var(--line)'}}>
                <h4>Ligações de regresso</h4>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {backlinks.map(b => (
                    <a key={b.id} className="wiki" onClick={()=>go({page:'notas', id:b.id})} style={{cursor:'pointer'}}>{b.title}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
window.PageNotas = PageNotas;

// ===== LOGIN =====
function PageLogin({ onAuth }){
  const [email, setEmail] = useS3('reddunesolutions@gmail.com');
  const [pw, setPw] = useS3('reddune2026');
  const [err, setErr] = useS3('');
  const [loading, setLoading] = useS3(false);
  const ALLOWED = ['reddunesolutions@gmail.com'];

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setTimeout(() => {
      if (!ALLOWED.includes(email.trim().toLowerCase())) {
        setErr('Este email não tem acesso autorizado.');
        setLoading(false);
        return;
      }
      if (pw.length < 6) {
        setErr('Password inválida.');
        setLoading(false);
        return;
      }
      localStorage.setItem('rdb_auth', JSON.stringify({ email, at: Date.now() }));
      onAuth();
    }, 600);
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="lg-brand">
          <img src="../assets/logo.png" alt="" />
          <span style={{fontWeight:600}}>RedDune <span style={{color:'var(--ember)'}}>Solutions</span></span>
        </div>
        <h1>Entrar na <em>dashboard</em></h1>
        <p className="lg-sub">Acesso restrito · só emails autorizados</p>

        <div style={{marginBottom:14, position:'relative'}}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.pt" required />
        </div>
        <div style={{position:'relative'}}>
          <label>Password</label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
        </div>

        {err && <div className="err">{Icons.alert} {err}</div>}

        <button type="submit" className="btn primary lg-cta" disabled={loading}>
          {loading ? 'A entrar…' : <>Entrar {Icons.arrowR}</>}
        </button>

        <div className="hint">
          <b>Demo:</b> <code>reddunesolutions@gmail.com</code> · password <code>reddune2026</code>
        </div>

        <div className="lg-foot">
          <a href="../site/index.html">← Voltar ao site</a>
        </div>
      </form>
    </div>
  );
}
window.PageLogin = PageLogin;
