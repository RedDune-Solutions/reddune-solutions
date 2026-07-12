
## Visão geral (dashboard) — src/app/(painel)/painel/page.tsx

### LIGADO

- **Topbar: saudação + descrição com contagens** — Descrição usa counts reais de getAllProjetos (em curso, próximos, em dívida). Saudação calculada de Date real. Tudo derivado de Mongo. [src/app/(painel)/painel/page.tsx:171-176; src/lib/mongodb/projetos.ts:7-13]
- **Topbar: pesquisa global (GlobalSearch)** — Form com handler real: router.push para /painel/procurar?q= (página existe). Atalho Cmd/Ctrl+K funcional. [src/components/painel/GlobalSearch.tsx:33-39; src/app/(painel)/painel/procurar/page.tsx]
- **Topbar: sino de notificações (NotificationsBell)** — Fetch real a /api/notifications no mount + polling 60s. A rota existe e deriva o feed de leads novos + audit_log + comentários do portal (Mongo). Badge = leads por tratar. Links para /painel/leads e /painel/auditoria. [src/components/painel/NotificationsBell.tsx:54-63; src/app/api/notifications/route.ts]
- **Botão 'Novo projeto' (NovaTarefaButton → TarefaForm)** — CRUD completo verificado: POST /api/projetos/upsert (existe), templates via GET /api/tarefa-templates (existe), tipos custom via /api/projeto-tipos-custom + /upsert + DELETE /[id] (existem), tarefas de template via /api/tarefas/from-template (existe), cliente rápido via /api/clientes/upsert (existe). [src/components/painel/TarefaForm.tsx:179,109,126,188; src/app/api/projetos/upsert/route.ts; src/app/api/tarefas/from-template/route.ts]
- **Widget 'Hoje' (prazos vencidos/de hoje)** — Filtra projectos activos com prazo overdue/hoje usando datas no fuso de Lisboa (lib/dates). Cada item é Link real para /painel/projetos/[id] (página existe). Empty state honesto ('Nada urgente hoje'). [src/app/(painel)/painel/page.tsx:115-129,196-216; src/lib/dates.ts:25-54]
- **KPIs primários: Em curso / Próximos / Em espera / Prontos** — Contagens reais de getAllProjetos agrupadas por STATUS_GROUPS. Sem valores hardcoded. [src/app/(painel)/painel/page.tsx:107-113,221-226; src/components/painel/KpiCard.tsx]
- **KPI Clientes** — clientes.length de getAllClientes (Mongo). [src/app/(painel)/painel/page.tsx:231; src/lib/mongodb/clientes.ts:9]
- **KPI 'Em dívida' (€)** — Calculado de projectos terminados com valorEstimado > soma de pagamentos reais (getAllPagamentos, colecção pagamentos). [src/app/(painel)/painel/page.tsx:86-100,232-239; src/lib/mongodb/pagamentos.ts:25-32]
- **KPI 'Em atraso 30+ dias' + link 'ver dívidas'** — Contagem real (terminados há +30 dias por liquidar). O link no hint aponta para /painel/dividas, que existe. Nota: o link é HTML em string injectado via dangerouslySetInnerHTML (ver observações). [src/app/(painel)/painel/page.tsx:101-105,240-246; src/app/(painel)/painel/dividas/page.tsx]
- **Secção 'Foco da semana' (TarefaCard)** — Até 6 projectos activos/próximos com proximaAccao preenchida — dados reais. Cada card é Link para o detalhe e traz InlineStatusSelect com mutação real: POST /api/projetos/edit (existe) + quick actions (Terminar/Fechar/etc.) que chamam o mesmo endpoint. [src/app/(painel)/painel/page.tsx:131-137,262-270; src/components/painel/InlineStatusSelect.tsx:67-79; src/app/api/projetos/edit/route.ts]
- **Link 'Ver Kanban'** — Aponta para /painel/projetos?view=kanban — a página de projectos lê o searchParam e renderiza KanbanBoard. Funcional. [src/app/(painel)/painel/page.tsx:258; src/app/(painel)/painel/projetos/page.tsx:91,123]
- **Card 'Atividade recente' + 'Ver tudo'** — getRecentAuditEntries(6) lê da colecção audit_log (Mongo), com utilizador, operação e timestamp relativos reais. Botão 'Ver tudo' → /painel/auditoria (existe). Empty state honesto. [src/app/(painel)/painel/page.tsx:274-314; src/lib/mongodb/mutation-audit.ts:73-82; src/app/(painel)/painel/auditoria/page.tsx]
- **Card 'Resumo do mês' (MonthSummary)** — Recebido (pagamentos do mês corrente Lisboa), Concluídos (dataFechado no mês), Novos clientes (criadoEm no mês), Ticket médio (recebido/nº pagamentos) e barra de distribuição por categoria de activos — tudo computado de dados Mongo reais. Empty states honestos. [src/app/(painel)/painel/page.tsx:139-142,316-330,337-417]
- **Empty state global 'Sem dados ainda'** — Condicional real (projetos.length === 0), não placeholder permanente. [src/app/(painel)/painel/page.tsx:150-167]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Sparkline + prop `spark` do KpiCard (código morto)** — Nenhum caller em todo o src passa `spark=` ao KpiCard (grep confirma: único uso é a renderização interna no KpiCard). O componente Sparkline tem série FAKE hardcoded como default: data = [3, 6, 5, 8, 7, 11, 9, 14, 12, 16] em src/components/painel/Sparkline.tsx:14, auto-descrito no comentário como 'Decorative'. Nunca renderiza no dashboard nem em lado nenhum. [src/components/painel/Sparkline.tsx:14; src/components/painel/KpiCard.tsx:21,62]
- **'Equipa' hardcoded no título de saudação** — titleHtml = `${greeting(now)}, <em>Equipa</em>.` — nome fixo em string, não vem da sessão NextAuth. Cosmético, não dado real. [src/app/(painel)/painel/page.tsx:173]
- **Cores hex hardcoded no widget 'Hoje'** — #c89b6a (linha 194), #f5e9d3 (linha 211), #6a4f3e (linha 214) inline em vez das CSS vars do design system (--apricot/--cream/etc. usadas no resto do ficheiro). Apenas dívida de estilo, sem impacto funcional. [src/app/(painel)/painel/page.tsx:194,211,214]

### Observações

- Zero elementos DORMENTES nesta página: nada aqui depende de VAPID, Upstash, Turnstile ou Blob — todos os fluxos do dashboard correm só com MongoDB.
- Todas as 7 rotas API invocadas a partir desta página existem e foram confirmadas: /api/projetos/upsert, /api/projetos/edit, /api/tarefa-templates, /api/projeto-tipos-custom (+/upsert, /[id]), /api/tarefas/from-template, /api/clientes/upsert, /api/notifications.
- Todos os destinos de navegação existem: /painel/projetos/[id], /painel/projetos?view=kanban (param tratado), /painel/dividas, /painel/auditoria, /painel/procurar.
- A prop `delta` do KpiCard não é usada no dashboard mas É usada com dados reais em /painel/relatorios (page.tsx:207) — não é código morto global, não remover.
- O sino de notificações inclui comentários do portal do cliente (countComentariosNaoLidos em src/lib/mongodb/portal), coerente com o merge recente do portal /p/[token].

### RECOMENDAÇÕES

- [MANTER] **Widget 'Hoje' + KPIs primários + Foco da semana + Atividade recente + Resumo do mês** — Tudo ligado a Mongo real com links e mutações funcionais — é o núcleo útil do dashboard. No redesign, preservar os empty states honestos que já existem.
- [REMOVER] **Sparkline.tsx + prop `spark` do KpiCard** — Código morto com série fake default. Remover, ou — se o redesign quiser tendências — ligar a séries reais (ex.: pagamentos por semana) antes de reexpor. Nunca renderizar com o default hardcoded.
- [ALTERAR] **Hint com HTML em string ('ver dívidas') + titleHtml do Topbar** — dangerouslySetInnerHTML em KpiCard.tsx:59 e Topbar.tsx:51 para conteúdo que é hardcoded hoje, mas frágil no redesign. Trocar as props hint/titleHtml por ReactNode e usar <Link> normal.
- [ALTERAR] **Saudação 'Bom dia/Boa tarde/Boa noite'** — greeting(now) usa now.getHours() = hora UTC na Vercel; com Lisboa em UTC+1 (verão) a saudação erra 1h nas fronteiras (ex.: 12:30 em Lisboa mostra 'Bom dia'). O resto da página já usa todayLisbonDate — aplicar o mesmo fuso à saudação. Aproveitar para substituir 'Equipa' hardcoded pelo nome da sessão.
- [ALTERAR] **Linhas da 'Atividade recente'** — key={i} por índice (page.tsx:289) — usar entityId+at. E o par COLL_LABEL/OP_LABEL (page.tsx:28-38) duplica mapas equivalentes em /api/notifications/route.ts:32-47; extrair para módulo partilhado no redesign.
- [ALTERAR] **Cores hex hardcoded no widget 'Hoje'** — Substituir #c89b6a/#f5e9d3/#6a4f3e por CSS vars do tema para o redesign no Claude Design não herdar cores órfãs.
- [MANTER] **KPI 'Em atraso 30+ dias'** — Cálculo real e link para /painel/dividas funcional. Dado que a facturação é manual fora do painel, este KPI de cobrança é dos mais accionáveis da página.


## Tarefas — /painel/tarefas (página, componentes de tarefas, rotas /api/tarefas/*, loader src/lib/mongodb/tarefas.ts)

### LIGADO

- **Página /painel/tarefas (lista agrupada por projecto)** — Server component com force-dynamic. Lê getAllTarefas() + getAllProjetos() do Mongo (page.tsx:28-32). Filtra tarefas para só mostrar as de projectos em TAREFAS_VISIVEIS_STATUSES (em-curso, proximo, aguardando-cliente, aguardando-encomenda, terminado). Título 'N abertas' calculado dos dados reais (linha 64). [src/app/(painel)/painel/tarefas/page.tsx]
- **Tabs de filtro (Todas / Hoje / Esta semana / Vencidas) + contadores** — Links com searchParams (?filter=, ?feitas=1). Contadores computados server-side dos prazos reais das tarefas (linhas 69-88), coerentes com o conjunto visível. Toggle 'Mostrar feitas' funcional via URL. Nada hardcoded. [src/app/(painel)/painel/tarefas/page.tsx:100-113]
- **TarefasPorProjeto (checklist agrupada, toggle feita, apagar)** — Toggle feita → POST /api/tarefas/edit (existe: src/app/api/tarefas/edit/route.ts, auth + Zod + logMutation + revalidatePath). Apagar → DELETE /api/tarefas/[id] (existe: src/app/api/tarefas/[id]/route.ts) com confirm dialog. UI optimista com revert em erro + toast. Link do título do grupo para /painel/projetos/[id] (rota existe). [src/components/painel/TarefasPorProjeto.tsx]
- **NovaTarefaGlobalButton (botão 'Nova tarefa' na topbar)** — Sheet com form (projecto, título, prazo, hora, notas) → POST /api/tarefas/upsert (existe: src/app/api/tarefas/upsert/route.ts, valida com tarefaInputSchema de src/lib/validation-projeto.ts:68, gera UUID, logMutation, revalida 4 paths). Selector só mostra projectos em TAREFAS_VISIVEIS_STATUSES — coerente com o filtro da página. [src/components/painel/NovaTarefaGlobalButton.tsx]
- **TarefaChecklist (checklist na página de detalhe do projecto)** — Usada em src/app/(painel)/painel/projetos/[id]/page.tsx:134 com getTarefasByProjeto. Toggle feita e edição inline de prazo → POST /api/tarefas/edit; adicionar → POST /api/tarefas/upsert; apagar → DELETE /api/tarefas/[id]. Todas as rotas existem. Mostra prazoHora quando definida. UI optimista com revert. [src/components/painel/TarefaChecklist.tsx]
- **QuickTarefaModal (criar tarefa a partir do calendário)** — Usado por WeekCalendar.tsx:186 e DayCalendar.tsx:137 (zona calendário) com data/hora pré-preenchidas. Submete para POST /api/tarefas/upsert — rota existe e funciona. [src/components/painel/QuickTarefaModal.tsx]
- **Rota POST /api/tarefas/from-template (aplicar template de tarefas)** — Chamada por TarefaForm.tsx:188 quando se cria/edita um projecto com 'Aplicar template'. Lê getTarefaTemplateById (src/lib/mongodb/tarefa-templates.ts:16), cria N tarefas via upsertTarefa, logMutation, revalida paths. Fluxo completo e alcançável pela UI. [src/app/api/tarefas/from-template/route.ts]
- **Loader src/lib/mongodb/tarefas.ts (colecção 'tarefas')** — Todas as 7 funções são usadas: getAllTarefas (layout do painel, /painel/tarefas, /painel/calendario, /painel/procurar), getTarefasByProjeto (detalhe do projecto + rotas), getTarefaProjetoId (revalidação nas rotas edit/delete), upsertTarefa, patchTarefa, deleteTarefa, deleteTarefasByProjeto (cascade no DELETE /api/projetos/[id]:45). Driver Mongo nativo, sem env em falta. [src/lib/mongodb/tarefas.ts]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **EditTarefaActions.tsx — componente órfão, nunca importado** — grep em todo o src/ só encontra a própria definição (linha 29) — zero imports, zero usos. Agravante: apesar do nome, não edita tarefas — edita PROJECTOS (status e proximaAccao via POST /api/projetos/edit). É código morto de uma iteração antiga da UI. [src/components/painel/EditTarefaActions.tsx]
- **GET /api/tarefas — rota sem nenhum consumidor** — Rota funcional (auth + getAllTarefas/getTarefasByProjeto) mas nenhum componente, hook ou fetch no código a chama — todas as páginas lêem tarefas directamente via loader server-side. Superfície de API autenticada sem uso. [src/app/api/tarefas/route.ts]
- **Campo 'notas' da tarefa — write-only na UI** — O textarea 'Notas (opcional)' grava no Mongo e o schema de /api/tarefas/edit aceita editá-lo, mas NENHUM ecrã renderiza tarefa.notas — nem TarefasPorProjeto, nem TarefaChecklist, nem o calendário. Único uso é matching de texto na pesquisa (src/app/(painel)/painel/procurar/page.tsx:44). O utilizador escreve notas que nunca mais consegue ler. [src/components/painel/NovaTarefaGlobalButton.tsx:169-181; src/types/tarefa.ts:8]
- **Cor hardcoded #faf4e3 no check icon** — style={{ color: "#faf4e3" }} inline no ícone Check da checkbox, em vez de token/var CSS do tema (parece ser o 'cream' do design system). [src/components/painel/TarefasPorProjeto.tsx:242]
- **Entradas inalcançáveis em STATUS_PRIORITY** — As prioridades para 'fechado', 'cancelado', 'ideia-interna' e 'ideia-cliente' nunca são usadas: a page.tsx:36-38 filtra as tarefas por TAREFAS_VISIVEIS_STATUSES antes de as passar, portanto esses grupos nunca chegam ao componente. Código defensivo morto (inócuo). [src/components/painel/TarefasPorProjeto.tsx:25-35]
- **prazoHora invisível em /painel/tarefas** — A página só mostra a data (formatPrazo); a hora (prazoHora) que o utilizador define no NovaTarefaGlobalButton/QuickTarefaModal só aparece no TarefaChecklist do projecto e no calendário. Não é morto (o dado é usado noutros ecrãs) mas na página de tarefas é informação capturada e não mostrada. [src/components/painel/TarefasPorProjeto.tsx:245-257]

### Observações

