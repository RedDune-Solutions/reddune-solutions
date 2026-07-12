# Inventário do Painel `/painel` — o que está ligado, dormente ou morto

> Documento para handoff ao Claude Design. Objectivo: antes de redesenhar, saber o que vale a pena **manter**, **alterar** ou **remover**.
> Auditoria read-only de 16 zonas do painel (dashboard → API), cada botão/valor seguido até à rota/loader que o serve. **Nada nos dados MongoDB foi tocado.**
> Data: 2026-07-09. Base: `main` (commit `08ee5a8`, portal do cliente em produção).

---

## TL;DR

**Boa notícia: o painel está quase todo LIGADO a dados reais do MongoDB. Não há um único número fake/placeholder em nenhuma tab.** Cada KPI, gráfico e lista vem de um loader Mongo; cada botão de mutação tem rota autenticada + validação Zod + audit log. O que existe para limpar é: umas quantas **rotas GET órfãs**, **componentes mortos** de iterações antigas, **campos legacy sem editor**, **rótulos enganadores** e muita **cor hardcoded** fora do design system (o ponto mais relevante para um redesign).

**Dormente = código completo mas inerte sem env var.** Só 4 coisas, e a mais valiosa (Web Push) activa-se com 2 variáveis.

---

## 1. Estado global por tab

| Tab | Estado | Nota |
|---|---|---|
| Visão geral (dashboard) | ✅ Ligado | Sparkline morto (série fake); saudação "Equipa" hardcoded |
| Tarefas | ✅ Ligado | Campo `notas` write-only; `EditTarefaActions` morto |
| Projectos (lista + Kanban) | ✅ Ligado | Filtros fantasma por URL; guard "Fechar" morto |
| Projecto (detalhe) | ✅ Ligado | 3 campos legacy sem editor; portal do cliente é a secção mais robusta |
| Clientes | ✅ Ligado | `DELETE` sem UI; "activo" contado diferente do resto |
| Leads | ✅ Ligado | Push dormente; desbloquear IP sem UI |
| Procurar | ✅ Ligado | Só cobre projectos/clientes/tarefas; `⌘K` errado em Windows |
| Dívidas | ✅ Ligado | "última cobrança" = na verdade último pagamento |
| Calendário | ✅ Ligado | Janela 08–20h esconde tarefas; cores por vista divergem |
| Serviços/Preços | ✅ Ligado | Alimenta mesmo o site `/servicos`; bug i18n "desde" |
| Loja | ✅ Ligado | Tab "Catálogo" decorativa; migração DB legacy pendente |
| Portfólio | ✅ Ligado | Controla landing + `/portfolio` públicos |
| Auditoria | ✅ Ligado | Cobertura CRUD total (37 call sites); `auth_audit` sem leitor |
| Definições | ✅ Ligado | Perfil da empresa write-only; nav highlight preso no 1.º item |
| Shell (sidebar/topbar/bell/PWA) | ✅ Ligado | `MobileMenuButton` morto; "Painel · 2026" hardcoded |
| Superfície API | ⚠️ | 8 rotas órfãs; 4 dormentes transversais |

Zonas mais sólidas (só precisam de restyle, não de rewiring): **Leads, Loja, Portfólio, Dívidas, Calendário, Auditoria, Projectos**.

---

## 2. Dormente — código pronto, falta activar

| Item | O que precisa | Valor |
|---|---|---|
| **Web Push / VAPID** | 2 env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (gerar com `npx web-push generate-vapid-keys`) | **Alto.** Activa 4 notificações já escritas e testadas: novo lead, comentário no portal, ficha de cliente editada. Hoje o botão "Ativar notificações" nem renderiza. Com o portal recém-lançado, há eventos que ninguém vê em tempo real. |
| **Turnstile (CAPTCHA)** | `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Baixo. Dormente por decisão (honeypot + rate-limit + blocklist já cobrem o spam). Manter dormente. |
| **Upstash (rate-limit distribuído)** | `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Baixo. Cai para MongoDB (Node) / memória (Edge middleware). Só ligar se aparecer abuso de login real. |
| **Migração `website.loja` → `products`** | Correr `scripts/migrate-products-db.mjs` (idempotente) + trocar constantes em `products.ts:9-10` | Médio. Dívida de arrumação de BD. Baixo risco. Tirar antes do redesign. |

