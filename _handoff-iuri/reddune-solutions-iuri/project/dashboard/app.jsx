/* global React, ReactDOM */
const { useState, useEffect, useCallback } = React;

function parseHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  if (!h) return { page: 'overview' };
  const parts = h.split('/');
  return { page: parts[0] || 'overview', id: parts[1] || null };
}
function writeHash(route) {
  const h = '#/' + route.page + (route.id ? '/' + route.id : '');
  if (window.location.hash !== h) window.location.hash = h;
}

function App(){
  const [auth, setAuth] = useState(() => !!localStorage.getItem('rdb_auth'));
  const [route, setRoute] = useState(parseHash());
  const [sbOpen, setSbOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((r) => {
    if (r.page === 'login') { setAuth(false); return; }
    writeHash(r);
    setRoute(r);
    setSbOpen(false);
  }, []);

  if (!auth) {
    return <window.PageLogin onAuth={() => { setAuth(true); writeHash({page:'overview'}); setRoute({page:'overview'}); }} />;
  }

  const titles = {
    overview: 'Visão geral',
    tarefas: 'Tarefas',
    clientes: 'Clientes',
    pagamentos: 'Pagamentos',
  };

  let body;
  switch(route.page){
    case 'overview':   body = <window.PageOverview go={go} />; break;
    case 'tarefas':    body = <window.PageTarefas route={route} go={go} />; break;
    case 'clientes':   body = <window.PageClientes route={route} go={go} />; break;
    case 'pagamentos': body = <window.PagePagamentos go={go} />; break;
    default:           body = <window.PageOverview go={go} />;
  }

  return (
    <div className="app">
      {sbOpen && <div className="scrim-side" onClick={()=>setSbOpen(false)} />}
      <window.Sidebar route={route} go={go} onClose={sbOpen ? () => setSbOpen(false) : null} />
      <main className="main">
        <window.TopBar
          title={titles[route.page]}
          onHamb={() => setSbOpen(true)}
        />
        <div className="page">{body}</div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