- Todas as rotas de mutação (/api/tarefas/upsert, /edit, /[id] DELETE, /from-template) exigem sessão NextAuth, validam payload (Zod ou checks manuais) e registam logMutation na colecção de auditoria — padrão consistente.
- As três superfícies de criação de tarefa (global, checklist do projecto, calendário) enviam payloads ligeiramente diferentes para a mesma rota upsert (ordem: 0 vs items.length; notas: capturadas só na global) — candidato a unificação no redesign.
- A rota /api/tarefas/edit tem um guard correcto: limpar o prazo limpa também a prazoHora para não ressuscitar horas órfãs (edit/route.ts:46-48).
- O filtro da página e o selector do NovaTarefaGlobalButton partilham TAREFAS_VISIVEIS_STATUSES (src/types/projeto.ts:31) — garante que nenhuma tarefa criada fica invisível. Preservar esta invariante no redesign.
- Nota de nomenclatura para o redesign: TarefaCard, TarefaForm, TarefasTable, TarefaRowMenu e NovaTarefaButton são componentes de PROJECTOS (recebem Projeto, gravam em /api/projetos/*), não de tarefas — herança de naming antiga que confunde; os componentes de tarefas a sério são TarefaChecklist, TarefasPorProjeto, NovaTarefaGlobalButton e QuickTarefaModal.
- Zona sem dependências de env vars: não usa Vercel Blob, VAPID push, Upstash nem Turnstile — nada dormente.

### RECOMENDAÇÕES

- [MANTER] **Página /painel/tarefas + tabs de filtro + TarefasPorProjeto** — Núcleo funcional sólido: dados reais, filtros coerentes com os contadores, UI optimista com revert, todas as mutações auditadas. Boa base para o redesign sem mexer na lógica.
- [MANTER] **NovaTarefaGlobalButton, TarefaChecklist, QuickTarefaModal** — Três pontos de criação de tarefas, todos ligados à mesma rota /api/tarefas/upsert com validação partilhada. No redesign podem convergir num único form component, mas funcionalmente estão correctos.
- [REMOVER] **EditTarefaActions.tsx** — Componente órfão nunca importado, com nome enganador (edita projectos, não tarefas). Só confunde quem for fazer o redesign.
- [REMOVER] **GET /api/tarefas (src/app/api/tarefas/route.ts)** — Zero consumidores — todo o acesso a tarefas é server-side via loader. Remover reduz superfície de API exposta; se um dia for preciso um endpoint de leitura (ex.: app móvel), recria-se.
- [ALTERAR] **Campo notas da tarefa** — Ou passa a ser mostrado na UI (ex.: expandir a linha da tarefa em TarefasPorProjeto/TarefaChecklist para revelar notas), ou remove-se o textarea do NovaTarefaGlobalButton. No estado actual é um campo que aceita input e nunca o devolve — no redesign decidir uma das duas.
- [ALTERAR] **Cor #faf4e3 hardcoded (TarefasPorProjeto.tsx:242)** — Substituir por token do tema (var CSS / classe Tailwind do cream) para o redesign não deixar cores soltas fora do design system.
- [ALTERAR] **prazoHora em /painel/tarefas** — Mostrar a hora ao lado da data quando existir (como já faz o TarefaChecklist) — o dado já vem do Mongo, é só render.
- [ALTERAR] **STATUS_PRIORITY entradas inalcançáveis** — Limpeza opcional no redesign: derivar as prioridades de TAREFAS_VISIVEIS_STATUSES para haver uma única fonte de verdade, em vez de duplicar a lista de estados em dois sítios.


## Projectos (lista) — /painel/projetos: página, KanbanBoard, TarefasTable, TarefaCard, InlineStatusSelect, TarefaRowMenu, NovaTarefaButton/TarefaForm

### LIGADO

- **Carregamento da lista de projectos e clientes** — getAllProjetos() e getAllClientes() lêem do Mongo (colecções projetos/clientes) com force-dynamic. Todos os cartões/linhas mostram dados reais. [src/app/(painel)/painel/projetos/page.tsx:37-41; src/lib/mongodb/projetos.ts:7-13; src/lib/mongodb/clientes.ts:9]
- **Título 'Projectos · N activos'** — Contagem real: allProjetos.filter(isProjetoAtivo) — fonte única partilhada com o badge da sidebar (em-curso + proximo). Não é hardcoded. [src/app/(painel)/painel/projetos/page.tsx:77,83; src/types/projeto.ts:42-45]
- **Tabs Kanban/Lista + contador da Lista** — Navegação por URL (?view=lista); o número na tab Lista é projetos.length após filtros — real. [src/app/(painel)/painel/projetos/page.tsx:90-97]
- **Chips de filtro por categoria (serviço)** — Links que alternam ?categoria=; filtragem real em applyFilters sobre os dados do Mongo. Chip 'Todas' limpa o filtro. [src/app/(painel)/painel/projetos/page.tsx:100-113; src/lib/filter-projetos.ts:3-31]
- **Pesquisa server-side (?q=) na barra de filtros** — Form GET para /painel/projetos; applyFilters procura em titulo/clienteNome/proximaAccao/notasResumo/tipo. Funcional. [src/app/(painel)/painel/projetos/page.tsx:114-119; src/lib/filter-projetos.ts:17-28]
- **Kanban board (colunas por estado + secções Ideias cliente/internas + Arquivo)** — Agrupa projectos reais por status. Ordem das colunas vem do localStorage (configurável em /painel/definicoes via KanbanOrderSettings); colapso de colunas persistido em localStorage. Secções 'Ideias de clientes', 'Ideias internas' e 'Arquivo' (fechado/cancelado) só aparecem se houver itens. [src/components/painel/KanbanBoard.tsx; src/components/painel/KanbanOrderSettings.tsx:18-36; src/app/(painel)/painel/definicoes/page.tsx:87]
- **TarefaCard (cartão de projecto)** — Todos os campos são reais: titulo, clienteNome, categoria/tipo (labels), proximaAccao, prazo (com lógica de overdue calculada), valorEstimado formatado. Link para /painel/projetos/[id] — rota existe. [src/components/painel/TarefaCard.tsx; src/app/(painel)/painel/projetos/[id]/page.tsx]
- **Mudança de estado inline (select badge + quick actions Confirmar/Terminar/Aceito/Fechar)** — POST /api/projetos/edit — rota existe, com auth, validação zod (status|proximaAccao), patchProjeto no Mongo, auto-set de dataFechado, logMutation e revalidatePath. Rollback optimista + toast em erro. [src/components/painel/InlineStatusSelect.tsx:62-79; src/app/api/projetos/edit/route.ts]
- **Vista Lista (TarefasTable)** — TanStack Table sobre dados reais: ordenação por coluna, filtro local, links para detalhe e para /painel/clientes/[id], InlineStatusSelect por linha, chips de tipos (multi-tipo com overflow +N). Rodapé 'X de Y projectos' é contagem real. [src/components/painel/TarefasTable.tsx]
- **Apagar projecto (menu ⋯ da linha)** — Confirm dialog + DELETE /api/projetos/[id] — rota existe: apaga tarefas associadas, limpa blobs de arquivos e sandboxes do portal, apaga comentários do portal, preserva pagamentos como histórico, logMutation. Funciona porque BLOB_READ_WRITE_TOKEN existe em prod (cleanup de blobs é best-effort de qualquer forma). [src/components/painel/TarefaRowMenu.tsx:30-51; src/app/api/projetos/[id]/route.ts]
- **Novo projeto (botão + sheet TarefaForm)** — POST /api/projetos/upsert — rota existe: auth, zod (projetoInputSchema), merge com existing, derivação tipo/categoria, auto dataFechado, logMutation, revalidatePath. Toast de sucesso + router.refresh. [src/components/painel/NovaTarefaButton.tsx; src/components/painel/TarefaForm.tsx:156-201; src/app/api/projetos/upsert/route.ts]
- **Templates de tarefas no form de criação** — GET /api/tarefa-templates carrega templates reais; ao guardar com template seleccionado chama POST /api/tarefas/from-template — ambas as rotas existem. [src/components/painel/TarefaForm.tsx:78-89,187-196; src/app/api/tarefa-templates/route.ts; src/app/api/tarefas/from-template/route.ts]
- **Tipos personalizados (chips + botão + / eliminar ×)** — CRUD completo e funcional: GET /api/projeto-tipos-custom, POST /api/projeto-tipos-custom/upsert, DELETE /api/projeto-tipos-custom/[id] — todas existem. [src/components/painel/TarefaForm.tsx:104-133; src/app/api/projeto-tipos-custom/*]
- **Criar cliente rápido dentro do form ('Criar novo')** — ClienteQuickForm → POST /api/clientes/upsert — rota existe; cliente criado fica logo seleccionado no projecto. [src/components/painel/ClienteQuickForm.tsx:30-53; src/app/api/clientes/upsert/route.ts]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Filtros por URL status/tipo/cliente sem UI** — A página valida e aplica ?status=, ?tipo= e ?cliente= (applyFilters suporta-os), mas NENHUM elemento da UI nem link interno do painel gera esses parâmetros (o único link externo é /painel/projetos?view=kanban no dashboard). São filtros fantasma acessíveis só escrevendo o URL à mão. Pior: o form de pesquisa só preserva view+categoria em hidden inputs, por isso pesquisar descarta silenciosamente status/tipo/cliente activos. [src/app/(painel)/painel/projetos/page.tsx:45-56,62,115-116]
- **Placeholder 'Vazio' das colunas do kanban estilizado como botão de adicionar** — div class="add" com borda tracejada e hover ember (.kanban-col .add:hover muda cor) que parece uma affordance clicável de 'adicionar', mas é texto estático sem handler. [src/components/painel/KanbanBoard.tsx:109; src/app/(painel)/painel.css:595-606]
- **Guard de liquidação do quick-action 'Fechar' nunca activo (props mortas)** — InlineStatusSelect aceita pagoTotal/valorEstimado para só mostrar 'Fechar' quando o projecto está liquidado, mas NENHUM caller no repo passa essas props (TarefaCard.tsx:64 e TarefasTable.tsx:69 só passam projetoId+status). Com valorEstimado undefined, 'liquidado' avalia true — o botão 'Fechar' aparece em qualquer projecto 'terminado', pago ou não. O guard é código morto na prática. [src/components/painel/InlineStatusSelect.tsx:28-29,91-98]
- **Cores de estado hardcoded no kanban** — STATUS_DOT com hex hardcoded (#5b4a3a, #2f4d6e, #8a5a13, #3f6a4d, #466a4f, #6e3a2a) em vez de tokens CSS — só 'em-curso' usa var(--ember). Constantes de design, não dados falsos, mas duplicam a paleta fora do painel.css. [src/components/painel/KanbanBoard.tsx:12-22]
- **Pesquisa duplicada na vista Lista** — Em ?view=lista renderizam-se DUAS caixas de pesquisa: a search-mini server-side da página (?q=) e o input client-side próprio da TarefasTable (filtra localmente o que já veio filtrado). Ambas funcionam — é redundância de UI, não código morto. [src/app/(painel)/painel/projetos/page.tsx:114-119; src/components/painel/TarefasTable.tsx:148-157]

### Observações

- Zona sem NADA dormente: nenhum elemento desta página depende de VAPID, Upstash, Turnstile ou de outra env var — o único toque em Vercel Blob é o cleanup no DELETE, que está protegido por try/catch best-effort e o token existe em prod.
- Kanban não tem drag-and-drop — a mudança de coluna faz-se pelo select inline em cada cartão. É decisão de design, não bug; relevante para expectativas no redesign.
- Todas as 8 rotas API invocadas a partir desta zona existem e têm auth (session NextAuth) + validação: projetos/upsert, projetos/edit, projetos/[id] DELETE, tarefa-templates GET, tarefas/from-template, projeto-tipos-custom GET/upsert/[id] DELETE, clientes/upsert.
- getAllProjetos() puxa os documentos inteiros (incluindo bodyMd até 50KB, linhas, arquivos) para a listagem — existe getProjetosResumo() com projecção leve (src/lib/mongodb/projetos.ts:40-59) mas a página de lista não a usa; oportunidade de performance se a colecção crescer.
- O título usa titleHtml com dangerouslySetInnerHTML no Topbar, mas o conteúdo é gerado server-side com número calculado — sem input do utilizador, risco nulo aqui.
- A pesquisa server-side (?q=) inclui notasResumo no haystack; a pesquisa local da TarefasTable não — resultados podem divergir entre as duas caixas para o mesmo termo.

### RECOMENDAÇÕES

- [MANTER] **Kanban + Lista (núcleo da página)** — Tudo ligado a dados reais com CRUD completo e auditado (logMutation). É a zona mais sólida do painel — no redesign preservar os fluxos (status inline, delete com cleanup de blobs, criação com templates).
- [ALTERAR] **Filtros fantasma status/tipo/cliente** — Ou dar-lhes UI (dropdown de estado/cliente na filterbar — o código server já existe e funciona) ou remover do parsing. E corrigir o form de pesquisa para preservar todos os filtros activos, não só view+categoria.
- [ALTERAR] **Placeholder 'Vazio' com estilo .add** — Ou tornar num verdadeiro '+ Novo projeto' que abre o TarefaForm pré-preenchido com o status da coluna (ganho de UX barato), ou re-estilizar como texto neutro sem hover/borda de botão para não enganar.
- [ALTERAR] **Guard 'liquidado' do quick-action Fechar** — Decidir: ou passar valorEstimado/pagoTotal dos callers (TarefaCard/TarefasTable já têm o Projeto inteiro — é trivial) para o guard funcionar, ou remover as props pagoTotal/valorEstimado e o bloco liquidado do componente. No estado actual é código morto que dá falsa sensação de protecção.
- [ALTERAR] **Pesquisa duplicada na vista Lista** — No redesign, esconder a search-mini da página quando view=lista, ou remover o input local da TarefasTable e usar só o ?q= server-side — uma única caixa de pesquisa por vista.
- [ALTERAR] **STATUS_DOT hardcoded** — Mover as cores para tokens CSS (painel.css) para o redesign no Claude Design ter uma única fonte de paleta de estados — hoje o dot do kanban e o .badge do InlineStatusSelect definem cores em sítios diferentes.
- [MANTER] **Ordem de colunas do kanban em localStorage** — Funciona e é utilizador único, mas notar no redesign que a preferência não sincroniza entre dispositivos (PWA vs desktop) — aceitável, só não prometer o contrário.


## Projecto (detalhe) — /painel/projetos/[id] (src/app/(painel)/painel/projetos/[id]/page.tsx)

### LIGADO

- **Ficha do projecto (editor inline TarefaForm)** — POST /api/projetos/upsert existe (auth + zod projetoInputSchema + upsertProjeto Mongo, merge parcial que preserva campos). Carrega templates via GET /api/tarefa-templates e tipos custom via GET /api/projeto-tipos-custom; criar/apagar tipo custom via POST /api/projeto-tipos-custom/upsert e DELETE /api/projeto-tipos-custom/[id]; aplicar template via POST /api/tarefas/from-template; 'Criar novo' cliente via POST /api/clientes/upsert. Todas as rotas existem e escrevem no Mongo. [src/components/painel/TarefaForm.tsx; src/app/api/projetos/upsert/route.ts; src/components/painel/ClienteQuickForm.tsx]
- **StatusStrip (Orçado / Recebido / Em dívida / dias no sistema)** — Orçado = projeto.valorEstimado (getProjetoById), Recebido = soma real de getPagamentosByProjeto (colecção pagamentos), dívida derivada, dias derivados de dataCriado. Tudo dados reais do Mongo, sem hardcode de valores. [src/app/(painel)/painel/projetos/[id]/page.tsx:94,266-305; src/lib/mongodb/pagamentos.ts]
- **Checklist de tarefas (toggle, prazo inline, adicionar, apagar)** — Toggle/prazo → POST /api/tarefas/edit (zod + patchTarefa); adicionar → POST /api/tarefas/upsert; apagar → DELETE /api/tarefas/[id]. Todas existem com auth. UI optimista com revert em erro. Contador X/Y calculado das tarefas reais (getTarefasByProjeto). [src/components/painel/TarefaChecklist.tsx; src/app/api/tarefas/edit/route.ts; src/lib/mongodb/tarefas.ts]
- **Pagamentos (registar, quick-pay Entrada 50% / Liquidar restante, apagar, Marcar como fechado)** — Registar/quick-pay → POST /api/pagamentos/upsert (zod + upsertPagamento, revalida dividas/relatorios/painel); apagar → DELETE /api/pagamentos/[id]; 'Marcar como fechado' → POST /api/projetos/upsert com status fechado. Botões quick-pay derivam valores de dados reais (50% do estimado; restante = dívida). Tudo funcional. [src/components/painel/PagamentosSection.tsx; src/app/api/pagamentos/upsert/route.ts]
- **Ficheiros / Orçamentos (upload drag-drop, download, remover)** — Upload → POST /api/projetos/arquivo (Vercel Blob put com addRandomSuffix + pushArquivo atómico no Mongo; BLOB_READ_WRITE_TOKEN existe em prod, logo LIGADO; rota devolve erro claro se faltar). Download via proxy GET /api/projetos/arquivo/[id] (auth admin, stream do blob). Remover → DELETE na mesma rota (pull atómico + deleteManagedBlob). Compressão de imagens client-side para webp antes do upload. Limite 10MB, whitelist de MIME. [src/components/painel/ArquivosUploadZone.tsx; src/app/api/projetos/arquivo/route.ts; src/app/api/projetos/arquivo/[id]/route.ts]
- **Portal do cliente: gerar/regenerar/revogar link secreto** — POST /api/projetos/portal action gerar|revogar existe (auth; guarda só o hash do token — setProjetoPortal/revokeProjetoPortal; token em claro mostrado uma vez na UI com aviso e botão Copiar). Confirmação antes de regenerar/revogar. Badge 'N novos' calculado dos comentários não lidos reais. [src/components/painel/PortalSection.tsx:38-84; src/app/api/projetos/portal/route.ts; src/lib/mongodb/portal.ts]
- **Portal: links de preview (Vercel/Pages) adicionar/remover** — POST /api/projetos/links action add|remove existe (auth + linkSchema exige https + pushLink/pullLink atómicos no Mongo). Lista renderiza projeto.links reais. [src/components/painel/PortalSection.tsx:86-112,218-258; src/app/api/projetos/links/route.ts]
- **Portal: comentários do cliente + Marcar lido** — Lista vem de getComentariosByProjeto (colecção portal do Mongo). 'Marcar lido' → POST /api/projetos/comentarios (marcarComentarioLido) existe. Secção só aparece se houver comentários. [src/components/painel/PortalSection.tsx:155-162,313-345; src/app/api/projetos/comentarios/route.ts]
- **Portal: sandbox multi-ficheiro (upload ZIP, abrir, remover)** — Upload → POST /api/projetos/sandbox (auth + rate limit 10/10min + extractSandbox anti path-traversal + blobs em lotes + insertSandbox; rollback de blobs em falha; exige BLOB_READ_WRITE_TOKEN que existe em prod). Remover → DELETE /api/projetos/sandbox/[id] (apaga blobs + doc). 'Abrir' aponta para GET /api/portal/sandbox/[id]/[...path] que existe e serve com CSP sandbox — MAS só responde se o portal do projecto estiver activo (404 se nunca gerado ou revogado). [src/components/painel/PortalSection.tsx:114-153,260-311; src/app/api/projetos/sandbox/route.ts; src/app/api/portal/sandbox/[id]/[...path]/route.ts]
- **Hardware (só categoria assistencia-tecnica)** — Secção colapsável; guarda marca/modelo/serial/acessórios via POST /api/projetos/upsert campo hardware (merge preserva o resto). Renderização condicional a projeto.categoria === 'assistencia-tecnica' — correcto, não é rota morta. [src/components/painel/HardwareSection.tsx; src/app/(painel)/painel/projetos/[id]/page.tsx:147-149]
- **Custos (linhas editáveis + modo legacy)** — LinhasEditor edita linhas (peça/mão-obra/outro); guardar → POST /api/projetos/upsert com linhas + valorEstimado = computeTotal(linhas). Modo legacy (valor único) com botão 'Converter em linhas' também funcional. Botão Guardar só aparece quando dirty. [src/components/painel/CustosCard.tsx; src/components/painel/LinhasEditor.tsx]
- **Apagar projecto (menu ⋮ TarefaRowMenu)** — DELETE /api/projetos/[id] existe; confirmação destrutiva; redirect para /painel/projetos após apagar. Único item do menu. [src/components/painel/TarefaRowMenu.tsx; src/app/api/projetos/[id]/route.ts]
- **Aside Informações + badges (dívida / garantia)** — Cliente (com link real para /painel/clientes/[id]), Prazo, Criado, Fechado, Valor estimado — todos do documento Mongo via getProjetoById. Badges 'Em dívida' e 'Garantia até/expirada' derivadas de valores reais (pagamentos + garantiaAte). [src/app/(painel)/painel/projetos/[id]/page.tsx:156-242]

### DORMENTE

- **Botão 'Abrir' de projeto hospedado (sandbox) sem portal activo** (precisa: Portal do projecto ACTIVO (token gerado e não revogado) — integração interna, não env var) — A rota GET /api/portal/sandbox/[id]/[...path] devolve 404 se !projeto.portal || projeto.portal.revogadoEm (route.ts:26-28). No painel é possível carregar um ZIP e ter o item listado com botão 'Abrir' que dá 404 silencioso enquanto o portal não for gerado. A UI (PortalSection.tsx:273-281) não avisa desta dependência. [src/app/api/portal/sandbox/[id]/[...path]/route.ts:24-28; src/components/painel/PortalSection.tsx:273-281]

### DECORATIVO/MORTO

- **InfoRow 'Valor pago' (projeto.valorPago)** — Campo legacy: nenhum form/rota do painel o escreve (grep: só o upsert o preserva via pick). Os pagamentos reais vivem na colecção pagamentos. Se houver valor antigo na BD, o aside mostra um número desactualizado que conflitua com o 'Recebido' do StatusStrip calculado da colecção. page.tsx:192-198. [src/app/(painel)/painel/projetos/[id]/page.tsx:192-198]
- **InfoRow 'Pagamento' (projeto.metodoPagamento)** — Campo legacy sem editor em nenhum componente do painel (grep em src/components/painel: 0 matches). O método é agora registado por pagamento (Pagamento.metodo). Só renderiza dados antigos. [src/app/(painel)/painel/projetos/[id]/page.tsx:199-201]
- **InfoRow 'Local' (projeto.local)** — Sem editor no painel (grep: 0 matches em components/painel); só aparece se houver dados antigos na BD — campo de leitura órfão. [src/app/(painel)/painel/projetos/[id]/page.tsx:202-204]
- **Cores hardcoded fora de tokens** — Divisórias do StatusStrip com background 'rgba(90, 14, 14, 0.12)' inline (page.tsx:291 e 296) em vez de var CSS; badge de comentários não lidos com bg-[#d6422a] (PortalSection.tsx:171) e border-[#d6422a]/40 (PortalSection.tsx:325) — cor da marca hardcoded em vez de token do tema. [src/app/(painel)/painel/projetos/[id]/page.tsx:291,296; src/components/painel/PortalSection.tsx:171,325]
- **Percentagem de entrada 50% hardcoded** — Quick-pay 'Entrada (50%)' assume sempre 0.5 do valorEstimado (PagamentosSection.tsx:92: Math.round(valorEstimado * 0.5 * 100) / 100). Funcional (não é morto), mas a percentagem é uma assunção fixa no código. [src/components/painel/PagamentosSection.tsx:90-93]

### Observações

- Uploads (ficheiros e sandbox ZIP) verificam BLOB_READ_WRITE_TOKEN e devolvem erro claro se faltar — como o token existe em prod, ambos estão LIGADOS; em dev local sem o token falham com mensagem explícita.
- Todas as rotas de mutação da página têm auth() NextAuth + logMutation (auditoria) + revalidatePath — nenhum botão da zona aponta para rota inexistente.
- O download de arquivos no painel usa o proxy autenticado /api/projetos/arquivo/[id] (nunca expõe blobUrl ao cliente — sanitizeArquivo remove-o); o portal do cliente usa rota separada /api/portal/arquivo/[id].
- O upsert de projecto preserva links e portal explicitamente (nunca vêm no payload), por isso guardar a ficha não destrói o portal — bom para o redesign manter esta separação.
- TarefaForm serve simultaneamente de criador (modal noutra página) e editor inline aqui — no redesign considerar variante compacta para o detalhe, já que o form completo (templates, tipos custom, quick-client) ocupa muito espaço vertical.
- PagamentosSection e StatusStrip calculam ambos totalPago por reduce dos mesmos pagamentos — consistente entre si; a única fonte divergente é o campo legacy valorPago do aside.

### RECOMENDAÇÕES

- [REMOVER] **InfoRow 'Valor pago' (valorPago legacy)** — Nada o escreve; duplica e pode contradizer o 'Recebido' real do StatusStrip calculado da colecção pagamentos. Fonte única de verdade deve ser pagamentos.
- [ALTERAR] **InfoRows 'Pagamento' (metodoPagamento) e 'Local'** — Campos legacy sem editor — no redesign, ou ganham campo no form (Local pode ser útil em assistência técnica) ou saem do aside; mostrar dados que ninguém consegue editar confunde.
- [ALTERAR] **Botão 'Abrir' sandbox quando portal inactivo** — Dá 404 silencioso sem portal activo. No redesign: desactivar o botão com tooltip 'Gera o link do portal primeiro' ou mostrar aviso na secção de sandboxes quando portalAtivo === false.
- [ALTERAR] **Lógica de 'Em dívida' (StatusStrip vs badge)** — StatusStrip mostra dívida para qualquer status (mesmo projecto em curso), ProjetoBadges só quando status === 'terminado' (page.tsx:215 vs 268). Alinhar a semântica num sítio só no redesign.
- [ALTERAR] **Cores hardcoded (#d6422a, rgba(90,14,14))** — Mover para tokens/vars CSS do tema do painel para o redesign no Claude Design não herdar valores mágicos espalhados.
- [MANTER] **Checklist de tarefas, Pagamentos (incl. quick-pay), Ficheiros/uploads, Custos, Hardware, Apagar projecto** — Totalmente funcionais fim-a-fim (UI → rota API com auth+validação → Mongo), com UI optimista e confirmações destrutivas. Só precisam de restyle, não de rewiring.
- [MANTER] **Secção Portal do cliente (token, links preview, comentários, sandbox)** — Merged recentemente e completamente ligada: token hasheado mostrado uma vez, links validados (https), comentários com marcar-lido, sandbox com rollback de blobs e CSP sandbox no serving. Melhor secção da página em termos de robustez.
- [MANTER] **Quick-pay 'Entrada (50%)'** — Útil e funcional; se a % de entrada variar por projecto no futuro, tornar configurável, mas não é prioridade.


## Clientes — src/app/(painel)/painel/clientes/page.tsx, [id]/page.tsx, ClienteForm, NovoClienteButton, ClienteQuickForm, src/lib/mongodb/clientes.ts

### LIGADO

- **Lista de clientes (tabela)** — Renderiza dados reais: getAllClientes + getAllProjetos + getAllPagamentos (Mongo, force-dynamic). Cada linha liga a /painel/clientes/[id]. Colunas Contacto/Local/Projectos/Última/Dívida todas calculadas de dados reais — zero hardcoded. [src/app/(painel)/painel/clientes/page.tsx:31-153]
- **KPIs da lista (Total, Com projecto activo, Com dívida, Recorrentes)** — Todos derivados em memória dos loaders Mongo: comProjecto por STATUS_GROUPS, dívida = valorEstimado - soma(pagamentos) em projectos 'terminado', recorrentes = >=3 projectos. Sem valores fixos. [src/app/(painel)/painel/clientes/page.tsx:82-87]
- **Botão 'Novo cliente' (Sheet + ClienteForm)** — POST /api/clientes/upsert — rota existe (src/app/api/clientes/upsert/route.ts), withAuth + zod (clienteInputSchema) + logMutation + revalidatePath. CRUD funcional confirmado ponta a ponta. [src/components/painel/NovoClienteButton.tsx + src/components/painel/ClienteForm.tsx:38]
- **Ficha do cliente editável inline** — Mesmo ClienteForm em modo edição na página de detalhe → POST /api/clientes/upsert com id existente (upsert Mongo em lib/mongodb/clientes.ts:73). Toast de sucesso/erro + router.refresh. Funcional. [src/app/(painel)/painel/clientes/[id]/page.tsx:76-81 + ClienteForm.tsx]
- **KPIs da ficha (Projectos, Em curso/espera, Concluídos, Valor estimado, Em dívida)** — Calculados de getProjetosByCliente + getPagamentosByCliente (Mongo). Dívida = valorEstimado - pago em projectos 'terminado'. Dados reais. [src/app/(painel)/painel/clientes/[id]/page.tsx:36-102]
- **Secção 'Activos' + 'Histórico completo' (timeline de TarefaCard)** — Projectos reais do cliente; cada cartão liga a /painel/projetos/[id]. O InlineStatusSelect embutido faz POST /api/projetos/edit (rota existe: src/app/api/projetos/edit/route.ts) com rollback optimista em erro. Funcional. [[id]/page.tsx:104-143 + src/components/painel/TarefaCard.tsx]
- **Histórico de pagamentos** — getPagamentosByCliente (Mongo, sort data desc), agrupado por projecto com subtotais, método (METODO_LABEL) e notas; liga a /painel/projetos/[id]. Read-only por design (registo de pagamentos vive na zona projectos). [[id]/page.tsx:118-129,149-199]
- **Conversão lead→cliente (loader)** — Usado por /api/leads/[id]/convert (zona leads). Deduplica por email case-insensitive com regex escapada. Ligado, embora o consumidor esteja fora desta zona. [src/lib/mongodb/clientes.ts:48-71 (createClienteFromLead, getClienteByEmail)]
- **ClienteQuickForm (criação rápida a partir do form de projecto)** — Também faz POST /api/clientes/upsert. Ligado — consumidor está na zona projectos. [src/components/painel/ClienteQuickForm.tsx:30 (usado em TarefaForm.tsx:414)]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **GET /api/clientes (rota órfã)** — Rota completa e autenticada mas SEM nenhum caller no codebase — grep de '/api/clientes' só encontra a própria rota e os dois forms que chamam /api/clientes/upsert. Código morto do lado do consumo. [src/app/api/clientes/route.ts:6-14]
- **DELETE /api/clientes/[id] inatingível a partir da UI** — Rota funcional (withAuth, deleteCliente, logMutation, revalidatePath) mas NÃO existe nenhum botão 'apagar cliente' em lado nenhum do painel que a chame. Só acessível por chamada manual à API. Feature fantasma: o backend está pronto, a UI nunca foi ligada. [src/app/api/clientes/[id]/route.ts:8-35]
- **Modo 'Editar' do NovoClienteButton (branch morto)** — O componente aceita prop `cliente` e renderiza 'Editar'/'Editar cliente'/'Actualiza os dados...', mas o único uso é <NovoClienteButton /> sem prop (clientes/page.tsx:78). A edição real é feita inline na ficha via ClienteForm — todo o branch isEdit é código morto. [src/components/painel/NovoClienteButton.tsx:21-44]
- **Props delta/spark do KpiCard (decorativas por contrato)** — Documentadas como 'Decorative until backed by real series'. Nesta zona ninguém as passa, portanto os KPIs de clientes NÃO mostram nada decorativo — mas a API decorativa existe no componente partilhado. [src/components/painel/KpiCard.tsx:18-21]

### Observações

- Definição de 'projecto activo' diverge do resto do painel: as duas páginas de clientes contam ativo+proximo+aguardaEncomenda+pronto (em-curso, proximo, aguardando-encomenda, terminado) mas EXCLUEM 'aguardando-cliente' (clientes/page.tsx:49-54 e [id]/page.tsx:36-42), enquanto o badge da sidebar usa PROJETO_ATIVO_STATUSES = ['em-curso','proximo'] (src/types/projeto.ts:42, comentado como 'Fonte ÚNICA'). Os números do KPI 'Com projecto activo' não batem certo com o badge de projectos.
- Buraco na guarda de liquidação: TarefaCard chama InlineStatusSelect sem pagoTotal/valorEstimado (TarefaCard.tsx:64), pelo que na ficha do cliente o quick action 'Fechar' aparece em projectos 'terminado' MESMO com dívida por liquidar — a guarda `liquidado` (InlineStatusSelect.tsx:91-98) passa porque valorEstimado é undefined (undefined == null). Fechar um projecto com dívida fá-la desaparecer silenciosamente dos KPIs (dívida só conta status 'terminado').
- Grelha de KPIs da ficha tem 5 cartões numa grid lg:grid-cols-4 ([id]/page.tsx:84) — o cartão 'Em dívida' cai sozinho numa segunda linha.
- KPI 'Valor estimado' da ficha soma valorEstimado de TODOS os projectos, incluindo cancelados e ideias ([id]/page.tsx:45) — pode inflacionar a percepção do valor do cliente.
- Formatação inconsistente de euros: PagamentosHistorico renderiza {total}€, {sub}€ e {p.valor}€ crus sem toLocaleString ([id]/page.tsx:167,180,188) — valores com decimais aparecem '1234.5€'; a lista de clientes usa Math.round(...).toLocaleString('pt-PT') (page.tsx:85,138).
- Nada nesta zona depende de env vars (Blob/VAPID/Upstash/Turnstile) — por isso a lista 'dormente' está vazia; tudo o que existe ou está ligado ou é morto.
- Sem paginação nem pesquisa na lista de clientes — getAllClientes puxa a colecção inteira; ok para a escala actual (utilizador único), mas relevante para o redesign se a base crescer.

### RECOMENDAÇÕES

- [MANTER] **Lista de clientes + KPIs (page.tsx)** — Totalmente ligada a dados reais, sem hardcoded; boa base para o redesign.
- [MANTER] **Ficha editável inline + Novo cliente (ClienteForm → /api/clientes/upsert)** — CRUD verificado ponta a ponta com validação zod, audit log e revalidate — funciona.
- [MANTER] **Histórico de pagamentos na ficha** — Dados reais e úteis; só corrigir a formatação de euros (toLocaleString pt-PT) no redesign.
- [ALTERAR] **DELETE /api/clientes/[id]** — Backend pronto mas sem UI — no redesign adicionar acção 'Apagar cliente' na ficha (com confirmação e aviso se houver projectos/pagamentos associados), ou remover a rota se apagar não é desejado.
- [REMOVER] **GET /api/clientes** — Rota sem nenhum consumidor no codebase; superfície de API desnecessária (a listagem é server-rendered).
- [REMOVER] **Branch isEdit do NovoClienteButton** — Nunca é invocado com prop cliente; a edição real vive na ficha inline. Simplificar para botão de criação puro.
- [ALTERAR] **Definição de 'projecto activo' nas páginas de clientes** — Unificar com PROJETO_ATIVO_STATUSES ou criar um grupo nomeado em STATUS_GROUPS (ex.: 'pipeline') e usá-lo nas duas páginas — hoje os KPIs de clientes contam 4 estados e o resto do painel conta 2, e 'aguardando-cliente' fica de fora sem razão documentada.
- [ALTERAR] **Quick action 'Fechar' em TarefaCard na ficha do cliente** — Passar pagoTotal/valorEstimado ao InlineStatusSelect (a ficha já tem pagoPorProjeto calculado) ou esconder o quick action quando os dados não são passados — hoje permite fechar projectos com dívida, apagando-a dos KPIs.
- [ALTERAR] **Grelha de KPIs da ficha (5 cartões em grid de 4)** — No redesign, usar lg:grid-cols-5 ou fundir 'Valor estimado' + 'Em dívida' num cartão financeiro único; considerar excluir cancelados/ideias da soma do valor estimado.


## Leads (painel) — página, LeadsTable, /api/leads/*, push notifications, bloquear IP

### LIGADO

- **KPIs (Total / Novos / Em curso / Ganhos)** — Todos calculados de getAllLeads() (Mongo, colecção 'leads', sort criadoEm desc, src/lib/mongodb/leads.ts:7-14). Nenhum valor hardcoded. [src/app/(painel)/painel/leads/page.tsx:11-32]
- **Tabela de leads + Sheet de detalhe** — Renderiza dados reais (nome, email, assunto, mensagem, estado, data, IP). Clique na linha abre Sheet com detalhe completo. Empty state legítimo quando leads.length === 0. [src/components/painel/LeadsTable.tsx]
- **Mudar estado do lead (Select no Sheet)** — PATCH existe, withAuth, valida estado contra LEAD_ESTADOS, updateLeadEstado no Mongo, audit log (logMutation), revalidatePath. UI optimista com revert em erro — bem feito. [src/components/painel/LeadsTable.tsx:91-121 -> src/app/api/leads/[id]/route.ts:14-41]
- **Eliminar lead** — DELETE existe; lê o lead antes de apagar para guardar cópia no audit_log. Confirm dialog no cliente. [src/components/painel/LeadsTable.tsx:123-140 -> src/app/api/leads/[id]/route.ts:43-63]
- **Converter em cliente** — POST existe: cria ou reutiliza cliente por email (createClienteFromLead), liga clienteId, marca 'ganho', audit, redirect para /painel/clientes/[id] (página existe). 409 se já convertido. [src/components/painel/LeadsTable.tsx:142-155 -> src/app/api/leads/[id]/convert/route.ts]
- **Ver cliente (quando lead.clienteId)** — Link para /painel/clientes/[id] — página existe (src/app/(painel)/painel/clientes/[id]/page.tsx). [src/components/painel/LeadsTable.tsx:300-306]
- **Responder (mailto)** — Link mailto: com subject pré-preenchido. Client-side puro, sem backend — funciona por definição. [src/components/painel/LeadsTable.tsx:322-329]
- **Bloquear IP (botão Ban na tabela e no Sheet)** — POST existe (withAuth, zod IP v4/v6, audit log, upsert em 'blocked_ips'). Consumido a sério: /api/sendEmail chama isIpBlocked e devolve 200 silencioso sem gravar (src/app/api/sendEmail/route.ts:54-64). Circuito block completo e fail-open se a BD falhar. [src/components/painel/BlockIpButton.tsx -> src/app/api/blocked-ips/route.ts:28-55]
- **Pipeline de captura (origem dos dados)** — Formulário público grava lead via createLead com honeypot + rate limit + blocklist. É o que alimenta esta página — ligado ponta a ponta. [src/app/api/sendEmail/route.ts:89-111]

### DORMENTE

- **Botão 'Ativar notificações' (PushOptIn)** (precisa: NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY no Vercel (gerar com npx web-push generate-vapid-keys; VAPID_SUBJECT opcional, default mailto:reddunesolutions@gmail.com em src/lib/push.ts:11)) — Sem a chave pública o componente devolve null (linha 29-37) — o botão NEM RENDERIZA em produção. Código completo e correcto: subscribe/permission flow, iOS PWA caveat documentado, degradação graciosa. [src/components/painel/PushOptIn.tsx]
- **Rotas /api/push/subscribe e /api/push/unsubscribe** (precisa: Mesmas chaves VAPID (as rotas funcionam mas nada as chama enquanto o botão não renderizar)) — withAuth, validação do shape da subscription, upsert/delete na colecção push_subscriptions. Inalcançáveis na prática sem VAPID. [src/app/api/push/subscribe/route.ts, src/app/api/push/unsubscribe/route.ts]
- **Envio de push (sendPushToAll)** (precisa: VAPID_PRIVATE_KEY + NEXT_PUBLIC_VAPID_PUBLIC_KEY) — No-op silencioso sem chaves (ensureConfigured devolve false). Com chaves: envia a todas as subscrições, limpa expiradas (404/410), nunca lança. Push title 'Novo lead 🌵' hardcoded em sendEmail/route.ts:116 (aceitável). [src/lib/push.ts:30-59; chamado em src/app/api/sendEmail/route.ts:114-122 e nas rotas do portal (api/portal/comentario, api/portal/cliente)]
- **Handlers push do service worker** (precisa: VAPID (o SW está registado e activo — src/components/ServiceWorkerRegister.tsx montado em src/app/layout.tsx:104 — só os eventos push nunca disparam)) — showNotification + notificationclick com foco/abertura de janela para /painel/leads. Pronto a funcionar no minuto em que houver chaves. [public/sw.js:25-60]

### DECORATIVO/MORTO

- **GET /api/blocked-ips (listar IPs bloqueados) e action 'unblock'** — Endpoints existem e funcionam mas NÃO têm nenhum consumidor no UI (grep em todo o src: só BlockIpButton chama a API, sempre com action 'block'). Consequência real: um IP bloqueado por engano não se consegue ver nem desbloquear pelo painel — só via curl/Mongo directo. [src/app/api/blocked-ips/route.ts:24-26 e :34-42; src/lib/mongodb/blocked-ips.ts:30-42]
- **Campo Lead.notas** — Sempre criado a null (src/app/api/sendEmail/route.ts:100) e nenhum UI/rota lê ou escreve notas de lead. Campo morto no schema (não confundir com notas de cliente, essas têm UI). [src/types/lead.ts:30]
- **Export upsertLead** — Função exportada sem nenhum consumidor no codebase (grep: 0 call sites). Código morto. [src/lib/mongodb/leads.ts:27-32]

### Observações

- O botão 'Ativar notificações' não aparece em produção: PushOptIn devolve null quando NEXT_PUBLIC_VAPID_PUBLIC_KEY falta (PushOptIn.tsx:29-37). Nada está partido aos olhos do utilizador — a feature está simplesmente invisível.
- PushOptIn usa navigator.serviceWorker.ready, que só resolve se o SW estiver registado — está: ServiceWorkerRegister é montado no layout raiz (src/app/layout.tsx:104) e regista /sw.js.
- A rota DELETE de leads guarda o documento completo no audit_log antes de apagar (route.ts:47-59) — o audit fica com a única cópia; ter isto em conta se o redesign mexer no fluxo de eliminação.
- A coluna IP tem stopPropagation no td (LeadsTable.tsx:212) para o botão de bloquear não abrir o Sheet — detalhe de UX a preservar no redesign.
- sendPushToAll também é chamado pelas rotas do portal do cliente (api/portal/comentario e api/portal/cliente), por isso activar VAPID beneficia leads E comentários do portal ao mesmo tempo.
- Segurança ok na zona: todas as rotas de mutação usam withAuth; blocked-ips valida IP com regex zod; subscribe valida o shape da subscription.

### RECOMENDAÇÕES

- [MANTER] **Tabela de leads + Sheet (estado, eliminar, converter, responder)** — Tudo ligado ponta a ponta com auth, validação, audit log e UI optimista com revert. É a zona mais sólida do painel — no redesign preservar o fluxo, só rever estética.
- [MANTER] **KPIs da página** — Dados reais do Mongo. Nota de estilo para o redesign: gridTemplateColumns inline em page.tsx:28 e cores de estado hardcoded em LeadsTable.tsx:33-39 (#9a6b14, #2f6f8a, #3f7d4a fora dos design tokens) — mover para tokens/CSS vars.
- [ALTERAR] **Bloquear IP** — O block funciona, mas falta o outro lado: criar uma vista (ou secção nas definições) que consuma o GET /api/blocked-ips e a acção unblock que já existem no backend. Hoje bloquear um IP é irreversível pelo UI. Alternativa: se não quiserem essa vista, remover o GET e o branch unblock da rota.
- [MANTER] **PushOptIn + rotas /api/push/*** — Dormente por design e invisível sem chaves — custo zero no UI. Activar é trivial (npx web-push generate-vapid-keys + 2 env vars no Vercel) e o valor é alto para leads (aviso imediato de novo contacto). Recomendo activar em vez de remover. No redesign, atenção aos estilos inline com fallbacks hardcoded (PushOptIn.tsx:104,138).
- [ALTERAR] **Campo Lead.notas** — Ou dar-lhe uso (textarea de notas internas no Sheet do lead — útil para registar o follow-up de 'contactado'/'orcamento') ou remover do tipo e do createLead. No estado actual é ruído no schema.
- [REMOVER] **upsertLead (src/lib/mongodb/leads.ts:27)** — Export sem call sites. Código morto — apagar para não confundir o próximo redesign.
- [ALTERAR] **Motivo de bloqueio hardcoded 'spam (painel)'** — BlockIpButton.tsx:30 envia sempre o mesmo motivo. Menor: se fizerem a vista de IPs bloqueados, vale a pena deixar o motivo editável no confirm dialog.


## Procurar — página /painel/procurar + GlobalSearch (Topbar) + entrada BottomNav

### LIGADO

- **Página de resultados /painel/procurar** — Server component com force-dynamic. Lê ?q=, e com termo faz Promise.all de getAllProjetos()+getAllClientes()+getAllTarefas() (loaders Mongo reais, find({}) nas colecções) e filtra em memória com normalização de acentos (norm(), linhas 18-23). Sem termo, não toca na BD (linha 53) — comportamento intencional e correcto. [src/app/(painel)/painel/procurar/page.tsx:76-84]
- **Contadores de resultados ('Resultados · N' e por secção)** — Todos calculados a partir dos hits reais (projetosHit/clientesHit/tarefasHit). Nenhum número hardcoded. O total entra em titleHtml via dangerouslySetInnerHTML mas é sempre um number — o termo q nunca entra em HTML cru (description é prop de texto), sem risco XSS. [src/app/(painel)/painel/procurar/page.tsx:89,95,117,168,217]
- **Links dos resultados (projectos, clientes, tarefas)** — Cada linha liga a /painel/projetos/[id] ou /painel/clientes/[id] — ambas as rotas existem. Tarefas ligam ao projecto-pai via projetoById map (linha 87), com fallback 'Projecto desconhecido' para tarefas órfãs. StatusBadge mostra status real do Mongo. [src/app/(painel)/painel/procurar/page.tsx:137,185,237]
- **GlobalSearch (componente de pesquisa)** — Form funcional: onSubmit faz router.push('/painel/procurar?q=...') com useTransition (spinner Loader2 enquanto pende). Atalho ⌘K/Ctrl+K implementado e funcional (linhas 22-31, verifica metaKey E ctrlKey). Usado em 2 sítios: Topbar (Topbar.tsx:62, só ≥901px) e in-page na própria página procurar (linhas 64 e 102). [src/components/painel/GlobalSearch.tsx:33-39]
- **Entrada 'Procurar' no BottomNav (mobile)** — Entrada real com Link do Next para /painel/procurar, ícone Search, participa na ordenação custom de tabs (localStorage painel.tabOrder). É o ÚNICO caminho para a pesquisa em mobile, porque a GlobalSearch do Topbar está escondida ≤900px (painel.css:997 e Topbar.tsx:61). [src/lib/painel-nav.ts:32 + src/components/painel/BottomNav.tsx:52 + src/app/(painel)/layout.tsx:105]
- **Empty states (sem termo / sem resultados / secção vazia)** — Estados vazios reais ligados à lógica (q vazio, total===0, secção sem hits), não placeholders permanentes. [src/app/(painel)/painel/procurar/page.tsx:66-70,104-109,120-125]
- **Avatares de clientes nos resultados** — avFor() faz hash do nome para 1 de 4 classes CSS (.av-c.a-d, definidas em painel.css:694-697) e initials() gera as iniciais — dados reais, funcional. [src/app/(painel)/painel/procurar/page.tsx:26-33,186]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Label '⌘K' hardcoded no GlobalSearch** — O badge mostra sempre '⌘K' (símbolo Mac) mesmo em Windows/Linux, onde o atalho real é Ctrl+K. O atalho FUNCIONA em ambas as plataformas; só o rótulo é que é decorativo/errado fora de macOS. [src/components/painel/GlobalSearch.tsx:56]
- **Classe CSS 'gsearch-page' sem regra em lado nenhum** — O wrapper <div className="gsearch-page"> não tem nenhuma regra correspondente em painel.css nem em qualquer ficheiro de src — é um hook CSS morto. Consequência visível: a caixa in-page fica com os 320px fixos do .gsearch (painel.css:198) em vez de largura de página. [src/app/(painel)/painel/procurar/page.tsx:63,101]
- **scrollRef morto no BottomNav** — scrollRef é declarado e anexado ao div de scroll mas nunca é lido — a centragem da tab activa usa activeRef.scrollIntoView (linha 42). Ref morta. [src/components/painel/BottomNav.tsx:38,47]
- **Ocultação dupla e redundante da search no Topbar** — A mesma ocultação ≤900px é feita duas vezes: classe Tailwind 'hidden min-[901px]:block' no wrapper E regra CSS '.pnl .topbar .gsearch { display:none }'. Não é bug, mas um dos mecanismos é código morto por redundância. [src/components/painel/Topbar.tsx:61 + src/app/(painel)/painel.css:997]
- **Listener Ctrl+K duplicado na página procurar (desktop)** — Em desktop a página procurar monta 2 instâncias de GlobalSearch (Topbar + in-page), cada uma regista o seu keydown global; ambas fazem preventDefault e o foco fica na última registada. Funciona, mas um dos listeners é efectivamente redundante. Em mobile o listener da instância do Topbar continua activo apesar de o input estar display:none (foco num input invisível se o utilizador carregar Ctrl+K). [src/components/painel/GlobalSearch.tsx:22-31]

### Observações

- A zona não tem nenhuma dependência de env var — nada dormente. Não usa Vercel Blob, push, Upstash nem Turnstile.
- A pesquisa NÃO cobre leads, pagamentos, portfólio, loja nem comentários do portal — só projectos, clientes e tarefas. Se o redesign quiser pesquisa 'global' a sério, é gap funcional a decidir, não bug.
- Performance: com termo, a página faz scan completo de 3 colecções por pesquisa (procurar/page.tsx:76-80, force-dynamic, sem cache). Aceitável hoje; se as colecções crescerem, considerar reutilizar o getSidebarCounts-style cache ou índice de texto.
- Segurança verificada: o termo q nunca entra em dangerouslySetInnerHTML (só o total numérico); q é encodeURIComponent no cliente e usado como texto no servidor. Página protegida pelo auth() do layout (painel)/layout.tsx:81-84.
- As colunas telefone/email dos clientes escondem-se em ecrãs pequenos via classe col-hide-sm — intencional, não morto.

### RECOMENDAÇÕES

- [MANTER] **Página /painel/procurar (pesquisa 3-em-1)** — Totalmente ligada a dados reais, com match insensível a acentos sobre título/cliente/tipo/notas/NIF/telefone/email. O modelo 'carregar tudo + filtrar em JS' é adequado à escala de utilizador único; não vale a pena índice de texto Mongo por agora.
- [MANTER] **GlobalSearch + atalho de teclado** — Form, transição e navegação funcionam. No redesign, manter o padrão submit→página de resultados (simples e robusto); um dropdown de sugestões live seria upgrade opcional, não correcção.
- [ALTERAR] **Label '⌘K' (GlobalSearch.tsx:56)** — Detectar plataforma (navigator.platform/userAgentData) e mostrar 'Ctrl K' fora de macOS — o dono usa Windows, o rótulo actual ensina o atalho errado.
- [ALTERAR] **Wrapper .gsearch-page (procurar/page.tsx:63,101)** — Ou definir a regra CSS em falta (ex.: .gsearch-page .gsearch { width:100%; max-width:560px }) para a caixa in-page ter largura decente — importante em mobile onde é a única caixa de pesquisa — ou remover o wrapper se o redesign tratar disto de outra forma.
- [REMOVER] **scrollRef no BottomNav (BottomNav.tsx:38)** — Ref nunca lida; limpar no redesign.
- [ALTERAR] **Ocultação dupla da search do Topbar** — Escolher UM mecanismo (sugestão: só a classe Tailwind no wrapper, apagando painel.css:997) para evitar divergência futura de breakpoints. Idealmente desmontar mesmo a instância em mobile (em vez de display:none) para eliminar o listener Ctrl+K fantasma.
- [MANTER] **Entrada 'Procurar' no BottomNav** — É o único acesso à pesquisa em mobile (a search do Topbar colapsa ≤900px). Se o redesign remover esta tab, tem de dar acesso alternativo à pesquisa em mobile.


## Dívidas — /painel/dividas (page.tsx) + cálculo de dívida + badge da sidebar/bottom-nav

### LIGADO

- **Fonte de dados da página (3 loaders Mongo)** — getAllProjetos() (coleção projetos), getAllPagamentos() (coleção pagamentos) e getAllClientes() (coleção clientes) — todos loaders reais do driver nativo, chamados em Promise.all no server component. Nada mockado. [src/app/(painel)/painel/dividas/page.tsx:54-59; src/lib/mongodb/projetos.ts:7-13; src/lib/mongodb/pagamentos.ts:25-32; src/lib/mongodb/clientes.ts:9]
- **Cálculo da dívida** — Dívida = valorEstimado − Σ(pagamentos.valor por projetoId), apenas para projetos com status 'terminado' E valorEstimado != null E pago < estimado. Dias em dívida = hoje − (dataFechado ?? dataCriado); dataFechado é auto-preenchido pelo upsert quando o status passa a terminado/fechado (api/projetos/upsert/route.ts:81-85). Cálculo 100% derivado de dados reais. [src/app/(painel)/painel/dividas/page.tsx:64-94]
- **4 KPI cards (Total / 30+ dias / 10–30 dias / Recente ≤10d)** — Todos computados dos rows reais (reduce/filter). KpiCard só renderiza props; delta/spark decorativos NÃO são usados nesta página. Limiares dos buckets são constantes de design hardcoded: 30 e 10 dias em page.tsx:43-47 — não são dados falsos, são regras de negócio embutidas. [src/app/(painel)/painel/dividas/page.tsx:96-126; src/components/painel/KpiCard.tsx]
- **Tabs de filtro (Todas / 30+ dias / Esta semana)** — Links server-side via searchParams ?f= — funcionais, sem JS client. 'Esta semana' filtra dias <= 7 (page.tsx:106). Contagens nas tabs vêm dos rows reais; a tab 'Esta semana' deliberadamente não mostra contagem. [src/app/(painel)/painel/dividas/page.tsx:61-62,104-108,128-134,213-221]
- **Linhas de dívida (lista)** — Cada linha mostra projeto real (#id, título com Link para /painel/projetos/[id] — rota existe), cliente real (Link para /painel/clientes/[id] — rota existe), valor restante calculado, dias, e data do último pagamento vinda da coleção pagamentos. Empty state é condicional real (rows vazio). [src/app/(painel)/painel/dividas/page.tsx:144-206]
- **Botão 'Lembrete' (mailto)** — É um <a href=mailto:> real com o email do cliente vindo do Mongo e subject pré-preenchido 'Pagamento pendente · {titulo}'. Funciona (abre cliente de email) mas é client-side puro: não há server action, não regista que o lembrete foi enviado. Só aparece se o cliente tiver email. [src/app/(painel)/painel/dividas/page.tsx:194-198]
- **Botão 'Ver projecto'** — Link real para /painel/projetos/[id] (página existe e é LIGADA — é lá que se registam pagamentos via PagamentosSection + /api/pagamentos/upsert). [src/app/(painel)/painel/dividas/page.tsx:199-201]
- **Badge de contagem na sidebar + bottom-nav** — getSidebarCounts no layout do painel usa getProjetosResumo() (projeção leve) + getAllPagamentos() com a MESMA fórmula da página (terminado + valorEstimado + pago < estimado) — os números batem certo entre badge e página. Cache unstable_cache de 20s (documentado como aceitável). Renderizado em Sidebar e BottomNav só quando count > 0. [src/app/(painel)/layout.tsx:38-74,90,100-105; src/components/painel/Sidebar.tsx:83,98-99; src/components/painel/BottomNav.tsx:50,59]
- **Revalidação da página após mutações** — As rotas de mutação relevantes chamam revalidatePath('/painel/dividas'): upsert de projeto (route.ts:128) e upsert de pagamento (route.ts:65) — a página reflete alterações imediatamente. [src/app/api/projetos/upsert/route.ts:128; src/app/api/pagamentos/upsert/route.ts:65]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Rótulo 'última cobrança' — mislabel** — O texto 'última cobrança {data}' mostra na verdade a data do ÚLTIMO PAGAMENTO recebido (map ultimoPagamento construído da coleção pagamentos, page.tsx:66-70), não a data de uma cobrança/lembrete enviado. Não existe registo de lembretes em lado nenhum (o botão Lembrete é mailto sem tracking). O valor é real, o rótulo é enganador. [src/app/(painel)/painel/dividas/page.tsx:66-70,182]
- **Tag de cache 'painel-counts' nunca invalidada** — unstable_cache declara tags:['painel-counts'] mas revalidateTag não é chamado em nenhum sítio do repo (grep confirma zero ocorrências). A tag é código morto; o badge depende só do TTL de 20s. Comportamento aceitável e documentado no comentário, mas a tag em si não faz nada. [src/app/(painel)/layout.tsx:73]
- **Avatar com iniciais e cor por hash** — avFor()/initials() geram cor (classes a-d) e iniciais deterministicamente a partir do nome — puramente cosmético, sem dados. Inofensivo. [src/app/(painel)/painel/dividas/page.tsx:15-25,170]

### Observações

- Zona sem nenhum elemento DORMENTE: não depende de Blob, VAPID, Upstash nem Turnstile.
- Consistência página↔badge verificada: ambos usam status==='terminado' && valorEstimado!=null && Σpagamentos < valorEstimado (page.tsx:82 vs layout.tsx:49-54).
- O CRUD de pagamentos que alimenta esta página vive na página do projeto (PagamentosSection → /api/pagamentos/upsert e /api/pagamentos/[id], ambos existem e revalidam /painel/dividas).
- Risco de dados (não de código): projeto 'fechado' com saldo em falta desaparece das dívidas sem aviso — comportamento a validar no redesign.
- Comparação de datas ISO por string em ultimoPagamento (page.tsx:70) é correta para o formato ISO usado no tipo Pagamento.

### RECOMENDAÇÕES

- [MANTER] **Página de dívidas (estrutura geral, KPIs, tabs, lista)** — Tudo ligado a dados reais do Mongo, fórmula consistente entre página e badge, revalidação correta após mutações. É das zonas mais saudáveis do painel.
- [ALTERAR] **Rótulo 'última cobrança'** — Renomear para 'último pagamento' (é isso que os dados mostram). Se no redesign se quiser mesmo rastrear cobranças/lembretes, seria preciso nova coleção/campo — hoje não existe.
- [MANTER] **Botão 'Lembrete' (mailto)** — Facturação é manual fora do painel (decisão do dono) — um mailto pré-preenchido é adequado a esse fluxo. No redesign, opcionalmente registar a data do lembrete no projeto para dar sentido ao rótulo 'última cobrança', mas não é obrigatório.
- [ALTERAR] **Filtro 'Esta semana' (dias <= 7)** — Semântica ambígua: sobrepõe-se quase totalmente ao bucket 'Recente (≤10d)' mas com limiar diferente (7 vs 10 dias). No redesign, ou alinhar o limiar com o bucket ou renomear (ex.: 'Recentes') para não parecer um terceiro conceito.
- [ALTERAR] **Cálculo ignora projeto.valorPago (campo legacy)** — A dívida usa só a coleção pagamentos, mas o campo Projeto.valorPago ainda existe, é aceite pelo upsert (api/projetos/upsert/route.ts:102) e é mostrado na página do projeto (projetos/[id]/page.tsx:192-196). Um projeto com valorPago preenchido mas sem registos em pagamentos aparece como 100% em dívida. No redesign, ou migrar/remover valorPago, ou incluí-lo no cálculo — decidir uma fonte única.
- [ALTERAR] **Tag 'painel-counts' sem revalidateTag** — Ou remover a tag (código morto) ou passar a chamar revalidateTag('painel-counts') nas rotas de mutação de projetos/pagamentos para o badge atualizar instantaneamente em vez de esperar até 20s. Custo mínimo, ganho de coerência badge↔página.
- [MANTER] **Limiares 30/10/7 dias hardcoded** — São regras de negócio simples e legíveis (page.tsx:43-47,106); não vale a pena torná-las configuráveis para um utilizador único.
- [MANTER] **Exclusão de projetos 'fechado' do cálculo** — Intencional e consistente: 'terminado' = entregue mas por liquidar; 'fechado'/'cancelado' = arquivo (STATUS_GROUPS.arquivo em types/projeto.ts:54). O badge usa a mesma regra. Apenas garantir no redesign que o fluxo 'marcar como fechado' só acontece depois de pago (hoje nada impede fechar com dívida — a dívida desaparece silenciosamente da página).


## Calendário (/painel/calendario) — vistas mês/semana/dia + agenda lateral + criação rápida de tarefas

### LIGADO

- **Vista Mês (MonthCalendar)** — Grelha mensal com dados reais: projetos.prazo e tarefas.prazo vindos de getAllProjetos()/getAllTarefas() (Mongo, coleções projetos/tarefas, sem filtro). Cada entrada é um Link para /painel/projetos/[id]. Color-coding por status via STATUS_EV (MonthCalendar.tsx:27-37) com classes CSS confirmadas em painel.css:805-816. Máx. 3 entradas por dia com indicador +N. [src/app/(painel)/painel/calendario/page.tsx:64-68,149-159; src/components/painel/MonthCalendar.tsx; src/lib/mongodb/projetos.ts:7-13; src/lib/mongodb/tarefas.ts:16-23]
- **Agenda lateral — cartões 'Hoje' e 'Próximos · esta semana'** — Dados reais derivados dos mesmos loaders Mongo. Filtra só entradas accionáveis (projeto fora de STATUS_GROUPS.arquivo = fechado/cancelado; tarefa !feita), datas no fuso de Lisboa via todayLisbonDate(). Links reais para o projeto. Empty states honestos ('Nada agendado hoje.' / 'Sem prazos nos próximos 7 dias.'). [src/app/(painel)/painel/calendario/page.tsx:178-257; src/types/projeto.ts:47-57; src/lib/dates.ts:25,49,62]
- **Vista Semana (WeekCalendar)** — Grelha 7 dias com faixa 'Dia inteiro' (projetos + tarefas sem hora) e linhas horárias 08:00-20:00 (tarefas com prazoHora). Dados reais das mesmas props do servidor. Clicar num slot abre QuickTarefaModal com prazo/hora pré-preenchidos — CRUD real. [src/components/painel/WeekCalendar.tsx]
- **Vista Dia (DayCalendar)** — Slots de 30 min (08:00-20:00) + secção 'Dia inteiro'. Mesmos dados reais. Clique no slot abre QuickTarefaModal. Só renderiza a secção dia-inteiro quando há dados. [src/components/painel/DayCalendar.tsx]
- **QuickTarefaModal (criação rápida de tarefa)** — Form completo (título, projeto, prazo, hora) → POST /api/tarefas/upsert via safeJsonPost. Rota EXISTE e está completa: auth() NextAuth, validação zod (tarefaInputSchema), upsertTarefa() no Mongo, logMutation audit, revalidatePath de /painel/calendario e páginas relacionadas. Toast de erro + router.refresh() em sucesso. CRUD funcional de ponta a ponta. [src/components/painel/QuickTarefaModal.tsx:68-85; src/app/api/tarefas/upsert/route.ts; src/lib/mongodb/tarefas.ts:34-38]
- **Navegação prev/next/Hoje** — Links server-side com query params (?view=&m=/&date=) calculados por vista (mês: monthKey; semana: startOfWeek ±7d; dia: ±1d). Todos os hrefs funcionais, page é force-dynamic e relê searchParams. [src/app/(painel)/painel/calendario/page.tsx:79-114,125-147]
- **CalendarViewToggle (Mês/Semana/Dia)** — Client component com router.push preservando searchParams e trocando ?view=. Os três valores mapeiam para renders reais na page. Funcional. [src/components/painel/CalendarViewToggle.tsx]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Janela horária hardcoded 08:00-20:00 nas vistas semana e dia** — HOUR_START=8/HOUR_END=20 hardcoded em WeekCalendar.tsx:18-19 e DayCalendar.tsx:17-18. Consequência real: uma tarefa com prazoHora fora de 08:00-19:59 (ex. 07:30 ou 21:00) fica INVISÍVEL nas vistas semana/dia — tem hora, logo é excluída da faixa 'Dia inteiro' (filtro !t.prazoHora em WeekCalendar.tsx:113 e DayCalendar.tsx:62), e nenhuma linha horária a apanha (WeekCalendar.tsx:153-157, DayCalendar.tsx:104-108). Só aparece na vista mês. [src/components/painel/WeekCalendar.tsx:18-19,113,153-157; src/components/painel/DayCalendar.tsx:17-18,62,104-108]
- **Indicador '+N' de overflow na vista mês não é clicável** — MonthCalendar mostra só as 3 primeiras entradas por dia (slice(0,3) hardcoded em MonthCalendar.tsx:92) e o '+N' (linhas 99-101) é um <span> sem handler nem link — as entradas escondidas não têm forma de ser vistas a partir da vista mês (obriga a mudar manualmente para vista dia). [src/components/painel/MonthCalendar.tsx:92,99-101]
- **Cap hardcoded de 8 entradas em 'Próximos · esta semana'** — slice(0,8) em page.tsx:199 sem indicador de que há mais — se houver 12 prazos na semana, 4 desaparecem silenciosamente do cartão. [src/app/(painel)/painel/calendario/page.tsx:199]
- **Highlight de 'hoje' na vista semana usa fuso do browser, não o helper de Lisboa** — WeekCalendar.tsx:82 usa `const today = new Date()` em vez de todayLisbonDate() usado no resto da zona. Como é client component o fuso do browser normalmente coincide, mas é inconsistente com o padrão do projeto (comentários em page.tsx:73 e MonthCalendar.tsx:40 insistem no fuso de Lisboa). Puramente cosmético. [src/components/painel/WeekCalendar.tsx:82]
- **Cores de status inconsistentes entre vistas** — Duas paletas paralelas hardcoded: STATUS_EV na vista mês (MonthCalendar.tsx:27-37, ex. terminado=green) vs STATUS_DOT duplicado em WeekCalendar.tsx:21-31 e DayCalendar.tsx:20-30 (ex. terminado=bg-amber-500). O mesmo projeto muda de cor conforme a vista. STATUS_DOT está copy-paste idêntico nos dois ficheiros. [src/components/painel/MonthCalendar.tsx:27-37; src/components/painel/WeekCalendar.tsx:21-31; src/components/painel/DayCalendar.tsx:20-30]

### Observações

- Fontes de eventos confirmadas: APENAS projetos (campo prazo) e tarefas (prazo + prazoHora). Pagamentos NÃO aparecem no calendário apesar de Pagamento ter campo data ISO (src/types/pagamento.ts:24) — é ausência de feature, não código morto.
- Zona 100% independente de env vars — nada dormente aqui (não usa Blob, push, Upstash nem Turnstile).
- A vista mês mostra tudo (incluindo fechados/cancelados, color-coded) enquanto a agenda lateral filtra para accionáveis — comportamento documentado como intencional no comentário em page.tsx:171-175.
- Vista mês NÃO permite criar tarefa clicando num dia (só semana/dia têm QuickTarefaModal) — assimetria de UX entre vistas.
- getAllProjetos() e getAllTarefas() carregam as coleções inteiras sem filtro de intervalo de datas — irrelevante à escala actual (utilizador único), mas o calendário refaz isto a cada navegação de mês por ser force-dynamic.

### RECOMENDAÇÕES

- [MANTER] **Vistas mês/semana/dia + agenda lateral + navegação** — Tudo ligado a dados reais do Mongo com links funcionais; é das zonas mais saudáveis do painel.
- [MANTER] **QuickTarefaModal e rota /api/tarefas/upsert** — CRUD completo com auth, validação zod, audit log e revalidação correcta — padrão a replicar noutras zonas.
- [ALTERAR] **Janela horária 08:00-20:00 hardcoded** — Tarefas com hora fora do intervalo desaparecem das vistas semana/dia (perda de dados visível). No redesign: ou faixa 'fora de horas' no topo/fundo, ou intervalo dinâmico expandido até à tarefa mais cedo/tarde do dia.
- [ALTERAR] **'+N' overflow da vista mês** — Transformar em link para /painel/calendario?view=dia&date=YYYY-MM-DD desse dia — as entradas escondidas ficam a 1 clique em vez de inacessíveis.
- [ALTERAR] **Paletas de status duplicadas (STATUS_EV vs STATUS_DOT x2)** — Unificar numa única fonte (ex. export em types/projeto.ts ao lado de STATUS_GROUPS) — hoje o mesmo status tem cores diferentes conforme a vista e o mapa está copy-paste em 3 ficheiros; num redesign visual isto parte-se logo.
- [ALTERAR] **Cap de 8 em 'Próximos · esta semana'** — Acrescentar '+N mais' ou scroll quando exceder — truncar silenciosamente prazos da semana é o pior caso para um cartão cuja função é não deixar escapar prazos.
- [MANTER] **Pagamentos como fonte de eventos** — Manter fora por agora: pagamentos registados têm data mas facturação é manual fora do painel; só vale a pena se um dia houver pagamentos futuros/agendados (hoje o campo data é retrospectivo). Não é código morto a limpar.
- [ALTERAR] **Criação rápida a partir da vista mês** — Opcional no redesign: reutilizar o QuickTarefaModal já existente num clique no dia da vista mês — infra já está toda feita, é só ligar.


## Serviços/Preços — /painel/precos + edição de serviços + projeto-tipos-custom

### LIGADO

- **Página /painel/precos (listagem por categoria)** — Server component com dados reais: getAllServicos() do Mongo (coleção 'servicos') em page.tsx:10, agrupado pelas 3 categorias fixas de SERVICO_SLUG. Empty state real (aparece só se all.length === 0). [src/app/(painel)/painel/precos/page.tsx; src/lib/mongodb/servicos.ts:7-14]
- **ServicosEditor — criar/editar serviço (botão Guardar)** — CRUD confirmado ponta a ponta: save() faz POST /api/servicos/upsert (ServicosEditor.tsx:263) → rota existe, com auth NextAuth, validação zod (servicoInputSchema), upsert Mongo, audit log (logMutation), limpeza de blob órfão se a imagem mudou, e revalidatePath('/servicos') + revalidatePath('/servicos/[slug]') para o site público reflectir logo. [src/components/painel/ServicosEditor.tsx:201-276; src/app/api/servicos/upsert/route.ts]
- **ServicosEditor — apagar serviço (ícone lixo + confirm dialog)** — DELETE /api/servicos/[id] (ServicosEditor.tsx:288) → rota existe, apaga do Mongo, apaga blob da imagem, audit log, revalida páginas públicas. [src/components/painel/ServicosEditor.tsx:278-297; src/app/api/servicos/[id]/route.ts]
- **Upload de imagem do serviço (ImageUploadZone)** — POST /api/upload/product-image — rota existe e BLOB_READ_WRITE_TOKEN está configurado em produção, portanto funcional. Variantes de preço (Desktop/Portátil/Consola), campos i18n PT/EN, 'desde X€', min/max — tudo persiste no doc Mongo via o mesmo upsert. [src/components/painel/ImageUploadZone.tsx:90; src/app/api/upload/product-image/route.ts]
- **Alimentação do site público — CONFIRMADO via Mongo, não JSON estático** — Não existe rota pública /precos ('precos' é só o path do painel). O site público consome nos 2 sítios: (1) hub /servicos calcula o menor preço 'desde' por categoria a partir da BD (src/app/servicos/page.tsx:317-337) com fallback silencioso ao JSON i18n se a BD falhar/estiver vazia; (2) /servicos/[slug] substitui content.items.list (JSON i18n) pelos serviços activos da BD com formatPreco locale-aware (src/app/servicos/[slug]/page.tsx:319-338). O JSON i18n é só fallback/conteúdo envolvente; os preços editados no painel mandam. [src/app/servicos/page.tsx:314-350; src/app/servicos/[slug]/page.tsx:308-338; src/types/servico.ts:106-130]
- **Tipos de projecto personalizados (projeto-tipos-custom) — CRUD completo** — Editor em /painel/definicoes (secção 'Tipos de projecto personalizados', page.tsx:101, carregado server-side via getAllProjetoTiposCustom). Criar → POST /api/projeto-tipos-custom/upsert (existe, zod + auth + audit); apagar → DELETE /api/projeto-tipos-custom/[id] (existe). O GET /api/projeto-tipos-custom é consumido pelo TarefaForm (formulário de projecto) em TarefaForm.tsx:82, que também cria/apaga tipos inline (linhas 109 e 126). Nota: isto alimenta o formulário de projectos do painel, não o site público — as 3 categorias públicas são fixas. [src/app/(painel)/painel/definicoes/page.tsx:21,92-103; src/components/painel/ProjetoTiposCustomEditor.tsx; src/lib/mongodb/projeto-tipos-custom.ts; src/app/api/projeto-tipos-custom/*; src/components/painel/TarefaForm.tsx:78-133]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **GET /api/servicos — rota sem nenhum consumidor** — A rota existe e funciona (auth + Mongo), mas nenhum código no repo a chama: a página do painel usa getAllServicos() directamente server-side, e o ServicosEditor só usa /api/servicos/upsert e DELETE /api/servicos/[id]. Grep ao repo inteiro só encontra referências no próprio ficheiro e em docs. Rota morta (inofensiva, protegida por auth). [src/app/api/servicos/route.ts]
- **String 'desde' hardcoded em PT no hub público** — src/app/servicos/page.tsx:169 — no ramo de preço vindo da BD renderiza literalmente `desde <b>X€</b>` independentemente do locale; um visitante EN vê 'desde 30€' em vez de 'from 30€'. O ramo fallback (i18n JSON) e a página /servicos/[slug] usam labels traduzidos (ServicosPage.price.from) correctamente — só este ramo ficou hardcoded. [src/app/servicos/page.tsx:168-169]
- **Campo Draft.precoTexto morto no cliente (legacy)** — ServicosEditor.tsx:39 declara-o como 'preservado mas não editável', é lido para o estado (linha 73) mas nunca renderizado nem incluído no payload do upsert (linhas 240-262) — estado cliente morto. A preservação real acontece server-side (upsert/route.ts:74 faz fallback ao existing). formatPreco ainda o usa como fallback de display (types/servico.ts:124-126) para docs Mongo antigos — esse suporte legacy é intencional. [src/components/painel/ServicosEditor.tsx:39,73,103]
- **pricingPage/Body.tsx (referido em memória antiga) já não existe** — Não há src/components/sections/pricingPage nem rota pública /precos — o antigo componente de pricing foi removido; nada morto a limpar aqui, só confirmação de que a única fonte pública de preços é /servicos + /servicos/[slug] via Mongo. [n/a]

### Observações

- Nenhum item DORMENTE nesta zona: nada aqui depende de VAPID, Upstash ou Turnstile, e o BLOB_READ_WRITE_TOKEN existe em produção, pelo que o upload de imagens está operacional.
- O nome da rota do painel (/painel/precos) não corresponde a nenhuma rota pública /precos — a label na sidebar é 'Serviços' (src/lib/painel-nav.ts:36), o que é coerente; considerar renomear o path num redesign para evitar confusão futura.
- As 3 categorias públicas (assistencia-tecnica, web-digital, software-recuperacao) são fixas em código (src/types/servico.ts:1-13); os tipos custom só expandem subcategorias internas de projectos, nunca criam novas páginas públicas.
- Fallback resiliente confirmado: se o Mongo falhar, as páginas públicas caem no conteúdo JSON i18n sem rebentar (try/catch em ambas).

### RECOMENDAÇÕES

- [MANTER] **Página /painel/precos + ServicosEditor (CRUD serviços)** — Totalmente ligado ponta a ponta (Mongo → painel → revalidate → site público). É a única fonte dos preços públicos; qualquer redesign deve preservar o fluxo upsert/delete + revalidatePath e as variantes/i18n.
- [MANTER] **Editor de tipos de projecto personalizados (definicoes + TarefaForm)** — CRUD real com dois pontos de consumo (página definições + formulário de projecto). Funciona e tem audit log.
- [REMOVER] **GET /api/servicos** — Zero consumidores no repo; o painel lê directo do loader server-side. Menos superfície de API autenticada para manter. (Alternativa: manter só se houver plano concreto de consumo externo.)
- [ALTERAR] **String 'desde' hardcoded em src/app/servicos/page.tsx:169** — Bug de i18n visível a visitantes EN — trocar pelo label ServicosPage.price.from já usado no resto do site.
- [REMOVER] **Draft.precoTexto no ServicosEditor** — Estado cliente morto (nunca renderizado nem enviado); a preservação legacy já é garantida server-side no upsert. Manter apenas o fallback de display em formatPreco até migrar docs Mongo antigos.
- [MANTER] **Cabeçalho da página ('Edita os preços que aparecem nas páginas públicas /servicos')** — Descrição verificada como factualmente correcta — o painel alimenta mesmo /servicos e /servicos/[slug]; num redesign vale manter esta pista de causa-efeito para o admin.


## Loja (painel admin) — /painel/loja, /painel/loja/[id], API products, upload de imagens, ligação à loja pública /loja

### LIGADO

- **KPIs Total / Disponíveis / Destaques / Ocultos** — Calculados em runtime a partir de getAllProductsAdmin() (Mongo, find({}) na coll legacy website.loja). Nenhum valor hardcoded — total, available, featured e ocultos derivam do array real (page.tsx:12-15). Sem sparklines/deltas decorativos nesta página. [src/app/(painel)/painel/loja/page.tsx:10-29; src/lib/mongodb/products.ts:66-78]
- **Grid de catálogo com filtros por categoria e pesquisa** — Renderiza produtos reais do Mongo; chips de categoria gerados dinamicamente das categorias existentes, pesquisa client-side por nome/categoria. Badges Destaque/Oculto/condição derivam dos campos reais (featured, available, condition via conditionMeta). [src/components/painel/LojaClient.tsx:36-165; src/types/product.ts:28-42]
- **Criar produto (Sheet 'Novo produto' + ProductForm)** — Form completo (nome/descrição/categoria PT+EN, condição, preço, imagens, disponível, destaque) → POST /api/products/upsert. Rota existe, protegida por auth(), validação Zod (productInputSchema), grava via upsertProduct (insertOne), logMutation e revalidatePath('/loja'). CRUD confirmado ponta-a-ponta. [src/components/painel/ProductForm.tsx:65-86; src/app/api/products/upsert/route.ts; src/lib/mongodb/products.ts:113-138]
- **Editar produto (/painel/loja/[id])** — getProductById (Mongo) → ProductForm pré-preenchido com backHref → mesma rota upsert (update via updateOne, preserva createdAt para não reordenar a loja pública). notFound() se id inválido. [src/app/(painel)/painel/loja/[id]/page.tsx; src/app/api/products/upsert/route.ts:35-70]
- **Apagar produto** — Botão lixo → useConfirm (dialog destrutivo) → DELETE /api/products/[id]. Rota existe: auth, deleteOne, apaga blobs das imagens (deleteManagedBlobs), logMutation, revalidatePath('/loja'), estado busy com spinner. Fluxo completo verificado. [src/components/painel/LojaClient.tsx:51-69; src/app/api/products/[id]/route.ts]
- **Upload de imagens (ImageUploadZone)** — Drag&drop + file picker → compressão client-side para WebP 1600px/0.5MB (browser-image-compression) → POST /api/upload/product-image → Vercel Blob put() em products/{uuid}.webp. BLOB_READ_WRITE_TOKEN existe em prod → funcional. Auth + rate limit 20/min/IP. Reordenar (setas) e remover imagens são handlers reais; cleanup de blobs órfãos é feito server-side no save (upsert compara URLs antigos vs novos). [src/components/painel/ImageUploadZone.tsx; src/app/api/upload/product-image/route.ts; src/app/api/products/upsert/route.ts:38-46,72-75; src/lib/blob.ts]
- **Botões 'PT → EN' (copiar nome/descrição/categoria)** — Três botões com handlers reais que copiam o valor PT para o campo EN. Funcionais, puramente client-side. [src/components/painel/ProductForm.tsx:98-107,121-130,144-153]
- **Ligação à loja pública /loja** — A loja pública usa a MESMA coleção via getAllProducts() (filtra available:true, ordena featured+createdAt). Upsert e delete no painel fazem revalidatePath('/loja'), portanto alterações no painel propagam-se à loja pública. Ligação real e verificada, incluindo JSON-LD do catálogo gerado dos produtos reais. [src/app/loja/page.tsx:206-236; src/lib/mongodb/products.ts:52-64; src/components/sections/shop/ProductGrid.tsx]

### DORMENTE

- **Migração da coleção legacy website.loja → {MONGODB_DB_NAME}.products** (precisa: Correr scripts/migrate-products-db.mjs (one-time, idempotente) e depois trocar DB_NAME/COLLECTION em products.ts para process.env.MONGODB_DB_NAME + 'products') — products.ts:9-10 tem hardcoded DB_NAME='website' e COLLECTION='loja' com comentário a documentar a migração pendente. O script existe e está pronto mas não foi executado/activado. Tudo funciona no estado actual — é dívida de arrumação de BD, não avaria. [src/lib/mongodb/products.ts:6-10; scripts/migrate-products-db.mjs]

### DECORATIVO/MORTO

- **GET /api/products (listagem admin)** — Rota existe e é funcional (auth + getAllProductsAdmin) mas NÃO tem nenhum caller no código — a página do painel usa o loader Mongo directamente no server component, e a loja pública idem. Grep por 'api/products' só encontra o DELETE /[id] e o /upsert. Rota morta. [src/app/api/products/route.ts]
- **POST /api/upload/product-image/delete** — Rota completa (auth + deleteManagedBlob) sem nenhum caller em src/ (só referida em PLANO-MELHORIAS.md). O ImageUploadZone deliberadamente NÃO apaga blobs no cliente (comentário em ImageUploadZone.tsx:163-168) — a limpeza órfã é feita nas rotas de upsert/delete. Rota morta. [src/app/api/upload/product-image/delete/route.ts]
- **Tab única 'Catálogo' na barra de tabs** — Botão <button className="active"> sem onClick — é uma barra de tabs com um único separador sempre activo, puramente decorativa (o contador {products.length} é real, mas o botão não faz nada). LojaClient.tsx:80-82. [src/components/painel/LojaClient.tsx:80-82]
- **Stats hardcoded na WarrantyStrip da loja pública (contexto da ligação)** — Os números '3', '6', '14' (meses de garantia novo/recondicionado, dias de devolução) estão hardcoded em src/app/loja/page.tsx:115-117. É copy de marketing intencional (labels vêm de i18n), não dados — mas se a política mudar tem de ser editado em código, não no painel. [src/app/loja/page.tsx:114-118]

### Observações

- Nada nesta zona depende de VAPID/Upstash/Turnstile — o único env crítico é BLOB_READ_WRITE_TOKEN (confirmado presente), e a rota de upload até tem guard explícito com erro claro se faltar (upload/product-image/route.ts:29-34).
- O rate limit do upload usa rateLimitDistributed (Mongo/memória sem Upstash) — funciona como está.
- Não existe página pública de detalhe de produto (/loja/[id] público não existe); a loja pública é grid + contacto WhatsApp (waLink em ProductGrid). O 'Editar' do painel é o único detalhe por produto.
- O form permite guardar produto sem imagens — só há hint em itálico 'Adiciona pelo menos uma.' (ImageUploadZone.tsx:257-261); a loja pública mostra 'sem imagem'. Decidir no redesign se imagem passa a obrigatória.
- mapDoc descarta silenciosamente documentos malformados (products.ts:20-45) — produtos legacy sem name.pt/en ou category bilingue desaparecem do painel E da loja sem aviso; num audit de dados vale a pena verificar se o count da coll bate certo com o KPI Total.
- Preço aceita vírgula decimal no form (replace(',', '.')) e o servidor valida >= 0 finito — sem moeda além de EUR, alinhado com o negócio.

### RECOMENDAÇÕES

- [MANTER] **CRUD de produtos + upload de imagens + KPIs** — Zona mais sólida do painel: fluxo ponta-a-ponta verificado (form → rota → Zod → Mongo → revalidate da loja pública), com auth, audit log (logMutation), rate limit no upload e limpeza de blobs órfãos. No redesign, preservar exactamente estes contratos de API.
- [REMOVER] **GET /api/products (rota de listagem sem caller)** — Nenhum consumidor no código; a listagem é server-side via loader Mongo. É superfície de API desnecessária (embora autenticada). Se um dia for precisa para mobile/externo, recria-se.
- [REMOVER] **POST /api/upload/product-image/delete (rota morta)** — Sem caller; a estratégia actual (reconciliação de blobs órfãos no upsert/delete) torna-a redundante e é até perigoso mantê-la — permite apagar qualquer blob gerido por URL sem verificar se ainda está referenciado por um produto.
- [ALTERAR] **Tab única 'Catálogo'** — No redesign, ou remover a barra de tabs (é decorativa) ou torná-la útil: tabs reais Disponíveis / Ocultos / Destaques como filtros de estado, complementando os chips de categoria já funcionais.
- [ALTERAR] **Limite de imagens no ProductForm** — O servidor rejeita >12 imagens (PRODUCT_IMAGE_CAP em validation-product.ts:12) mas o ProductForm não passa max ao ImageUploadZone — o utilizador pode carregar 15 imagens (blobs criados) e o save falhar com 'Invalid payload', deixando blobs órfãos. Passar max={12} ao ImageUploadZone em ProductForm.tsx:188.
- [ALTERAR] **Migração website.loja → products** — Executar o script one-time e trocar as constantes em products.ts para eliminar o DB legacy hardcoded. Baixo risco (idempotente, documentado), tira dívida técnica antes do redesign.
- [ALTERAR] **Grid com gridTemplateColumns inline repeat(4,1fr)** — Estilo inline em LojaClient.tsx:122 (e kpi-grid em page.tsx:25) fixa 4 colunas via style attribute; no redesign mover para CSS responsivo (classes tile-grid/kpi-grid já existem em painel.css) para evitar inline styles a lutar com media queries.


## Portfólio (painel) — /painel/portfolio + /painel/portfolio/[id] + ligação ao portfólio público

### LIGADO

- **KPIs (Total, Destaque·landing, Com link, Sem categoria)** — Todos os 4 valores são computados em runtime a partir de getAllPortfolioItems() (Mongo website.portfolio, page.tsx:10-15). Zero valores hardcoded. Os KpiCard aqui não usam as props decorativas delta/spark. [src/app/(painel)/painel/portfolio/page.tsx:10-29; src/lib/mongodb/portfolio.ts:42-51]
- **Título da Topbar com contagem** — "Portfólio · N trabalhos" deriva de items.length real (page.tsx:21). [src/app/(painel)/painel/portfolio/page.tsx:19-23]
- **Tabs de filtro (Todos / categorias / Destaques) com contadores** — Filtro client-side sobre os items reais; contadores computados via useMemo (PortfolioClient.tsx:39-53). Categorias vêm de SERVICO_SLUG (mesma taxonomia dos serviços do site). [src/components/painel/PortfolioClient.tsx:39-95]
- **Botão 'Adicionar trabalho' (Sheet + form)** — Abre Sheet com PortfolioForm; submit faz POST /api/portfolio/upsert — rota existe, com auth NextAuth, validação zod (portfolioInputSchema), logMutation, limpeza de blob órfão e revalidatePath('/portfolio') + ('/'). CRUD completo e funcional. [src/components/painel/PortfolioClient.tsx:96-109; src/app/api/portfolio/upsert/route.ts:15-85]
- **Grelha de tiles (imagem, categoria, título, pill Destaque)** — Renderiza os items reais do Mongo; pill 'Destaque' reflecte destaqueLanding real; placeholder 'sem capa' quando imageUrl é string vazia. [src/components/painel/PortfolioClient.tsx:112-154]
- **Botão Apagar (por tile)** — Confirm dialog → DELETE /api/portfolio/[id] — rota existe, com auth, apaga o doc, apaga o blob da imagem (deleteManagedBlob), logMutation e revalida /portfolio e /. Loading state por item (busyId). [src/components/painel/PortfolioClient.tsx:55-73; src/app/api/portfolio/[id]/route.ts:10-39]
- **Página de edição /painel/portfolio/[id]** — getPortfolioItemById real (valida ObjectId, notFound() se não existir); PortfolioForm pré-preenchido; guarda via mesmo POST /api/portfolio/upsert; 'Voltar ao portfólio' é Link real. [src/app/(painel)/painel/portfolio/[id]/page.tsx; src/lib/mongodb/portfolio.ts:80-90]
- **PortfolioForm (título PT/EN, imagem, URL, categoria, destaque)** — Todos os campos ligados ao upsert. Botão 'PT → EN' tem handler real (copia titlePt). Validação client (URL http(s), destaque exige categoria) espelhada no servidor. Checkbox destaque desativa sem categoria — coerente com getDestaquesLanding que ignora destaques sem categoria. [src/components/painel/PortfolioForm.tsx:59-96,160-174]
- **Upload de imagem (ImageUploadZone)** — Comprime client-side para WebP e faz POST /api/upload/product-image → Vercel Blob (put). BLOB_READ_WRITE_TOKEN existe em produção, logo funciona. Auth + rate limit 20/min por IP + validação de MIME/tamanho na rota. [src/components/painel/ImageUploadZone.tsx:90-93; src/app/api/upload/product-image/route.ts]
- **Exclusividade de destaque por categoria** — Ao marcar destaqueLanding, o upsert desmarca automaticamente outros destaques da mesma categoria (updateMany em portfolio.ts:114-123). O texto do checkbox no form descreve exactamente este comportamento — está correcto. [src/lib/mongodb/portfolio.ts:113-123]
- **Ligação ao site público — /portfolio** — A página pública /portfolio usa o MESMO loader getAllPortfolioItems e a mesma taxonomia de categorias (filtro via ?categoria=). Mutações no painel revalidam /portfolio, portanto o painel controla directamente o site. [src/app/portfolio/page.tsx:146-156; src/components/sections/PortfolioGrid.tsx]
- **Ligação ao site público — landing (destaques)** — A landing usa getDestaquesLanding() (1 destaque por categoria) com fallback para os 3 mais recentes se não houver destaques (slice(0,3) em page.tsx:57). O checkbox 'Destacar na landing' do painel controla mesmo a homepage. [src/app/page.tsx:52-67; src/lib/mongodb/portfolio.ts:57-78]
- **Botão Eye 'Ver no site' (por tile)** — Anchor real para item.url (target _blank). Funcional, mas nota: abre o URL externo do projecto do cliente, NÃO a página /portfolio do site — o aria-label 'Ver no site' é impreciso. [src/components/painel/PortfolioClient.tsx:141-145]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Rota GET /api/portfolio** — Rota completa e funcional (auth + getAllPortfolioItems) mas NUNCA chamada por nenhum código do painel ou do site — grep a todo o repo só encontra chamadas a /api/portfolio/upsert e /api/portfolio/[id]. As páginas server lêem directamente do loader Mongo. Únicas referências são em PLANO-MELHORIAS.md como modelo a espelhar para testimonials/posts. Código morto na prática. [src/app/api/portfolio/route.ts:7-13]
- **Texto 'Sem imagens. Adiciona pelo menos uma.' no ImageUploadZone** — Sugere que a imagem é obrigatória, mas o submit do PortfolioForm não valida imageUrl — guarda-se um trabalho sem imagem sem qualquer erro (aparece 'sem capa' no painel e fallback de cor no site público). Copy enganadora, não enforced. [src/components/painel/ImageUploadZone.tsx:257-261; src/components/painel/PortfolioForm.tsx:59-96]

### Observações

- Nada dormente nesta zona: o único ponto dependente de env é o upload (BLOB_READ_WRITE_TOKEN), que o dono confirma existir em produção — a rota até tem guard amigável se faltar (src/app/api/upload/product-image/route.ts:29-34). Turnstile/VAPID/Upstash não tocam esta zona.
- mapDoc (src/lib/mongodb/portfolio.ts:16-23) descarta silenciosamente documentos sem title.pt/title.en/imageUrl/url como strings — um doc malformado no Mongo desaparece do painel E do site sem aviso. Relevante se algum dia importarem dados à mão.
- O fallback da landing usa slice(0,3) hardcoded (src/app/page.tsx:57) — comportamento intencional (3 mais recentes quando não há destaques), não um valor exibido.
- gridTemplateColumns 'repeat(4, 1fr)' inline em page.tsx:25 e PortfolioClient.tsx:119 é layout hardcoded (candidato a limpar no redesign), não dado falso.
- O portal do cliente /p/[token] não toca esta zona — o portfólio liga apenas ao site público (/ e /portfolio).

### RECOMENDAÇÕES

- [MANTER] **KPIs + tabs de filtro + grelha** — 100% ligados a dados reais do Mongo, sem nada decorativo. No redesign, os 4 KPIs e os contadores por categoria podem ser mantidos tal como estão (a fonte é uma só query).
- [MANTER] **CRUD (adicionar / editar / apagar) e exclusividade de destaque** — Fluxo completo e robusto: auth, zod, audit log, limpeza de blobs órfãos, revalidação do site público. É das zonas mais saudáveis do painel.
- [REMOVER] **Rota GET /api/portfolio** — Nunca é chamada — as páginas lêem directamente do loader. Remover reduz superfície de API; ou manter conscientemente só se for mesmo usada como template para testimonials/posts (PLANO-MELHORIAS.md), mas hoje é peso morto.
- [ALTERAR] **aria-label 'Ver no site' do botão Eye** — Abre o URL externo do projecto (item.url), não o portfólio público. Renomear para 'Abrir URL do projecto' e, opcionalmente, adicionar um link real para /portfolio?categoria=X no redesign.
- [ALTERAR] **Obrigatoriedade da imagem** — Decidir uma direcção: ou validar imageUrl no submit (a copy do UploadZone já promete isso), ou mudar a copy para deixar claro que a imagem é opcional com fallback. Hoje há incoerência entre texto e comportamento.
- [MANTER] **Pathname de upload 'products/...' para imagens de portfólio** — A rota /api/upload/product-image guarda tudo sob products/ no Blob (route.ts:63), incluindo capas de portfólio. Naming enganador mas funcional; mudar agora criaria dois namespaces e complicaria a limpeza de blobs. Só renomear se um dia houver migração de blobs.


## Auditoria — src/app/(painel)/painel/auditoria/page.tsx + src/lib/mongodb/mutation-audit.ts + cobertura do audit_log

### LIGADO

- **Tabela de auditoria (Quando/Quem/Acção/Recurso/Referência)** — Renderiza dados reais: getRecentAuditEntries(200) lê a colecção Mongo audit_log ordenada por at desc, com force-dynamic. Sem cache, sem mocks. [src/app/(painel)/painel/auditoria/page.tsx:84, src/lib/mongodb/mutation-audit.ts:73-82]
- **Tabs de filtro Todos/Criações/Edições/Eliminações com contadores** — Links server-rendered para ?op=create|update|delete; filtro e contagens calculados sobre o fetch real (não hardcoded). Funciona sem JS cliente. [src/app/(painel)/painel/auditoria/page.tsx:90-106]
- **Coluna Referência com label inteligente + link para a entidade** — pickLabel extrai titulo/nome/title.pt do snapshot before/after real; linka para /painel/projetos/[id] e /painel/clientes/[id] (rotas existentes). [src/app/(painel)/painel/auditoria/page.tsx:27-63]
- **Writer logMutation (insertOne em audit_log)** — Grava collection/entityId/op/userEmail/before/after/at. Snapshots sanitizados (HEAVY_KEYS omitidos, strings >2000 truncadas) e never-throw para não quebrar a mutação principal. [src/lib/mongodb/mutation-audit.ts:20-60]
- **Cobertura de escrita: TODAS as mutações CRUD do painel auditadas** — 37 call sites em 26 rotas: projetos (upsert/edit/[id]/links/portal/arquivo/arquivo[id]/sandbox/sandbox[id]), clientes (upsert/[id]), tarefas (upsert/edit/[id]/from-template), pagamentos (upsert/[id]), products (upsert/[id]), portfolio (upsert/[id]), servicos (upsert/[id]), tarefa_templates (upsert/[id]), projeto_tipos_custom (upsert/[id]), leads ([id] PATCH+DELETE, [id]/convert), settings (PUT), blocked_ips (POST add+remove). Verificado por grep exaustivo: nenhuma rota CRUD do painel escreve Mongo sem logMutation. [src/app/api/**/route.ts (26 ficheiros)]
- **Auditoria de edições do cliente via portal /p/[token]** — PATCH /api/portal/cliente regista update em clientes com userEmail sintético 'portal:<projetoId>' — a escrita do cliente aparece no log com atribuição distinguível do admin. [src/app/api/portal/cliente/route.ts:58-65]
- **Índices + TTL de retenção (2 anos, RGPD) em audit_log** — Índices at desc, collection+entityId+at, userEmail+at e TTL audit_ttl (expireAfterSeconds 2 anos). Aplicados de facto: ensureIndexes() corre no layout do painel. [src/lib/mongodb/init-indexes.ts:55-63, src/app/(painel)/layout.tsx:87]
- **Consumidores secundários do audit_log** — Dashboard do painel mostra actividade recente (getRecentAuditEntries) com botão 'Ver tudo' → /painel/auditoria; o sino de notificações (GET /api/notifications) funde as últimas 8 entradas de auditoria no feed. Entrada de navegação existe na sidebar. [src/app/(painel)/painel/page.tsx:18,281; src/app/api/notifications/route.ts:86,106-124; src/lib/painel-nav.ts:39]
- **Empty state 'Sem alterações registadas'** — Condicional genuíno (entries.length === 0), não placeholder permanente. [src/app/(painel)/painel/auditoria/page.tsx:126-133]