**Dependências internas (não env), a resolver no redesign:**
- **Botão "Abrir" do sandbox dá 404 quando o portal não está activo** — `PortalSection.tsx:273` lista o sandbox com botão "Abrir" mesmo sem link de portal gerado; a rota devolve 404 silencioso. → Desactivar o botão com tooltip "Gera o link do portal primeiro".
- **`auth_audit` (logins) escrito mas sem leitor** — `logAuthEvent` grava signin-success/rejected/signout com IP+userAgent, mas nenhuma página lê. → Expor como tab "Logins" na Auditoria (dado de segurança).
- **Tag de cache `painel-counts` nunca invalidada** — `unstable_cache` declara a tag mas nada chama `revalidateTag`. Badges só actualizam pelo TTL de 20s. → Chamar `revalidateTag` nas mutações OU remover a tag.

---

## 3. Código morto — REMOVER

**Rotas GET órfãs (autenticadas mas sem nenhum caller — as páginas lêem por loader server-side):**
- `GET /api/projetos`
- `GET /api/tarefas`
- `GET /api/clientes`
- `GET /api/portfolio`
- `GET /api/servicos`
- `GET /api/products`
- `GET /api/settings`
- `GET /api/blocked-ips` (+ o branch `action="unblock"` que nenhum caller usa)

→ 8 handlers de leitura mortos. Se o redesign quiser data-fetching client-side (SWR/refresh), recria-se só o necessário nessa altura.

**Rotas perigosas/redundantes:**
- `POST /api/upload/product-image/delete` — sem caller **e** permite apagar qualquer blob por URL sem verificar se ainda está referenciado. A limpeza de blobs órfãos já acontece server-side nos upserts/deletes.

**Componentes/exports órfãos:**
- `EditTarefaActions.tsx` — nunca importado; pior, o nome engana (edita **projectos**, não tarefas).
- `MobileMenuButton.tsx` — drawer mobile antigo, substituído pela `BottomNav`.
- `Sparkline.tsx` + prop `spark` do `KpiCard` — série FAKE hardcoded como default (`[3,6,5,8,7,11,9,14,12,16]`); nenhum caller passa `spark=`. Remover, ou ligar a séries reais antes de reexpor.
- `upsertLead` (`leads.ts:27`) — export sem call sites.
- `getAuditEntriesFor()` (`mutation-audit.ts:84`) — export sem call sites (o índice `collection+entityId+at` existe sobretudo para o servir).
- `Draft.precoTexto` no `ServicosEditor` — estado cliente morto (nunca renderizado nem enviado); a preservação legacy já é server-side.
- `scrollRef` morto no `BottomNav.tsx:38`.
- Classe CSS `gsearch-page` sem regra em lado nenhum (caixa de pesquisa in-page fica com 320px fixos).

**Decisão pendente (backend pronto, sem UI):**
- `DELETE /api/clientes/[id]` — existe (auth + audit) mas não há botão "Apagar cliente" em lado nenhum. → Ou adicionar a acção na ficha (com aviso se houver projectos/pagamentos), ou remover a rota. Ter delete de PII por API sem UI é meio caminho para inconsistência.

---

## 4. Campos legacy sem editor (mostram dados antigos que ninguém consegue mudar)

- **`projeto.valorPago`** — nenhum form o escreve; pode contradizer o "Recebido" real calculado da colecção `pagamentos`. **Fonte única de verdade = `pagamentos`.** Remover do aside.
- **`projeto.metodoPagamento`** e **`projeto.local`** — sem editor no painel; o método agora vive por-pagamento (`Pagamento.metodo`). Só renderizam dados antigos. → Ou ganham campo no form, ou saem.
- **`Lead.notas`** — sempre criado a `null`, nenhuma UI lê/escreve. → Dar-lhe uso (textarea de follow-up no Sheet do lead) ou remover do tipo.
- **`tarefa.notas`** — o textarea grava no Mongo mas **nenhum ecrã mostra** as notas (só entram no matching da pesquisa). O utilizador escreve algo que nunca mais lê. → Mostrar ao expandir a tarefa, ou remover o campo.

---

## 5. Rótulos e valores enganadores (dado real, etiqueta errada)

