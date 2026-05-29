# Reddune Solutions — Dashboard (Painel) Redesign Brief

> Goal: redesign the internal admin dashboard ("painel") with a more beautiful, modern UI **while preserving every function listed here**. This is an internal tool for a 2-person tech-services company (hardware repair, web/digital, data recovery) in Fuseta, Algarve. Language: Portuguese (PT-PT). Single shared login (team account) — no per-user roles.

---

## 1. Global layout

- **Left sidebar** (collapsible 64px ↔ 256px, state saved to localStorage):
  - Logo (links to public site) + collapse toggle.
  - Nav items (reorderable by user, order saved per-device):
    1. **Visão geral** (overview) — `/painel`
    2. **Tarefas** (tasks) — `/painel/tarefas`
    3. **Projectos** (projects) — `/painel/projetos`
    4. **Clientes** (clients) — `/painel/clientes`
    5. **Dívidas** (debts) — `/painel/dividas`
    6. **Calendário** — `/painel/calendario`
    7. **Relatórios** (reports) — `/painel/relatorios`
    8. **Serviços** (service prices) — `/painel/precos`
    9. **Loja** (shop) — `/painel/loja`
    10. **Portfólio** — `/painel/portfolio`
    11. **Auditoria** (audit log) — `/painel/auditoria`
    12. **Definições** (settings) — `/painel/definicoes`
  - "Atalhos" section: "Ver site público" (open public site new tab).
  - Footer: user avatar (initial), name, email, sign-out button.
  - Active item: ember/orange left-border + ember tint background. Loading spinner on pending nav.
- **Topbar** per page: title + short description. Also hosts a **global search** (GlobalSearch) and mobile menu button.
- **Mobile**: sidebar collapses to a hamburger menu button.

**Current visual tokens** (keep brand, can refine): cream/sand warm backgrounds, ink (near-black) text, **ember orange accent**, rounded cards (`rounded-lg`/`rounded-xl`/`rounded-2xl`), subtle warm shadows, `font-headline` for headings, mono for eyebrow/labels (uppercase, letter-spaced).

**Reusable components to keep:**
- `KpiCard`: label + big value + icon + optional hint. Tones: `default`, `accent` (ember), `amber`, `green`.
- `TarefaCard`: project summary card (title, client, status badge, next action, dates).
- `StatusBadge`: colored pill for project status.
- Empty states: dashed border, centered icon + heading + helper text.

---

## 2. Pages & functions

### 2.1 Visão geral (`/painel`) — Overview
- **TodayWidget**: today's projects/deadlines snapshot.
- KPI row 1 (4 cards): **Em curso** (active count, accent), **Próximos** (backlog), **Em espera** (waiting client/parts/supplier, amber), **Prontos** (done, awaiting delivery/payment, green).
- KPI row 2 (3 cards): **Clientes** (total), **Em dívida** (count + estimated € owed, amber), **Em atraso 30+ dias** (terminated >30d unpaid, accent, links to /dividas).
- **Próximas acções** section: up to 6 active projects that have a "next action" set, as TarefaCards. "Ver todos" → kanban.
- Empty state when no projects.

### 2.2 Tarefas (`/painel/tarefas`) — Tasks
- Filter tabs: **Todas / Hoje / Esta semana / Vencidas** (overdue).
- Toggle: **Mostrar feitas** (show completed) ↔ "✓ Feitas visíveis".
- Topbar shows pending count.
- **TarefasPorProjeto**: tasks grouped by project, with checkboxes to mark done.
- "Nova tarefa" global button (modal): pick project, title, due date.

### 2.3 Projectos (`/painel/projetos`) — Projects
- **FilterBar**: filter by status, categoria (service area), tipo (subtype), cliente, free-text search `q`.
- **ViewToggle**: **Kanban** ↔ **Lista** (list/table).
- **KanbanBoard**: columns by status group, drag cards between columns (inline status change). Column order customizable in Definições.
- **TarefasTable**: sortable list view.
- "Nova tarefa" (new project) button → form with client picker.
- **Project statuses**: Ideia (interna), Ideia (cliente), Próximo, Em curso, Aguarda cliente, Aguarda encomenda, Terminado, Fechado, Cancelado.

#### Project detail (`/painel/projetos/[id]`)
Two-column layout:
- **Main**:
  - **NotasContextoCard**: free notes / markdown context (top).
  - **TarefaForm**: inline editor for all project fields (title, client, status, categoria/tipo, responsável, prazo/deadline, valor estimado, método pagamento, local).
  - **TarefaChecklist**: subtasks list with done count `x/total`.
  - **PagamentosSection**: record/list payments (valor, data, método, notas). Methods: Dinheiro, Multibanco, MB Way, Transferência, Outro.
  - **HardwareSection** (only for `assistencia-tecnica`): marca/modelo/serial/acessórios entregues.
  - **CustosCard**: cost line items (LinhasEditor): peça / mão-de-obra / outro, qty × unit price.
- **Aside** (sticky):
  - **Badges**: "Em dívida: X€", "Garantia até <date>" / "Garantia expirada".
  - **Informações**: cliente, prazo, criado, fechado, valor estimado, valor pago, pagamento, local.
- Top: back link + row menu (TarefaRowMenu: status change, delete, etc.).

### 2.4 Clientes (`/painel/clientes`) — Clients
- KPIs: **Total de clientes**, **Com projectos activos**.
- "Novo cliente" button.
- Grid of client cards: nome, email, NIF, project count (+ active count in accent).
- Empty state.