### DORMENTE

- **auth_audit (eventos de login/logout) sem leitor** (precisa: Não precisa de env var — precisa de UI. logAuthEvent grava signin-success/signin-rejected/signout com IP+userAgent em auth_audit (chamado 5x em src/lib/auth.ts), tem índices próprios, mas NENHUMA página ou rota lê esta colecção. Dados acumulam invisíveis.) — É o par natural da página de auditoria (tab 'Logins'). A escrita está ligada; a leitura não existe. [src/lib/mongodb/audit.ts:11-35, src/lib/auth.ts:76-161, src/lib/mongodb/init-indexes.ts:52-53]

### DECORATIVO/MORTO

- **getAuditEntriesFor() — export morto** — Função para histórico por entidade (collection+entityId) exportada mas nunca importada em lado nenhum do repo. O índice collection+entityId+at (init-indexes.ts:56) existe sobretudo para a servir. Código morto desde que foi escrito. [src/lib/mongodb/mutation-audit.ts:84-97]
- **COLL_LABEL hardcoded e incompleto na página** — Mapa cobre só 7 colecções (projetos, clientes, tarefas, pagamentos, products, portfolio, servicos). Entradas reais de leads, tarefa_templates, projeto_tipos_custom, settings e blocked_ips rendem o nome cru da colecção na coluna Recurso (ex.: 'blocked_ips'). O mapa gémeo em notifications/route.ts:38-47 diverge (esse já tem 'leads'). [src/app/(painel)/painel/auditoria/page.tsx:17-25]
- **Links da coluna Referência em entradas de delete → 404** — auditTarget linka sempre projetos/clientes para /painel/{coll}/{entityId}, mesmo quando op=delete e a entidade já não existe — link vivo para página 404. [src/app/(painel)/painel/auditoria/page.tsx:51-60]
- **Limite 200 hardcoded, sem paginação** — getRecentAuditEntries(200) fixo; a descrição do Topbar '${all.length} alterações registadas' é na verdade min(total, 200) e os contadores dos tabs contam só dentro dessa janela. Com TTL de 2 anos o histórico real será muito maior do que o visível. [src/app/(painel)/painel/auditoria/page.tsx:84,113]
- **Índice userEmail+at nunca usado** — Criado em init-indexes.ts:57 mas nenhuma query filtra por userEmail (site de utilizador único; o portal escreve 'portal:<id>' mas ninguém filtra por isso). [src/lib/mongodb/init-indexes.ts:57]