- **"Top clientes · 6 meses" (Relatórios)** — o cálculo soma **TODOS** os pagamentos, sem filtro de 6 meses. É top clientes *all-time*. O rótulo mente.
- **"Projectos fechados" (Relatórios)** — all-time, mas a página diz "últimos 6 meses" no cabeçalho.
- **Donut "PROJECTOS" (Relatórios)** — o número central **não** é o total: exclui ideias e arquivo (fechado/cancelado). É o pipeline actual.
- **"última cobrança {data}" (Dívidas)** — mostra a data do **último pagamento recebido**, não de uma cobrança/lembrete enviado (não existe registo de lembretes). → Renomear "último pagamento".
- **Hint `⌘K` (Procurar / Topbar)** — mostra sempre o símbolo Mac mesmo em Windows/Linux, onde o atalho real (e funcional) é Ctrl+K. O dono usa Windows.
- **Copy "integrações" (Definições)** — a Topbar diz "Configuração do painel, integrações e perfil da empresa" mas não existe secção de integrações nenhuma.
- **"Painel · 2026" (sidebar)** — ano hardcoded, fica errado em Janeiro.
- **Saudação "…, Equipa." (dashboard)** — nome fixo em string, não vem da sessão NextAuth.
- **Bug i18n "desde" (`/servicos` público)** — no ramo que lê preços da BD, renderiza `desde X€` mesmo em EN (devia ser "from"). O resto do site já usa o label traduzido.
- **`aria-label` "Ver no site" (Portfólio)** — o botão abre o URL externo do projecto, não a página `/portfolio`.
- **Saudação "Bom dia/tarde/noite"** — usa `now.getHours()` = hora UTC na Vercel; erra 1h nas fronteiras (Lisboa é UTC+1 no verão). O resto da página já usa o fuso de Lisboa.

---

## 6. Inconsistências de design system — o ponto quente para o redesign

**Cores hardcoded fora dos tokens (`--ember`, `--cream`, etc.), espalhadas por vários ficheiros:**
- Widget "Hoje" do dashboard: `#c89b6a`, `#f5e9d3`, `#6a4f3e`
- Checklist de tarefas: `#faf4e3`
- Kanban `STATUS_DOT`: 6 hex hardcoded (só "em-curso" usa `var(--ember)`)
- StatusStrip do projecto: `rgba(90,14,14,0.12)`; badge de comentários `#d6422a`
- Leads `LeadsTable`: `#9a6b14`, `#2f6f8a`, `#3f7d4a`
- Sino de notificações: fallbacks literais `#d6422a`/`#f7eedb`/`#efe3cd`/`#8a7a63`

**Paletas de status DUPLICADAS (o mesmo estado muda de cor conforme a vista):**
- Calendário: `STATUS_EV` (vista mês, terminado=verde) vs `STATUS_DOT` copy-paste em `WeekCalendar` **e** `DayCalendar` (terminado=âmbar).
- Kanban dot vs `.badge` do `InlineStatusSelect` definem cores em sítios diferentes.

→ **Recomendação forte:** unificar TODAS as cores de status numa única fonte (ex.: export ao lado de `STATUS_GROUPS` em `types/projeto.ts`) e mover os hex para tokens CSS em `painel.css`. Num redesign visual, isto parte-se logo se ficar espalhado.

**Layout inline a lutar com media queries:**
- `gridTemplateColumns: "repeat(4, 1fr)"` inline em Loja, Portfólio, dashboard kpi-grid — mover para classes responsivas.

**`dangerouslySetInnerHTML` frágil:**
- `KpiCard.hint` e `Topbar.titleHtml` recebem HTML em string (hoje conteúdo interno, risco nulo, mas frágil no redesign). → Trocar props por `ReactNode` + `<Link>` normal.

---

## 7. Inconsistências funcionais (decidir a semântica no redesign)