#### Client detail (`/painel/clientes/[id]`)
- **ClienteForm** inline edit: nome, email, telefone, NIF, morada, notas.
- KPIs: Projectos, Em curso/espera, Concluídos, Valor estimado (sum), Em dívida (owed).
- **Activos** section: active project cards.
- **Histórico de pagamentos**: payments grouped by project, totals.
- **Histórico completo**: vertical timeline of all client projects.

### 2.5 Dívidas (`/painel/dividas`) — Debts
- KPIs: **Em dívida** (count of terminated-unpaid projects, amber), **Valor por receber** (€ total).
- Table (TarefasTable) of projects with `status=terminado` and paid < estimated.
- Empty state explaining the rule.

### 2.6 Calendário (`/painel/calendario`)
- Views: **Mês / Semana / Dia** (CalendarViewToggle).
- Prev/Next nav + "Hoje" button. Title shows current period (PT month names).
- Shows projects + tasks that have scheduled deadlines.
- MonthCalendar / WeekCalendar / DayCalendar components.

### 2.7 Relatórios (`/painel/relatorios`) — Reports
- KPI grid (7): Valor estimado activo, A aguardar cliente, Ganhos este mês, Em dívida, Projectos totais, Clientes, Concluídos/arquivo.
- Charts (in cards):
  - **StatusPie**: projects by status.
  - **TipoBar**: projects by subtype (most frequent).
  - **ValorMensal** (full width): estimated vs paid per month, last 12 months.
  - **PagamentosPorMetodo**: total received per payment method.
  - **ProjetosPorMes**: created vs closed per month, last 12 months.
  - **Top 5 clientes por valor pago**: ranked list with € totals.

### 2.8 Serviços (`/painel/precos`) — Service prices (PUBLIC-FACING DATA)
- 3 collapsible sections by service area: Assistência Técnica, Web & Digital, Software & Recuperação (with item count).
- **ServicosEditor** per area — manages the price list shown on the public `/servicos` pages:
  - Per service item: **Título (PT + EN)**, **Descrição (PT + EN)**, image upload, order, active toggle.
  - Pricing modes: single (preço mín / máx, "desde X€" toggle) OR **variantes** (e.g. Desktop / Portátil / Consola, each with PT+EN label and min/max price).
  - **Nota** suffix (PT + EN).
  - Bilingual: PT is canonical, EN optional (falls back to PT). This page IS bilingual because it feeds the public site.

### 2.9 Loja (`/painel/loja`) — Shop (PUBLIC-FACING DATA)
- **LojaClient** product manager (grid + ProductForm).
- Product fields (bilingual {pt,en}): name, description, category, condition; plus price, image URLs, available, featured.
- Detail edit at `/painel/loja/[id]`.

### 2.10 Portfólio (`/painel/portfolio`) — Portfolio (PUBLIC-FACING DATA)
- **PortfolioClient** manager (PortfolioForm).
- Item fields: title {pt,en}, image, URL, categoria (one of 3 service areas), "destaque na landing" flag.
- Detail edit at `/painel/portfolio/[id]`.

### 2.11 Auditoria (`/painel/auditoria`) — Audit log
- Table of last 200 mutations: Quando (datetime), Quem (user email), Acção (Criou/Editou/Apagou — colored: green/blue/rose), Recurso (Projecto/Cliente/Tarefa/Pagamento/Produto/Trabalho/Serviço), ID.

### 2.12 Definições (`/painel/definicoes`) — Settings
- **Ordem das tabs**: reorder sidebar nav (saved per device).
- **Ordem das colunas Kanban**: reorder kanban columns.
- **Tipos de projecto personalizados**: add custom subtypes under the 3 base areas; they appear in the project form.

---

## 3. Data model (for context)

- **Projeto**: id, titulo, clienteId/Nome, proximaAccao, status, categoria (service area), tipo + tipos[], responsavel (eu/cliente/fornecedor), prazo, dataCriado, dataFechado, valorEstimado, valorPago, metodoPagamento, local (oficina/casa-cliente/remoto), notasResumo, bodyMd, linhas[] (cost lines), garantiaAte, hardware{marca,modelo,serial,acessorios}.
- **Cliente**: id, nome, email, telefone, nif, morada, notas, criadoEm.
- **Pagamento**: id, projetoId, clienteId, valor, data, metodo, notas.
- **Servico** (public): slug, titulo(+i18n), descricao(+i18n), preço (base/max/variantes), nota(+i18n), imageUrl, ordem, ativo.
- **Product** (public): name/description/category/condition {pt,en}, price, imageUrls[], available, featured.
- **PortfolioItem** (public): title{pt,en}, imageUrl, url, categoria, destaqueLanding.

**Service areas (3):** Assistência Técnica · Web & Digital · Software & Recuperação.

---

## 4. Redesign instructions

- **Keep all pages, KPIs, filters, toggles, forms, and the data each renders.** Do not drop functionality.
- Modernize: cleaner spacing, refined typography, nicer cards/charts, better empty states, smooth transitions, dark-mode optional.
- Keep the warm brand palette (cream/sand/ink + ember orange) but you may elevate it.
- Internal-tool UX: dense but legible, fast scanning, keyboard-friendly, mobile-responsive.
- Portuguese labels (PT-PT) — keep wording as-is unless improving clarity.
- Deliver: page-by-page mockups for the 12 pages + 2 detail pages (project, client), plus the shared sidebar/topbar and the reusable components (KpiCard, TarefaCard, StatusBadge, charts).