### Observações

- Cobertura real vs parcial: das 51 rotas API, todas as que mutam colecções de negócio no Mongo chamam logMutation. Ficam de fora, por design ou omissão leve: /api/portal/comentario (insert de comentário do cliente), /api/projetos/comentarios (flip lidoEm), /api/sendEmail (createLead público), /api/push/subscribe|unsubscribe (push_subscriptions), /api/upload/product-image e /delete (Vercel Blob, sem escrita Mongo). Nenhuma destas é CRUD de entidade do painel.
- logMutation é fire-and-forget (try/catch com console.error) — uma falha de audit nunca bloqueia a operação, mas também significa que a cobertura é best-effort, não garantia transacional.
- A rota /api/tarefas/upsert regista sempre op:'create'? Não verificado ao detalhe o op por rota; os upserts em geral distinguem create/update passando o doc anterior — spot-checks em projetos/upsert e products/upsert confirmam padrão before/after correcto.
- Nada nesta zona depende de env vars em falta: audit_log só precisa do MongoDB (MONGODB_URI, presente). VAPID/Upstash/Turnstile não tocam nesta zona.
- A sanitização de snapshots (HEAVY_KEYS: bodyMd, linhas, arquivos, hardware; MAX_STR 2000) é intencional e documentada — não é bug, é controlo de crescimento + RGPD (mutation-audit.ts:17-21).
- Chave de linha da tabela usa índice (key={`${collection}-${entityId}-${i}`}) — aceitável para lista read-only re-renderizada no servidor.

