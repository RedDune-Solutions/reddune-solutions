(() => {
  const data = (window.LOJA_PRODUCTS || []).slice();
  const grid = document.getElementById('lojaGrid');
  const empty = document.getElementById('lojaEmpty');
  const meta = document.getElementById('lojaMeta');
  const inSearch = document.getElementById('lojaSearch');
  const selCategory = document.getElementById('lojaCategory');
  const selBrand = document.getElementById('lojaBrand');
  const selSort = document.getElementById('lojaSort');
  const condChips = document.querySelectorAll('.cond-chip');
  const clearBtn = document.getElementById('lojaClear');

  const state = {
    q: '',
    category: 'all',
    brand: 'all',
    sort: 'recentes',
    conditions: new Set(['novo', 'recondicionado', 'usado'])
  };

  // ---------- Populate category & brand selects from data ----------
  const cats = [...new Set(data.map(p => p.category))].sort();
  const brands = [...new Set(data.map(p => p.brand))].sort();
  selCategory.innerHTML = '<option value="all">Todas as categorias</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
  selBrand.innerHTML = '<option value="all">Todas as marcas</option>' +
    brands.map(b => `<option value="${b}">${b}</option>`).join('');

  // ---------- Update condition chip counts ----------
  condChips.forEach(chip => {
    const cond = chip.dataset.cond;
    const ct = data.filter(p => p.condition === cond).length;
    const ctEl = chip.querySelector('.ct');
    if (ctEl) ctEl.textContent = ct;
  });

  // ---------- Render ----------
  function fmt(n) { return '€ ' + n.toLocaleString('pt-PT'); }

  function renderCard(p) {
    const cat = `<span class="cat">${p.category}</span>`;
    const cnd = `<span class="cnd ${p.condition}">${p.condition}</span>`;
    const specs = (p.specs || []).slice(0, 4).map(s => `<span>${s}</span>`).join('');
    const priceHtml = (p.price == null)
      ? '<span class="price consulta">Sob consulta</span>'
      : `<span class="price">${fmt(p.price)}</span>`;
    const gp1 = p.palette ? p.palette[0] : '#e89968';
    const gp2 = p.palette ? p.palette[1] : '#5a0e0e';
    const visual = `
      <svg viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="r${p.id}" cx="0.35" cy="0.35"><stop offset="0" stop-color="#fff7e8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff7e8" stop-opacity="0"/></radialGradient>
        </defs>
        <circle cx="${80 + (p.id.length % 80)}" cy="${100 + (p.id.length * 7 % 40)}" r="80" fill="url(#r${p.id})"/>
        <rect x="40" y="180" width="220" height="2" fill="#fff7e8" opacity="0.3"/>
      </svg>`;
    return `
      <article class="prod" data-id="${p.id}" style="--gp1:${gp1}; --gp2:${gp2}">
        <div class="ph">
          ${cnd}${cat}
          ${visual}
        </div>
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        ${specs ? `<div class="specs">${specs}</div>` : ''}
        <div class="row">
          ${priceHtml}
          <span class="arr" aria-hidden="true"></span>
        </div>
      </article>
    `;
  }

  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    let out = data.filter(p => {
      if (!state.conditions.has(p.condition)) return false;
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (state.brand !== 'all' && p.brand !== state.brand) return false;
      if (q) {
        const hay = (p.name + ' ' + p.desc + ' ' + (p.specs || []).join(' ') + ' ' + p.brand + ' ' + p.category).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sort === 'preco-asc') out.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (state.sort === 'preco-desc') out.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    else out.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    grid.innerHTML = out.map(renderCard).join('');
    meta.innerHTML = `<span><b>${out.length}</b> produto${out.length === 1 ? '' : 's'} encontrado${out.length === 1 ? '' : 's'}</span><span>${state.sort === 'recentes' ? 'Recém-adicionados' : (state.sort === 'preco-asc' ? 'Preço crescente' : 'Preço decrescente')}</span>`;

    if (data.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      meta.style.display = 'none';
      empty.querySelector('h3').textContent = 'Sem produtos disponíveis';
      empty.querySelector('p').textContent = 'A loja está em preparação — novos produtos estarão disponíveis em breve. Fala connosco se procuras algo específico.';
    } else if (out.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      meta.style.display = 'flex';
      empty.querySelector('h3').textContent = 'Nada encontrado';
      empty.querySelector('p').textContent = 'Não encontrámos produtos com esses filtros. Limpa os filtros ou tenta outra pesquisa.';
    } else {
      empty.style.display = 'none';
      grid.style.display = 'grid';
      meta.style.display = 'flex';
    }
  }

  // ---------- Drawer ----------
  const drawer = document.getElementById('prodDrawer');
  function openDrawer(id) {
    const p = data.find(x => x.id === id);
    if (!p) return;
    const gp1 = p.palette ? p.palette[0] : '#e89968';
    const gp2 = p.palette ? p.palette[1] : '#5a0e0e';
    const condClass = 'cnd-' + p.condition;
    const stockText = p.stock > 0
      ? `<div class="stockln on">${p.stock} em stock</div>`
      : `<div class="stockln out">Sem stock — encomenda sob pedido</div>`;
    const priceHtml = (p.price == null)
      ? '<div class="priceln consulta">Sob consulta</div>'
      : `<div class="priceln">${'€ ' + p.price.toLocaleString('pt-PT')}</div>`;
    const specs = (p.specs || []).map(s => `<li>${s}</li>`).join('');
    const waText = encodeURIComponent(`Olá! Tenho interesse no produto "${p.name}" (${p.condition}). Preço listado: ${p.price ? '€ ' + p.price : 'sob consulta'}. Está disponível?`);
    const ctParams = new URLSearchParams({
      assunto: 'Produto: ' + p.name,
      tipo: 'loja',
      produto_id: p.id
    });
    drawer.innerHTML = `
      <div class="scrim" data-close="1"></div>
      <div class="panel" style="--gp1:${gp1}; --gp2:${gp2}">
        <div class="ph">
          <button class="close" aria-label="Fechar" data-close="1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
          <svg viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice">
            <defs><radialGradient id="rdrw" cx="0.3" cy="0.3"><stop offset="0" stop-color="#fff7e8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff7e8" stop-opacity="0"/></radialGradient></defs>
            <circle cx="200" cy="190" r="150" fill="url(#rdrw)"/>
          </svg>
        </div>
        <div class="body">
          <div class="badges">
            <span class="badge-pill ${condClass}">${p.condition}</span>
            <span class="badge-pill">${p.category}</span>
            <span class="badge-pill">${p.brand}</span>
          </div>
          <h2>${p.name}</h2>
          ${priceHtml}
          ${stockText}
          <p class="desc">${p.desc}</p>
          <div class="specs-sec">
            <h4>Especificações</h4>
            <ul class="specs-list">${specs}</ul>
          </div>
          <div class="pd-actions">
            <a class="wa" href="https://wa.me/351961531235?text=${waText}" target="_blank" rel="noopener">
              WhatsApp
            </a>
            <a class="ct" href="../contacto/index.html?${ctParams.toString()}">
              Formulário de contacto
            </a>
          </div>
          <div class="pd-meta">Garantia conforme política da loja. Pede orçamento sem compromisso.</div>
        </div>
      </div>
    `;
    drawer.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('on');
    document.body.style.overflow = '';
  }

  // ---------- Events ----------
  inSearch.addEventListener('input', e => { state.q = e.target.value; applyFilters(); });
  selCategory.addEventListener('change', e => { state.category = e.target.value; applyFilters(); });
  selBrand.addEventListener('change', e => { state.brand = e.target.value; applyFilters(); });
  selSort.addEventListener('change', e => { state.sort = e.target.value; applyFilters(); });
  condChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cond = chip.dataset.cond;
      if (state.conditions.has(cond)) {
        if (state.conditions.size > 1) { state.conditions.delete(cond); chip.classList.remove('on'); }
      } else {
        state.conditions.add(cond);
        chip.classList.add('on');
      }
      applyFilters();
    });
  });
  clearBtn.addEventListener('click', () => {
    state.q = ''; inSearch.value = '';
    state.category = 'all'; selCategory.value = 'all';
    state.brand = 'all'; selBrand.value = 'all';
    state.sort = 'recentes'; selSort.value = 'recentes';
    state.conditions = new Set(['novo', 'recondicionado', 'usado']);
    condChips.forEach(c => c.classList.add('on'));
    applyFilters();
  });
  grid.addEventListener('click', e => {
    const card = e.target.closest('.prod');
    if (card) openDrawer(card.dataset.id);
  });
  drawer.addEventListener('click', e => {
    if (e.target.dataset.close === '1' || e.target.closest('[data-close="1"]')) closeDrawer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('on')) closeDrawer();
  });

  applyFilters();

  // Hide nav when the toolbar becomes sticky (user scrolled past hero)
  const navEl = document.querySelector('nav.top');
  const toolbar = document.querySelector('.loja-toolbar');
  if (navEl && toolbar) {
    navEl.style.transition = 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.22s ease';
    const onScroll = () => {
      const tbTop = toolbar.getBoundingClientRect().top;
      // Toolbar reaches the sticky position (~90px from top); hide nav.
      if (tbTop <= 96) {
        navEl.style.transform = 'translate(-50%, -140%)';
        navEl.style.opacity = '0';
        navEl.style.pointerEvents = 'none';
      } else {
        navEl.style.transform = 'translateX(-50%)';
        navEl.style.opacity = '1';
        navEl.style.pointerEvents = '';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