- **"Projecto activo" definido de 4 formas** — as páginas de Clientes contam 4 estados (em-curso, proximo, aguardando-encomenda, terminado, **excluindo** aguardando-cliente), mas o badge da sidebar usa só `['em-curso','proximo']` (`PROJETO_ATIVO_STATUSES`, comentado como "Fonte ÚNICA"). Os KPIs de clientes não batem com o badge. → Criar um grupo nomeado e usar em todo o lado.
- **Guard "Fechar" morto → fecha projectos com dívida** — `InlineStatusSelect` só devia mostrar "Fechar" quando o projecto está liquidado, mas **nenhum caller passa `pagoTotal`/`valorEstimado`**; com `undefined`, "liquidado" avalia `true`. Resultado: dá para fechar um projecto com dívida por pagar, e a dívida **desaparece silenciosamente** dos KPIs (só conta status "terminado"). → Passar os valores (os callers já têm o `Projeto` inteiro) ou remover o guard.
- **Dívidas ignora `projeto.valorPago`** — usa só a colecção `pagamentos`; um projecto com `valorPago` preenchido mas sem registos em `pagamentos` aparece como 100% em dívida. Fonte única.
- **Filtros fantasma em Projectos** — `?status=`, `?tipo=`, `?cliente=` são aplicados mas nenhum elemento de UI os gera; e o form de pesquisa descarta silenciosamente esses filtros ao pesquisar. → Dar-lhes UI ou remover do parsing.
- **Pesquisa duplicada na vista Lista** — duas caixas de pesquisa (server `?q=` + local da tabela). → Uma só por vista.
- **Calendário 08:00–20:00 hardcoded** — tarefas com hora fora do intervalo (ex.: 07:30, 21:00) ficam **invisíveis** nas vistas semana/dia. → Faixa "fora de horas" ou intervalo dinâmico.
- **"+N" da vista mês não é clicável** — entradas escondidas (>3/dia) sem forma de ver a partir do mês. → Link para `?view=dia&date=…`.
- **Cap de 8 em "Próximos · esta semana"** — trunca prazos sem indicador (o pior caso para um cartão que existe para não deixar escapar prazos).
- **Nav highlight preso (Definições)** — a classe `active` está hardcoded no 1.º item e nunca muda (sem scrollspy). Um highlight que mente é pior que nenhum.
- **Tab única "Catálogo" (Loja)** — barra de tabs com 1 separador sempre activo, sem `onClick`. → Remover ou tornar em filtros reais (Disponíveis/Ocultos/Destaques).
- **Placeholder "Vazio" do Kanban estilizado como botão** — parece um "+ adicionar" clicável mas é texto estático. → Tornar num "+ Novo projeto" real ou re-estilizar como texto neutro.
- **Grelha de 5 KPIs em grid de 4 (ficha do cliente)** — o cartão "Em dívida" cai sozinho numa 2.ª linha.
- **Formatação de euros inconsistente** — histórico de pagamentos na ficha do cliente mostra `1234.5€` cru (sem `toLocaleString('pt-PT')`) enquanto a lista usa formatação correcta.

---

## 8. Notas de arquitectura (para o redesign não partir invariantes)

- **Naming enganador:** `TarefaCard`, `TarefaForm`, `TarefasTable`, `TarefaRowMenu`, `NovaTarefaButton` são componentes de **PROJECTOS** (recebem `Projeto`, gravam em `/api/projetos/*`). Os componentes de tarefas a sério são `TarefaChecklist`, `TarefasPorProjeto`, `NovaTarefaGlobalButton`, `QuickTarefaModal`. Herança de naming antiga.
- **Fonte pública de preços = MongoDB, não JSON.** O painel `/painel/precos` alimenta mesmo `/servicos` e `/servicos/[slug]` (o JSON i18n é só fallback). Preservar o `revalidatePath` no upsert/delete.
- **Portal do cliente é a secção mais robusta:** token hasheado mostrado uma vez, links validados (https), sandbox com rollback de blobs e CSP sandbox no serving. Não mexer além de estética.
- **Auth inconsistente mas não perigoso:** ~10 rotas usam o wrapper `withAuth`, o resto repete o check inline. Migração a meio — oportunidade de limpeza, não bug.
- **Pesquisa não cobre leads/pagamentos/loja/portfólio/comentários** — só projectos/clientes/tarefas. Gap funcional a decidir, não bug.
- **Preferências em localStorage (ordem de tabs, ordem Kanban, collapse da sidebar)** não sincronizam entre dispositivos. Aceitável (utilizador único), mas não prometer o contrário no redesign.
- **Nada de facturação no painel** — decisão do dono, facturação é manual fora do painel. Perfil da empresa (NIF/morada) é write-only por agora; só ganha valor se alimentar documentos/portal.

---

## Anexo — verdictos por item

Detalhe completo (LIGADO / DORMENTE / MORTO + ficheiro:linha de cada item, por cada uma das 16 zonas) no digest bruto da auditoria. Este documento é o resumo accionável; o bruto tem os `file:line` todos.