### RECOMENDAÇÕES

- [MANTER] **Página /painel/auditoria (tabela + tabs + writer logMutation)** — Núcleo 100% funcional e com cobertura real completa das mutações do painel; é das zonas mais sólidas do painel.
- [ALTERAR] **getAuditEntriesFor()** — Ou usar no redesign (timeline 'Histórico' na página de projecto/cliente — o loader e o índice já existem, é ganho barato) ou remover o export morto junto com o índice collection+entityId.
- [ALTERAR] **COLL_LABEL da página + OP_LABEL/pickLabel duplicados** — Completar labels em falta (leads, tarefa_templates, projeto_tipos_custom, settings, blocked_ips) e extrair mapa+pickLabel para módulo partilhado — página e notifications têm cópias divergentes.
- [ALTERAR] **Link de Referência em op=delete** — Não linkar (ou marcar 'removido') quando a operação é delete — hoje aponta para 404.
- [ALTERAR] **Limite fixo 200 / contadores por janela** — No redesign: paginação ou 'carregar mais' + filtro por colecção/origem (admin vs portal:*) server-side; os índices Mongo necessários já existem todos.
- [ALTERAR] **auth_audit sem UI** — Expor como tab 'Logins' na página de auditoria (dado de segurança relevante: signin-rejected com IP). A escrita já está feita; falta só a leitura. Alternativa: deixar como está (write-only forense), mas não remover.
- [MANTER] **Mutações não auditadas de baixo risco (portal/comentario, projetos/comentarios marcar-lido, sendEmail→createLead, push subscribe/unsubscribe)** — Ausência deliberadamente aceitável: comentários já notificam via push + sino, leads têm ecrã próprio, push subscriptions é infra. Auditar isto seria ruído. Única lacuna com algum peso: delete de imagem em /api/upload/product-image/delete apaga blob sem rasto — aceitável porque o products/upsert associado é auditado.


## Definições — src/app/(painel)/painel/definicoes/page.tsx

### LIGADO

- **Perfil da empresa (CompanyProfileForm)** — CRUD real e completo. Form (nome, NIF, email, telefone, morada, logoUrl) pré-preenchido server-side via getCompanySettings() e grava via PUT /api/settings — rota existe, com withAuth, validação zod (NIF 9 dígitos, logoUrl URL válido), logMutation para auditoria e revalidatePath. Grava no Mongo, coleção `settings`, doc único id:"company" (upsert parcial que não apaga campos ausentes). Validação de NIF espelhada no cliente. CAVEAT: os dados gravados não são consumidos em mais nenhum sítio da app (nem portal /p/[token], nem relatórios, nem documentos) — é um perfil write-only por agora. [src/components/painel/CompanyProfileForm.tsx; src/app/api/settings/route.ts:44-61; src/lib/mongodb/settings.ts:36-71]
- **Tipos de projecto personalizados (ProjetoTiposCustomEditor)** — CRUD real. Lista vem do Mongo (getAllProjetoTiposCustom, coleção `projeto_tipos_custom`). Criar → POST /api/projeto-tipos-custom/upsert (existe, auth + zod + logMutation). Apagar → DELETE /api/projeto-tipos-custom/[id] (existe, auth + logMutation, confirm dialog no cliente). E os tipos SÃO consumidos a jusante: TarefaForm.tsx faz GET /api/projeto-tipos-custom no mount (linha 82) e permite criar/apagar tipos inline no formulário de projecto — a promessa da copy "Aparecem no formulário de projecto" é verdadeira. [src/components/painel/ProjetoTiposCustomEditor.tsx:60,83; src/app/api/projeto-tipos-custom/upsert/route.ts; src/app/api/projeto-tipos-custom/[id]/route.ts; src/lib/mongodb/projeto-tipos-custom.ts; src/components/painel/TarefaForm.tsx:82]
- **Ordem das tabs (TabOrderSettings)** — Funcional, mas grava em localStorage (key "painel.tabOrder"), NÃO no Mongo — per-dispositivo, e a copy da página é honesta sobre isso ("Guardado no dispositivo actual"). Botões cima/baixo e "Repor ordem inicial" têm handlers reais (writeTabOrder/clearTabOrder). A alteração dispara o evento "painel:tabOrderChanged" que é escutado e aplicado por 3 consumidores reais: Sidebar.tsx:53, BottomNav.tsx:27 e MobileMenuButton.tsx:37 — a reordenação tem efeito imediato na navegação. [src/components/painel/TabOrderSettings.tsx; src/lib/painel-nav.ts:43-95; src/components/painel/Sidebar.tsx:51-56; src/components/painel/BottomNav.tsx:25-30; src/components/painel/MobileMenuButton.tsx:35-40]
- **Ordem das colunas Kanban (KanbanOrderSettings)** — Funcional, localStorage (key "painel.kanban.columnOrder"), NÃO Mongo — per-dispositivo, copy honesta. Handlers reais (writeKanbanOrder, reset com removeItem). Consumido de facto: KanbanBoard.tsx:42 lê readKanbanOrder() no mount da vista Kanban de projectos. readKanbanOrder tolera colunas novas adicionadas depois (merge com defaults). Nota: KanbanBoard só lê no mount — mudanças aplicam-se ao navegar para a página, não em live (irrelevante na prática porque são páginas diferentes). [src/components/painel/KanbanOrderSettings.tsx:16-36; src/components/painel/KanbanBoard.tsx:8,42]

### DORMENTE
- (nenhum)

### DECORATIVO/MORTO

- **Highlight "active" da nav lateral de secções** — page.tsx:40 — className={i === 0 ? "active" : undefined}: a classe active está hardcoded no primeiro item ("Perfil · empresa") e nunca muda. Os links de âncora (#perfil, #aparencia, #aparencia-kanban, #tipos) funcionam como fragment links (fazem scroll), mas não há scrollspy nem handler — o highlight é puramente decorativo e fica sempre no primeiro item mesmo quando se navega para outra secção. CSS .def-nav a.active existe em painel.css:978. [src/app/(painel)/painel/definicoes/page.tsx:36-46 (linha 40); src/app/(painel)/painel.css:978]
- **Copy da Topbar menciona "integrações" inexistentes** — page.tsx:30 — description="Configuração do painel, integrações e perfil da empresa." Não existe nenhuma secção de integrações na página (nem Turnstile, nem Upstash, nem VAPID, nem nada). Resto de copy aspiracional/versão anterior. [src/app/(painel)/painel/definicoes/page.tsx:30]
- **GET /api/settings — endpoint sem consumidor** — O handler GET existe (route.ts:39-42) mas nenhum cliente o chama: a única referência a "/api/settings" no código é o PUT do CompanyProfileForm (o pré-preenchimento do form é feito server-side pelo loader). Rota morta mas inofensiva (protegida por withAuth). [src/app/api/settings/route.ts:39-42]
- **Secção de password — NÃO existe (por design)** — A zona foi auditada à procura de gestão de password: não há nenhuma UI de mudança de password nas Definições. A password de login é uma env var na Vercel (AUTH_PASSWORD_HASH bcrypt, fallback AUTH_PASSWORD texto simples com aviso — src/lib/auth.ts:94-110), portanto não é alterável via painel. Não é código morto, é uma ausência: reporto para responder à pergunta do brief. [src/lib/auth.ts:94-110]

### Observações

- Não há nada DORMENTE nesta zona: nenhuma secção das Definições depende de env vars por configurar (Turnstile/VAPID/Upstash não aparecem aqui).
- Divisão de storage confirmada: Perfil da empresa e Tipos custom → Mongo (coleções `settings` e `projeto_tipos_custom`); Ordem de tabs e ordem Kanban → localStorage (keys "painel.tabOrder" e "painel.kanban.columnOrder"). As duas mutações Mongo passam por logMutation (auditoria) e revalidatePath.
- Hardcoded values encontrados (benignos): fallback do logo "/logo-mark.png" em CompanyProfileForm.tsx:76 (ficheiro existe em public/), fallback do nome de preview "RedDune Solutions" em CompanyProfileForm.tsx:111 (só display), e KANBAN_DEFAULT_COLUMNS em KanbanOrderSettings.tsx:8-14 (defaults legítimos).
- O único hardcoded problemático é o active da nav de secções (page.tsx:40, i === 0).
- Comentário no próprio código da página (linha 64: "Aparência — definições reais funcionais") sugere que secções decorativas anteriores já foram limpas — a página actual está quase toda ligada.

### RECOMENDAÇÕES

- [MANTER] **Perfil da empresa** — CRUD sólido com auditoria, mas hoje é write-only: nenhum consumidor usa nome/NIF/morada/logo. No redesign, ou liga-se a um consumidor real (cabeçalho do portal do cliente /p/[token], futuros documentos/propostas — nota: facturação é manual fora do painel, portanto NIF/morada só têm valor se alimentarem documentos) ou aceita-se como ficha de referência. Melhoria concreta: trocar o campo "colar URL do logo" por upload directo para Vercel Blob (BLOB_READ_WRITE_TOKEN já existe em produção e o painel já usa Blob noutros sítios).
- [MANTER] **Ordem das tabs + ordem Kanban** — Funcionais e honestas ("guardado no dispositivo actual"). São as únicas definições em localStorage — no redesign, agrupar as duas numa só secção "Aparência" com nota clara de que não sincronizam entre dispositivos. Migrar para Mongo só se o dono usar múltiplos dispositivos e sentir a falta; utilizador único torna isso opcional.
- [MANTER] **Tipos de projecto personalizados** — Único item das Definições com efeito noutra página verificado (TarefaForm). Nota de duplicação: o TarefaForm tem o seu próprio mini-editor de tipos inline (criar/apagar) — no redesign decidir se a gestão vive nas Definições, no form, ou nos dois de forma consistente.
- [ALTERAR] **Highlight active da nav de secções** — Ou implementar scrollspy real (IntersectionObserver / hashchange) ou remover a classe active estática — um highlight que mente é pior do que nenhum. Com só 4 secções curtas, remover é a opção barata.
- [ALTERAR] **Descrição da Topbar ("integrações")** — Remover a palavra "integrações" da description (page.tsx:30) até existir uma secção de integrações. Alternativa para o redesign: criar uma secção read-only de estado das integrações (Turnstile: sem chaves, Web Push/VAPID: não configurado, Upstash: fallback MongoDB, Blob: activo) — dava visibilidade real ao que hoje só vive na cabeça do dono e no CLAUDE.md.
- [REMOVER] **GET /api/settings** — Sem consumidor; o form é pré-preenchido server-side. Remover reduz superfície de API, ou manter deliberadamente se o portal/documentos vierem a precisar do perfil via fetch — decidir junto com a recomendação do Perfil da empresa.
- [MANTER] **Gestão de password no painel** — Manter como está (ausente): utilizador único com password em env var na Vercel. Uma UI de mudança de password exigiria mover a credencial para o Mongo — complexidade sem ganho real nesta fase. Se o redesign quiser mostrar algo, um cartão informativo "password gerida na Vercel (AUTH_PASSWORD_HASH)" chega. Ponto de segurança lateral: o fallback AUTH_PASSWORD em texto simples ainda é suportado em auth.ts — confirmar que produção usa AUTH_PASSWORD_HASH.


## Shell do painel — layout (painel), Sidebar, Topbar, BottomNav, NotificationsBell, PWA (manifest + service worker)

### LIGADO

- **Auth gate do layout do painel** — auth() da NextAuth; sem sessão faz redirect para /entrar?from=/painel. Também corre ensureIndexes() (idempotente) em cada request do painel. [src/app/(painel)/layout.tsx:81-87; src/lib/auth.ts; src/lib/mongodb/init-indexes.ts]
- **Counts da sidebar (Tarefas / Projectos / Dívidas)** — 100% reais do Mongo. getSidebarCounts (layout.tsx:38-74) lê getProjetosResumo (projetos.ts:40), getAllTarefas (tarefas.ts:16) e getAllPagamentos (pagamentos.ts:25). Tarefas = não feitas de projectos visíveis; Projectos = isProjetoAtivo; Dívidas = projectos terminados com pago < valorEstimado. Cache unstable_cache de 20s — badges podem atrasar até 20s. Passados a Sidebar E BottomNav; só renderizam quando >0. [src/app/(painel)/layout.tsx:38-74,90,102,105; src/components/painel/Sidebar.tsx:83,98-100; src/components/painel/BottomNav.tsx:50,59]
- **Navegação da Sidebar (14 entradas, 2 secções)** — Todos os 14 hrefs de PAINEL_NAV_DEFAULT (painel-nav.ts:26-41) têm página real em src/app/(painel)/painel/** — verificado 1 a 1 (visão geral, tarefas, projetos, clientes, leads, procurar, dividas, calendario, relatorios, precos, loja, portfolio, auditoria, definicoes). Estado active por pathname, spinner de pending por href, ordem custom de tabs via localStorage (painel.tabOrder) com evento TAB_ORDER_EVENT — sincroniza Sidebar e BottomNav em tempo real. [src/lib/painel-nav.ts:26-95; src/components/painel/Sidebar.tsx:45-103]
- **Collapse da sidebar** — Botão funcional; persiste em localStorage (painel.sidebar.collapsed), largura 72/248px, tooltips por title quando colapsada. [src/components/painel/Sidebar.tsx:23,47-49,65-69,108]
- **SignOutButton (rodapé da sidebar)** — Form com server action real signOutAction (auth-actions.ts:41). Avatar/nome/email vêm da sessão NextAuth real passada pelo layout. [src/components/auth/SignOutButton.tsx:17; src/lib/auth-actions.ts:41; src/components/painel/Sidebar.tsx:162-171]
- **BottomNav (mobile)** — Mesma fonte de nav + counts que a sidebar; scroll-x com tab activa centrada via scrollIntoView; aria-current. Tudo funcional, sem placeholders. [src/components/painel/BottomNav.tsx]
- **Topbar + GlobalSearch** — Topbar é server component de apresentação (crumbs/título/acções injectadas por página). GlobalSearch submete para /painel/procurar?q= — página existe e pesquisa projectos+clientes+tarefas no Mongo; atalho Cmd/Ctrl+K funcional (GlobalSearch.tsx:22-31). [src/components/painel/Topbar.tsx; src/components/painel/GlobalSearch.tsx:33-39; src/app/(painel)/painel/procurar/page.tsx]
- **NotificationsBell + GET /api/notifications** — Sino live: fetch no mount + polling 60s (NotificationsBell.tsx:28,59-63) a /api/notifications, rota existe e é withAuth + force-dynamic + no-store. Badge unread = countLeadsNovos() + countComentariosNaoLidos() (route.ts:82-90) — dados reais do Mongo (leads.ts:73, portal.ts:64). Feed funde leads novos + audit_log + comentários do portal com títulos de projecto resolvidos (getProjetoTitulosByIds, projetos.ts:62), ordena por timestamp, corta a 12. Cada item tem href real (/painel/leads, /painel/projetos/[id], /painel/clientes/[id], /painel/auditoria). Só leitura; o unread limpa por fluxos externos que existem: mudar estado do lead e POST /api/projetos/comentarios → marcarComentarioLido (portal.ts:49). [src/components/painel/NotificationsBell.tsx; src/app/api/notifications/route.ts; src/lib/mongodb/leads.ts:73-95; src/lib/mongodb/portal.ts:49-85; src/lib/mongodb/mutation-audit.ts:73]
- **PWA: manifest + registo do service worker + caching** — manifest.ts serve /manifest.webmanifest com start_url /painel; os 3 ícones referidos existem em public/icons/. ServiceWorkerRegister está montado no root layout (src/app/layout.tsx:104), regista /sw.js só em produção. A parte de caching do sw.js está ligada e é sensata: nunca cacheia /api nem /painel (sw.js:70-72), cache-first para estáticos, network-first para páginas públicas. PWA instalável hoje. [src/app/manifest.ts; src/components/ServiceWorkerRegister.tsx; src/app/layout.tsx:104; public/sw.js:62-104; public/icons/]

### DORMENTE

- **Handlers de Web Push no service worker (push + notificationclick)** (precisa: NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (par VAPID) na Vercel) — sw.js:25-60 tem os listeners completos de push e notificationclick (mostra notificação, foca/abre janela, default /painel/leads), mas nunca disparam porque não há subscrição: PushOptIn.tsx:6,29-38 devolve estado 'unsupported' e não renderiza nada sem NEXT_PUBLIC_VAPID_PUBLIC_KEY, e o servidor nunca envia push sem a chave privada. Degrada graciosamente — zero erro visível. Código pronto; falta só o par de chaves. [public/sw.js:25-60; src/components/painel/PushOptIn.tsx:6,25-47]
- **Tag de cache 'painel-counts' dos counts da sidebar** (precisa: Chamada a revalidateTag("painel-counts") nas mutações de tarefas/projectos/pagamentos (integração interna, não env)) — A tag é declarada em layout.tsx:73 mas nenhum código do repo chama revalidateTag com ela (grep: única ocorrência é a declaração). Na prática só funciona o revalidate temporal de 20s — a tag é infra-estrutura preparada mas nunca usada. [src/app/(painel)/layout.tsx:73]

### DECORATIVO/MORTO

- **MobileMenuButton.tsx — componente morto** — Definido em src/components/painel/MobileMenuButton.tsx:29 e nunca importado em lado nenhum (grep em src/: única ocorrência é a própria definição). Era o drawer mobile antigo, substituído pela BottomNav (o próprio comentário da BottomNav.tsx:16-18 diz 'Substitui o drawer no telemóvel'). [src/components/painel/MobileMenuButton.tsx]
- **Rótulo hardcoded 'Painel · 2026' no logo da sidebar** — String fixa no JSX (Sidebar.tsx:116, <small>Painel · 2026</small>). Ano vai ficar errado em 2027; puramente decorativo. [src/components/painel/Sidebar.tsx:116]
- **Hint '⌘K' hardcoded na GlobalSearch** — GlobalSearch.tsx:56 mostra sempre '⌘K' mesmo em Windows/Linux (onde o atalho real é Ctrl+K — o handler aceita ambos em :24). Cosmético/enganador em não-Mac. [src/components/painel/GlobalSearch.tsx:24,56]
- **Cores fallback hardcoded no badge/ícones do sino** — NotificationsBell.tsx:96,101,142-148 usa fallbacks literais nos var() — '#d6422a', '#f7eedb', '#efe3cd', '#8a7a63' e rgba(214,66,42,0.12) inline. Não é bug (são fallbacks de CSS vars), mas é styling inline duplicado do design system — relevante para o redesign. [src/components/painel/NotificationsBell.tsx:96,101,142-148]

### Observações

- Tudo no shell foi verificado ponta-a-ponta: cada href da nav tem página real, cada loader Mongo citado existe (getProjetosResumo projetos.ts:40, getAllTarefas tarefas.ts:16, getAllPagamentos pagamentos.ts:25, countLeadsNovos leads.ts:73, countComentariosNaoLidos portal.ts:64, getRecentAuditEntries mutation-audit.ts:73, getProjetoTitulosByIds projetos.ts:62), e /api/notifications existe e está protegida por withAuth.
- Não há NENHUM valor fake/placeholder no shell — o único número apresentado (badges) vem do Mongo. O estado vazio do sino é honesto ('Sem novidades').
- O polling do sino é 60s e os counts da sidebar têm cache de 20s + só refrescam em navegação server (são props do layout) — num redesign 'live', considerar unificar: os badges da sidebar podiam vir do mesmo payload de /api/notifications para actualizarem sem navegar.
- O sino do portal (comentários) marca-se lido via POST /api/projetos/comentarios chamado na página do projecto (PortalSection) — fluxo fora desta zona mas confirmado existente, portanto o unread do badge efectivamente decresce.
- ServiceWorkerRegister está no root layout, logo o sw.js aplica-se ao site público E ao painel; o painel em si nunca é cacheado (sw.js:70-72), decisão correcta que o redesign deve preservar.
- A ordem custom das tabs (TabOrderSettings em /painel/definicoes) vive em localStorage por browser — não sincroniza entre dispositivos; aceitável para utilizador único, mas é bom saber para o redesign.

### RECOMENDAÇÕES

- [MANTER] **Counts da sidebar (Tarefas/Projectos/Dívidas)** — São dados reais, coerentes com os títulos das páginas respectivas, e já optimizados com cache de 20s. No redesign preservar a semântica exacta (mesmos filtros que as páginas) para os badges continuarem a bater certo.
- [MANTER] **NotificationsBell + /api/notifications** — Feed derivado, read-only, com badge accionável (leads novos + comentários do portal por ler) e hrefs reais. É das partes mais 'vivas' do shell. Única melhoria possível: marcar comentário como lido ao clicar no item do sino, em vez de depender da página do projecto.
- [REMOVER] **MobileMenuButton.tsx** — Componente órfão, nunca importado; substituído pela BottomNav. Peso morto no bundle mental e na árvore de componentes do redesign.
- [ALTERAR] **'Painel · 2026' na sidebar** — Trocar por texto sem ano ou por new Date().getFullYear() — evita ficar obsoleto em Janeiro.
- [ALTERAR] **Hint '⌘K' da GlobalSearch** — Detectar plataforma (navigator.platform/userAgentData) e mostrar 'Ctrl K' fora de macOS — detalhe barato que evita confusão.
- [ALTERAR] **Tag 'painel-counts' do unstable_cache** — Ou passar a chamar revalidateTag nas server actions/rotas que criam/editam tarefas, projectos e pagamentos (badges instantâneos), ou remover a tag para não sugerir um mecanismo que não existe.
- [MANTER] **Handlers de push no sw.js + PushOptIn** — Código completo e com degradação graciosa; activa-se apenas gerando o par VAPID na Vercel quando quiserem push. Não remover no redesign — é a única via de notificação fora do painel.
- [MANTER] **PWA (manifest + sw caching)** — Instalável, ícones existem, política de cache correcta (nunca cacheia /api nem /painel). Se o redesign mudar cores, actualizar theme_color/background_color no manifest.ts (hoje #d6422a/#f7eedb) e considerar bump do nome de cache 'reddune-v1' no sw.js para invalidar estáticos antigos.
- [MANTER] **Topbar (titleHtml com dangerouslySetInnerHTML)** — Só recebe strings internas das páginas (accent <em>), não input de utilizador — risco nulo no contexto actual. No redesign, preferir passar ReactNode em vez de HTML string se for reescrita.


## Superfície API (src/app/api/**) + middleware + dormentes transversais (Turnstile, Upstash, VAPID/push, Resend)

### LIGADO

- **/api/auth/[...nextauth] (GET/POST)** — Handlers NextAuth reexportados de lib/auth; usados pelo login em /entrar e polling de sessão. Middleware aplica rate-limit 10/min ao callback de credenciais. [src/app/api/auth/[...nextauth]/route.ts; middleware.ts:68-83]
- **/api/sendEmail (POST, público por design)** — Formulário de contacto do site. Sem auth (correcto): honeypot + rateLimitDistributed 5/10min + blocklist de IP + Turnstile opcional. Grava lead no Mongo (createLead) e tenta push. Caller: ContactForm.tsx:75. [src/app/api/sendEmail/route.ts; src/components/sections/ContactForm.tsx:75]
- **/api/notifications (GET, withAuth)** — Feed derivado 100% de dados reais do Mongo (leads novos + audit_log + comentários portal não lidos). Poll de 60s pelo NotificationsBell. Só leitura, sem escrita. [src/app/api/notifications/route.ts; src/components/painel/NotificationsBell.tsx:55]
- **/api/leads/[id] (PATCH/DELETE, withAuth) + /api/leads/[id]/convert (POST, withAuth)** — CRUD de leads + conversão em cliente. Callers: LeadsTable.tsx:94 (PATCH estado), :132 (DELETE), :144 (convert). [src/app/api/leads/[id]/route.ts; src/app/api/leads/[id]/convert/route.ts; src/components/painel/LeadsTable.tsx]
- **/api/blocked-ips (POST action=block, withAuth)** — Bloqueio de IP de spam a partir da tabela de leads. Caller: BlockIpButton.tsx:27. Grava em Mongo blocked_ips + audit. [src/app/api/blocked-ips/route.ts:28; src/components/painel/BlockIpButton.tsx:27]
- **/api/projetos/upsert, /api/projetos/edit, /api/projetos/[id] DELETE (auth inline)** — CRUD de projectos. Callers: upsert — CustosCard:74, HardwareSection:50, NotasContextoCard:105, PagamentosSection:98, TarefaForm:179; edit — InlineStatusSelect:67, EditTarefaActions:44; DELETE — TarefaRowMenu.tsx:40 (apaga projecto + blobs de arquivos/sandboxes). [src/app/api/projetos/upsert/route.ts; src/app/api/projetos/edit/route.ts; src/app/api/projetos/[id]/route.ts]
- **/api/projetos/arquivo (POST) + /api/projetos/arquivo/[id] (GET/DELETE, auth inline)** — Upload de ficheiros de projecto para Vercel Blob (BLOB_READ_WRITE_TOKEN existe em prod ⇒ funcional). O POST devolve url /api/projetos/arquivo/{id} que a UI guarda: GET usado como href de download (ArquivosUploadZone:240), DELETE via safeFetch (ArquivosUploadZone:139). [src/app/api/projetos/arquivo/route.ts:123; src/components/painel/ArquivosUploadZone.tsx:88,139,240]
- **/api/projetos/portal, /links, /sandbox, /sandbox/[id], /comentarios (auth inline)** — Lado admin do portal do cliente: gerar/revogar link secreto (PortalSection:48,70), gerir links (:89,106), criar sandbox multi-ficheiro (:125), apagar sandbox (:147), marcar comentários como lidos (:156). Tudo com session check e audit. [src/app/api/projetos/portal/route.ts; src/app/api/projetos/links/route.ts; src/app/api/projetos/sandbox/route.ts; src/app/api/projetos/sandbox/[id]/route.ts; src/app/api/projetos/comentarios/route.ts; src/components/painel/PortalSection.tsx]
- **/api/portal/cliente (PATCH), /api/portal/comentario (POST) — auth por token de portal** — Lado cliente do portal: resolvePortalToken(body.t) em vez de sessão (correcto para /p/[token]). Ficha com whitelist Zod + protecção de oráculo RGPD em colisão 11000; comentário com honeypot + rate-limit IP + tecto 50/24h por projecto. Callers: FichaClienteForm.tsx:39, ComentarioForm.tsx:24. [src/app/api/portal/cliente/route.ts; src/app/api/portal/comentario/route.ts]
- **/api/portal/arquivo/[id] (GET) e /api/portal/sandbox/[id]/[...path] (GET) — auth por token/capability** — Proxies de blobs para o portal. Arquivo: token ?t= + CSP sandbox para HTML. Sandbox: capability id + verificação de portal activo/não revogado, só serve paths do manifest (sem traversal), CSP sandbox em todas as respostas. Callers: p/[token]/page.tsx:48,51 e preview admin PortalSection:274. [src/app/api/portal/arquivo/[id]/route.ts; src/app/api/portal/sandbox/[id]/[...path]/route.ts; src/app/p/[token]/page.tsx:48,51]
- **/api/tarefas/upsert, /edit, /[id] DELETE, /from-template (auth inline)** — CRUD de tarefas. Callers: NovaTarefaGlobalButton:70, QuickTarefaModal:68, TarefaChecklist:60,79,105,121, TarefasPorProjeto:126,152, TarefaForm:188. [src/app/api/tarefas/upsert/route.ts; src/app/api/tarefas/edit/route.ts; src/app/api/tarefas/[id]/route.ts; src/app/api/tarefas/from-template/route.ts]
- **/api/tarefa-templates (GET) + /upsert + /[id] DELETE (auth inline)** — Templates de tarefas. Callers: TarefaForm:81 (GET), TemplatesEditor:155 (upsert), :180 (DELETE). [src/app/api/tarefa-templates/route.ts; src/app/api/tarefa-templates/upsert/route.ts; src/app/api/tarefa-templates/[id]/route.ts]
- **/api/projeto-tipos-custom (GET) + /upsert + /[id] DELETE (auth inline)** — Tipos de projecto custom. Callers: TarefaForm:82,109,126 e ProjetoTiposCustomEditor:60,83. [src/app/api/projeto-tipos-custom/**]
- **/api/clientes/upsert (POST, withAuth)** — Criar/editar cliente. Callers: ClienteForm.tsx:38, ClienteQuickForm.tsx:30. [src/app/api/clientes/upsert/route.ts]
- **/api/pagamentos/upsert (POST) + /api/pagamentos/[id] (DELETE) (auth inline)** — Pagamentos por projecto. Callers: PagamentosSection:74,127 (upsert), :153 (DELETE). [src/app/api/pagamentos/upsert/route.ts; src/app/api/pagamentos/[id]/route.ts]
- **/api/products/upsert + /api/products/[id] DELETE; /api/portfolio/upsert + /api/portfolio/[id] DELETE; /api/servicos/upsert + /api/servicos/[id] DELETE (auth inline)** — CRUD do conteúdo público (loja, portfólio, serviços). Callers: ProductForm:65, LojaClient:62, PortfolioForm:78, PortfolioClient:66, ServicosEditor:263,288. [src/app/api/{products,portfolio,servicos}/**]
- **/api/upload/product-image (POST, auth inline)** — Upload de imagens de produto/portfólio para Vercel Blob. Caller: ImageUploadZone.tsx:90. Funcional (BLOB_READ_WRITE_TOKEN em prod). [src/app/api/upload/product-image/route.ts; src/components/painel/ImageUploadZone.tsx:90]
- **/api/settings (PUT, withAuth)** — Guardar perfil da empresa. Caller: CompanyProfileForm.tsx:49 (método PUT). O GET da mesma rota não tem caller (ver mortos). [src/app/api/settings/route.ts:44]
- **middleware.ts (Edge)** — Ligado e efectivo: redirect de /painel sem sessão para /entrar; rate-limit global /api 200/min e login 10/min; leitura de IP anti-spoof (x-real-ip primeiro). Fallback do limiter: Upstash (dormente) -> memória por instância — funcional mas não partilhado entre instâncias. [middleware.ts]

### DORMENTE

- **Web Push (rotas /api/push/subscribe e /api/push/unsubscribe + lib/push.ts + public/sw.js)** (precisa: NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (VAPID_SUBJECT opcional, default mailto:reddunesolutions@gmail.com)) — Código completo e correcto (withAuth, limpeza de subscrições 404/410), mas em prod é inerte de ponta a ponta: PushOptIn.tsx devolve null sem NEXT_PUBLIC_VAPID_PUBLIC_KEY (linha 6/30) ⇒ ninguém consegue subscrever ⇒ as duas rotas nunca são chamadas; sendPushToAll faz no-op silencioso sem chaves (push.ts:16). Afecta 4 notificações já escritas: novo lead (sendEmail:115), comentário no portal (portal/comentario:74), ficha de cliente alterada (portal/cliente:70). [src/app/api/push/subscribe/route.ts; src/app/api/push/unsubscribe/route.ts; src/lib/push.ts:9-16; src/components/painel/PushOptIn.tsx:6,30]
- **Cloudflare Turnstile (CAPTCHA do formulário de contacto)** (precisa: TURNSTILE_SECRET_KEY (servidor) + NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget)) — Dormente por design (CLAUDE.md confirma). verifyTurnstile devolve true sem secret (turnstile.ts:17); o componente Turnstile não renderiza e reporta token vazio sem site key (Turnstile.tsx:28,61). O sendEmail já chama verifyTurnstile — activa-se só com as chaves, sem alterações de código. [src/lib/turnstile.ts:17; src/components/Turnstile.tsx:28,61; src/app/api/sendEmail/route.ts:71]
- **Upstash Redis (rate-limit distribuído)** (precisa: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) — redisRateLimit devolve null sem as env vars (rate-limit-redis.ts:22). Nas rotas Node cai para MongoDB (rate-limit-mongo.ts — funcional, partilhado, ok por defeito); no middleware Edge cai para Map em memória por instância (limite não partilhado entre instâncias serverless — funciona, mas é poroso sob escala). Confirmado exactamente como descrito no CLAUDE.md. [src/lib/rate-limit-redis.ts:8-22; src/lib/rate-limit.ts:44-55; src/lib/rate-limit-mongo.ts; middleware.ts:40-45]

### DECORATIVO/MORTO

- **GET /api/projetos — rota órfã** — Devolve getAllProjetos() com auth, mas nenhum componente a chama (único hit no src é o console.error da própria rota, linha 16). As páginas do painel leem o Mongo por loaders server-side. [src/app/api/projetos/route.ts:7]
- **GET /api/tarefas (incl. ?projetoId=) — rota órfã** — Sem caller em todo o src (só o console.error interno, linha 21). [src/app/api/tarefas/route.ts:7]
- **GET /api/clientes — rota órfã** — Sem caller (só console.error interno, linha 11). [src/app/api/clientes/route.ts:6]
- **GET /api/portfolio — rota órfã** — Sem caller; PortfolioClient só usa DELETE /api/portfolio/[id]. [src/app/api/portfolio/route.ts:7]
- **GET /api/servicos (incl. ?slug=) — rota órfã** — Sem caller; ServicosEditor só usa upsert e DELETE. O site público lê serviços por loader server-side. [src/app/api/servicos/route.ts:8]
- **GET /api/products — rota órfã** — Sem caller; LojaClient só usa DELETE /api/products/[id]. [src/app/api/products/route.ts:7]
- **GET /api/settings — handler órfão** — Só o PUT é chamado (CompanyProfileForm:49-50); o formulário recebe os dados iniciais por server component. GET nunca é invocado. [src/app/api/settings/route.ts:39]
- **GET /api/blocked-ips — handler órfão** — Devolve a lista de IPs bloqueados, mas não existe nenhum ecrã de gestão da blocklist; BlockIpButton só faz POST. [src/app/api/blocked-ips/route.ts:24]
- **POST /api/blocked-ips action="unblock" — branch inalcançável do UI** — O schema aceita action block|unblock, mas o único caller (BlockIpButton.tsx:30) envia sempre "block". Depois de bloquear um IP não há forma no painel de o desbloquear — só mexendo directo no Mongo/curl. [src/app/api/blocked-ips/route.ts:34; src/components/painel/BlockIpButton.tsx:30]
- **DELETE /api/clientes/[id] — rota órfã** — Rota completa (withAuth, audit), mas nenhum componente constrói /api/clientes/{id}: não existe botão de apagar cliente no painel. [src/app/api/clientes/[id]/route.ts:8]
- **POST /api/upload/product-image/delete — rota órfã** — Apaga um blob por URL, com auth, mas sem nenhum caller (ImageUploadZone só faz o upload; a limpeza de blobs acontece server-side nos upserts/deletes). [src/app/api/upload/product-image/delete/route.ts:11]
- **Resend — confirmado removido (não é código morto residual)** — Zero imports, zero dependência no package.json (só web-push existe). Menções restantes são apenas documentais: PLANO-MELHORIAS.md:404 e docs/superpowers/specs/2026-07-03-portal-cliente-design.md:23. [package.json]

### Observações

- Cobertura: 52 route.ts inventariados em src/app/api/**. Todas as rotas do painel têm auth (withAuth de lib/api.ts ou check inline de session) — não encontrei nenhuma rota admin sem auth. As 4 rotas /api/portal/* usam auth por token de portal (resolvePortalToken) ou capability id, que é o desenho correcto para /p/[token]; /api/sendEmail é pública por design.
- Padrão de auth inconsistente mas não perigoso: ~10 rotas usam o wrapper withAuth, o resto repete o check inline (const session = await auth()). O comentário em lib/api.ts diz que o wrapper existe para 'tornar impossível esquecer o check' — a migração ficou a meio. Oportunidade de limpeza no redesign, não é bug.
- O sino de notificações (/api/notifications) é SÓ leitura por desenho — não há 'marcar como lido' para leads/audit; comentários do portal são marcados lidos via /api/projetos/comentarios (PortalSection). Coerente, mas convém o redesign não desenhar um 'mark all read' que não existe no backend.
- Nenhum valor hardcoded/fake encontrado nesta zona: todos os números devolvidos pelas rotas vêm de loaders Mongo (src/lib/mongodb/*). Os únicos literais são limites de rate (sendEmail 5/10min, portal-comentario 10/10min + tecto 50/24h, portal-arquivo 60/min, sandbox 600/min, middleware 200/min e login 10/min) — intencionais.
- Confirmação dos 4 dormentes pedidos: Turnstile = skip sem TURNSTILE_SECRET_KEY (lib/turnstile.ts:17); Upstash = null sem env (lib/rate-limit-redis.ts:22, fallback Mongo em Node / memória no Edge); VAPID = no-op em lib/push.ts:16 e UI escondida em PushOptIn.tsx:30; Resend = totalmente removido (sem dependência nem imports, só menções em docs).

### RECOMENDAÇÕES

- [ALTERAR] **Web Push / VAPID** — É a dormente com melhor custo-benefício: 2 env vars (npx web-push generate-vapid-keys) ligam 4 notificações já escritas e testadas (leads, comentários e edições de ficha do portal). Sem elas, o portal recém-lançado gera eventos que ninguém vê em tempo real — só o sino com poll de 60s quando o painel está aberto.
- [MANTER] **Turnstile** — Dormente por design (decisão registada no CLAUDE.md); honeypot + rate-limit + blocklist cobrem o abuso actual. Activa-se só com chaves, sem código novo.
- [MANTER] **Upstash** — Fallback MongoDB cobre as rotas Node; o único ponto fraco é o limiter em memória do middleware Edge, aceitável para o tráfego actual. Ligar Upstash só se aparecer abuso real de login.
- [REMOVER] **GETs órfãos de colecção (/api/projetos, /api/tarefas, /api/clientes, /api/portfolio, /api/servicos, /api/products, GET /api/settings)** — 7 handlers autenticados mas nunca chamados — superfície morta que confunde o redesign. Se o redesign no Claude Design vier a precisar de data-fetching client-side (SWR/refresh), reintroduzir só os necessários nessa altura; hoje tudo é server-loaded.
- [ALTERAR] **DELETE /api/clientes/[id]** — Decidir: ou adicionar o botão 'Apagar cliente' no painel (a rota já está pronta, com audit), ou remover a rota. Ter delete de PII acessível por API sem UI correspondente é meio caminho andado para inconsistência.
- [ALTERAR] **Blocklist de IPs (GET /api/blocked-ips + action unblock)** — Hoje bloquear um IP é irreversível pelo UI. No redesign, um mini-ecrã 'IPs bloqueados' em definições (lista + desbloquear) usa os dois handlers órfãos que já existem — ou, se não interessar, remover GET e o branch unblock.
- [REMOVER] **POST /api/upload/product-image/delete** — Sem caller e a limpeza de blobs já acontece server-side nos upserts/deletes; rota redundante.
- [MANTER] **middleware.ts** — Está correcto e activo: protege /painel, trava brute-force no login e limita /api globalmente, com leitura de IP resistente a spoof.
- [MANTER] **Rotas do portal (/api/portal/*)** — Modelo de auth por token/capability está bem desenhado (revogação corta acesso, CSP sandbox nos blobs, whitelist Zod na ficha, protecção de oráculo RGPD). Não mexer no redesign além de estética.
