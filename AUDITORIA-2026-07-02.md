# Auditoria RedDune Website + Painel — 2026-07-02

> Auditoria multi-agente (6 dimensões: segurança, bugs, backend, site público, painel UX, deps/config) com verificação adversarial de cada achado contra o código real e produção ao vivo. Base: commit `d50ab06`, `main`, em produção em www.reddunesolutions.pt.
>
> **45 achados brutos → 44 confirmados, 1 refutado.** Exclui o já conhecido/decidido (ENVs dormentes Blob/VAPID/Upstash/Turnstile, CSP report-only pendente de teste, itens adiados no `PLANO-MELHORIAS.md`).

## Contagem por severidade
- **P0** (1): SEO de produção aponta para domínio morto.
- **P1** (3): brute-force login contornável · `createdAt` reescrito em edições · pesquisa global inacessível em mobile.
- **P2** (21): backend/dados, i18n/SEO, perf loja, painel UX, deps.
- **P3** (19): higiene, consistência, cosmético.

---

## 🔴 P0 — Corrigir já

### [P0-1] Todo o SEO de produção aponta para domínio inexistente `reddune.solutions`
`src/lib/env.ts:3`
- **Facto:** `baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "https://reddune.solutions"`. `NEXT_PUBLIC_BASE_URL` **não está definido no ambiente Production da Vercel** → usa o fallback. `nslookup reddune.solutions` = **NXDOMAIN** (domínio nem resolve DNS).
- **Verificado ao vivo (2026-07-02):** `robots.txt` serve `Host: https://reddune.solutions` + `Sitemap: https://reddune.solutions/sitemap.xml`; todos os `<loc>` do sitemap apontam para `reddune.solutions`; a homepage serve `<link rel="canonical" href="https://reddune.solutions"/>` e `og:url` igual. O `baseUrl` alimenta `metadataBase` (`layout.tsx:59`), canonicals de todas as páginas, `sitemap.ts`, `robots.ts` e o JSON-LD (`structured-data.ts:15`).
- **Impacto:** cada página declara ao Google que a versão canónica vive num domínio morto. Anula/degrada a indexação de www.reddunesolutions.pt (canonical para host inalcançável = sinal fortíssimo de conteúdo errado), sitemap submetido lista URLs com erro de DNS, rich results do LocalBusiness perdidos.
- **Fix:** (1) definir `NEXT_PUBLIC_BASE_URL=https://www.reddunesolutions.pt` em Production na Vercel + **redeploy**; (2) mudar o fallback em `env.ts:3` para `https://www.reddunesolutions.pt` (para o default nunca voltar a apontar para o domínio morto); (3) revalidar sitemap + inspeção de URL no Google Search Console.

---

## 🟠 P1 — Bug real que afeta utilizador

### [P1-1] Brute-force do login é contornável — o form real não passa pelo rate limit
`src/lib/auth-actions.ts:14`
- **Facto:** o form de `/entrar` (`EmailSignInForm.tsx:36`) chama a server action `signInAction`, que invoca `signIn("credentials")` **in-process**. O POST do server action vai para `/entrar`, que **não** está no matcher do middleware (`middleware.ts:107-109`: `["/painel/:path*","/api/:path*"]`). O limite 10/min só cobre `/api/auth/callback/credentials` — caminho que o site real nunca usa. `authorize()` (`auth.ts:42`) não tem qualquer throttle.
- **Impacto:** brute-force **ilimitado** contra a única password de admin em produção. A proteção documentada como "feita" está efetivamente desativada para o caminho de login real; único travão = força da password (+ allowlist de email + compare timing-safe).
- **Fix:** mover o rate limit para dentro de `authorize()` (corre em Node → pode usar `rateLimitDistributed` com IP via `headers()`), cobrindo ambos os caminhos. Alternativa mais fraca: acrescentar `/entrar` ao matcher e limitar POSTs.

### [P1-2] Editar um produto reinicia o `createdAt` — produto editado salta para o topo da loja
`src/lib/mongodb/products.ts:124`
- **Facto:** `upsertProduct` faz `createdAt: input.createdAt ? new Date(input.createdAt) : new Date()` e no update faz `$set` do doc **completo** (`:128`). A rota `products/upsert/route.ts` nunca passa `createdAt` e o schema (`validation-product.ts`) nem tem o campo → **toda a edição grava `createdAt = agora`**. A loja e o painel ordenam por `{ featured:-1, createdAt:-1 }`.
- **Impacto:** corrupção silenciosa e irreversível da data de criação. Corrigir um preço/typo faz o produto aparecer como o mais recente na `/loja`, baralhando a ordenação e perdendo o histórico.
- **Fix:** no caminho de update, remover `createdAt` do `$set` (`const { createdAt, ...updateDoc } = doc`) ou usar `$setOnInsert`. **Mesmo padrão em `pagamentos/upsert` (`route.ts:51` reescreve `criadoEm`)** — corrigir lá também.

### [P1-3] Pesquisa global completamente inacessível em mobile/tablet
`src/components/painel/Topbar.tsx:58`
- **Facto:** o único acesso a `/painel/procurar` é o `GlobalSearch` da Topbar, escondido a ≤900px (`hidden md:block` + `painel.css:997 .gsearch{display:none}`). `/painel/procurar` **não** está em `PAINEL_NAV_DEFAULT` → não aparece na BottomNav. A própria página não renderiza input nenhum — o empty state diz "Escreve para procurar" apontando para um campo que não existe.
- **Impacto:** em qualquer ecrã <900px (o caso de uso PWA/BottomNav) a pesquisa global (projectos, clientes, NIF, telefone) não existe: sem forma de lá chegar nem de escrever query.
- **Fix:** adicionar "Procurar" ao `PAINEL_NAV_DEFAULT` **e/ou** renderizar `<GlobalSearch defaultValue={raw} />` dentro de `/painel/procurar/page.tsx` (o componente já aceita `defaultValue` e nunca é usado).

---

## 🟡 P2 — Valor claro

### Backend / dados
- **[P2] Mongo cold-start envenena a instância para sempre** — `src/lib/mongodb/client.ts:34`. Em produção `clientPromise = createClient()` avaliado no load do módulo, sem `.catch` de reset (que existe **só** em development, `:26-30`). Um blip do Atlas no arranque de uma lambda → todas as requests dessa instância devolvem 500 até reciclagem, mesmo com a BD já recuperada. Fix: init lazy dentro de `getDb()` + reset da promise no catch (espelhar o padrão de dev).
- **[P2] `GET /api/notifications` carrega a coleção `leads` inteira a cada 60s por aba** — `route.ts:78`. Faz `getAllLeads()` e filtra em JS para 8 items; ignora o índice `{estado,criadoEm}` que existe para isto. Traz mensagens + IP de todos os leads a cada minuto por aba aberta. Fix: loader `getLeadsNovosRecentes(8)` com `find({estado:'novo'}, {projection:{...}}).sort({criadoEm:-1}).limit(8)`.
- **[P2] Counts da sidebar e páginas puxam projetos completos** — `src/app/(painel)/layout.tsx:39`. `getSidebarCounts` chama `getAllProjetos/Tarefas/Pagamentos` sem projeção (trazem `bodyMd` até 50KB, linhas, arquivos) para usar 2-3 campos. `clientes/[id]` filtra `clienteId` em JS apesar do índice `projetos.clienteId` existir e nunca ser usado (não há `getProjetosByCliente`). Fix: projeções + `getProjetosByCliente`.
- **[P2] Apagar projeto deixa blobs órfãos + pagamentos órfãos** — `src/app/api/projetos/[id]/route.ts:26`. DELETE apaga tarefas e projeto mas nunca chama `deleteManagedBlob` sobre `existing.arquivos[].blobUrl` (ao contrário do delete individual e de produtos) → blob pago e irrecuperável. Também não trata pagamentos com esse `projetoId` (ficam órfãos nos relatórios) nem revalida `/painel/calendario`. Fix: apagar blobs antes do delete + decidir destino dos pagamentos + `revalidatePath('/painel/calendario')`.
- **[P2] Auditoria de mutações tem buracos** — `src/app/api/leads/[id]/route.ts:34`. `logMutation` existe em 19 rotas mas falta em: leads PATCH (estado) e DELETE (apaga permanentemente sem rasto), `blocked-ips` POST, `settings` PUT, `tarefa-templates/*`, `projeto-tipos-custom/*`, `tarefas/from-template` (cria N tarefas sem uma entrada). Fix: adicionar `logMutation`, prioridade leads DELETE (guardar `before`).
- **[P2] `audit_log` cresce sem limite com PII e `bodyMd` até 50KB** — `src/lib/mongodb/mutation-audit.ts:24`. Insere `before`+`after` completos sem TTL nem retenção; `projetos/upsert` grava o Projeto inteiro (~100KB/gravação), `clientes`/`leads` gravam PII. RGPD: PII persiste mesmo depois do cliente/lead ser apagado. Fix: índice TTL em `at` (ex. 365d) + diff/exclusão de `bodyMd` no snapshot + documentar retenção.
- **[P2] Add/remove arquivos usa read-modify-write do array** — ver P3 (é `arquivo/route.ts:121`, listado abaixo por probabilidade baixa).

### Site público / SEO / i18n
- **[P2] hreflang inválido: pt e en apontam para o mesmo URL, sem x-default** — `src/app/page.tsx:36` (e todas as `generateMetadata`). Locale por cookie `MYNEXTAPP_LOCALE`, sem rotas `/en` → não há URL distinto para EN. hreflang com URLs idênticos é ignorado pelo Google; o crawler nunca envia cookie → **conteúdo EN 100% invisível para pesquisa**. Fix curto: remover `alternates.languages` (manter só `canonical`). Médio prazo: routing por prefixo `/en/...` se o mercado EN interessar.
- **[P2] Loja: TODAS as imagens de produto recebem `priority`** — `src/components/sections/shop/ProductCard.tsx:73`. `priority={currentIndex === 0}` mas `currentIndex` é o estado do carrossel **dentro** de cada card (todos começam a 0) → todas as imagens da grelha preload/eager, anulando o lazy-load. Fix: passar `index` do grid e usar `priority={index < 3 && currentIndex === 0}`, ou remover (os cards não são o LCP).
- **[P2] Garantias: unidades "anos/meses/dias" hardcoded em PT** — `src/app/loja/page.tsx:116`. No `WarrantyStrip`, `unit:"anos"/"meses"/"dias"` fixas; labels vêm de messages mas as unidades não → utilizador EN vê "3 anos / Warranty", "14 dias / Return". Secção legalmente sensível. Fix: mover unidades para `messages/{pt,en}.json`.

### Painel UX
- **[P2] Definição de "activo" diverge entre sidebar/bottomnav e as páginas** — `src/app/(painel)/layout.tsx:57`. 4 regras diferentes: badge sidebar = projetos em-curso/proximo; página Tarefas usa `TAREFAS_VISIVEIS_STATUSES` (5 estados); título Projectos = tudo exceto fechado/cancelado (inclui ideias); clientes/dashboard usam ainda outras. Utilizador vê "Tarefas 3" na sidebar e "7 abertas" no título do mesmo ecrã. Fix: fonte única de verdade (`isProjetoActivo()`/`countTarefasPendentes()` em `types/projeto.ts`).
- **[P2] Tabs de Tarefas contam feitas, mas a lista esconde-as por defeito** — `tarefas/page.tsx:65`. Counts das tabs iteram `allTarefas` sem filtrar `t.feita`; a lista exclui feitas (`showFeitas=false` default). "Vencidas 5" abre lista quase vazia; "Todas 12" contradiz "7 abertas". Fix: contar sobre `allTarefas.filter(t=>!t.feita)` quando `showFeitas=false`.
- **[P2] Remover ficheiro de projeto apaga o blob permanentemente sem confirmação** — `ArquivosUploadZone.tsx:129`. Clique no X (botão 28px ao lado do download) faz DELETE + `deleteManagedBlob` imediato, irreversível. Todas as outras ações destrutivas usam `ConfirmDialog`. Fix: envolver em `useConfirm()`.
- **[P2] Botão de apagar tarefa invisível em touch** — `TarefasPorProjeto.tsx:262`. `opacity-0 group-hover/item:opacity-100` sem fallback touch → invisível mas clicável em mobile (onde o painel tem BottomNav/PWA). Toque às cegas abre o diálogo de apagar. Mesmo padrão em `TarefaChecklist.tsx:310/319`. Fix: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100` + `focus-visible`.
- **[P2] Topbar parte em 2 linhas entre 768–900px** — `Topbar.tsx:57`. O wrapper `hidden md:block` fica `display:block` e vazio entre 768 (md) e 900px, ocupando célula do grid de 2 colunas → sino + botão de ação caem para a 2ª linha, alinhados à esquerda (iPad retrato = 768px). Nota do verificador: com `hideSearch=true` o placeholder `<div/>` não tem `hidden` → mesmo wrap em TODAS as larguras ≤900px. Fix: `hidden min-[901px]:block` + esconder também o placeholder.

### Deps / config
- **[P2] `npm run lint` = `next lint` (removido no Next 16) e zero ESLint no projeto** — `package.json:9`. `next lint` já não existe na v16 (script parte); não há `.eslintrc`/`eslint.config.*` nem `eslint`/`eslint-config-next` nas deps → **projeto sem linting**. Perde rules-of-hooks, deps de `useEffect`, `<img>` vs next/image, chaves duplicadas. Fix: adicionar `eslint` + `eslint-config-next` (flat config) e `eslint .`, ou remover o script.
- **[P2] `recharts` + `react-is` + `date-fns` são código morto** — `package.json:37`. Os 5 componentes em `src/components/painel/charts/` importam recharts mas nada os importa (o dashboard usa SVG à mão); `date-fns` e `react-is` = zero imports. `dotenv` só usado em `scripts/*.mjs`. Fix: apagar `charts/` + remover `recharts`/`react-is`/`date-fns`; mover `dotenv` para devDeps.
- **[P2] `undici 6.26.0` (via `@vercel/blob`) com advisory HIGH + fix não-breaking** — `package.json:22`. HIGH conhecido (WebSocket DoS) + moderados, cliente HTTP dos uploads Blob. Fix: `npm audit fix` (sem `--force` — esse sugere downgrade absurdo do next) + commitar lockfile. (js-yaml via gray-matter, devDep, também.)
- **[P2] `public/fonts/` com 8 TTFs (~1,9MB) órfãos** — `public/fonts/Inter-Regular.ttf`. As fontes vêm todas de `next/font/google`; zero `@font-face`/`/fonts/` em `src`. Resíduo de iteração anterior. Fix: apagar `public/fonts/`.

---

## 🔵 P3 — Higiene / consistência / cosmético

### Segurança
- **[P3] `AUTH_PASSWORD` em texto simples** — `auth.ts:58`. Password mestre em claro na env do Vercel (visível no dashboard/exports/integrações); o compare caseiro tem early-return por comprimento (leak de timing menor, mitigado pelo 10/min). Fix: guardar hash (bcrypt/argon2) e usar `bcrypt.compare`.
- **[P3] `POST /api/blocked-ips` sem validação de formato/tamanho** — `blocked-ips/route.ts:19`. Aceita qualquer string não vazia como `ip` (sem regex IPv4/IPv6, sem max). Tem `withAuth`; único caller envia IPs server-side, abuso exige sessão admin roubada. Fix: zod `z.string().ip().max(45)` + `motivo.max(500)`.
- **[P3] CSP report-only não inclui `challenges.cloudflare.com`** — `next.config.ts:34`. `script-src`/`frame-src` sem o host do Turnstile (já integrado no código). No dia em que ativarem chaves + enforce → widget não carrega → form de contacto devolve 403 a todos. E o procedimento report-only nunca apanha isto (só há violação com chaves). Fix: acrescentar o host já agora (custo zero em report-only).

### Bugs
- **[P3] `LeadsTable`: override otimista nunca é limpo** — `LeadsTable.tsx:90`. Duas mudanças rápidas no mesmo lead com o 1º PATCH a falhar depois do 2º ter sucesso → revert fixa estado obsoleto que `router.refresh()` não corrige (override tem sempre precedência). Fix: seq/requestId por lead ou `useOptimistic`.
- **[P3] `PUT /api/settings` é replace total** — `settings/route.ts:18`. Campos `.optional().default("")` + `$set` completo → um body parcial apaga silenciosamente os restantes campos. Latente (o form envia sempre os 6). Fix: semântica PATCH (só chaves presentes) ou PUT honesto (exigir doc completo) + `logMutation`.
- **[P3] "Hoje" do calendário calculado no fuso do servidor (UTC)** — `MonthCalendar.tsx:88` (+ `calendario/page.tsx:73`, `painel/page.tsx:136`). Server components usam `new Date()` UTC; componentes client usam o relógio do browser. Entre 00:00–01:00 PT (UTC+1 verão) o realce/mês/totais apontam para o dia anterior. Classe de bug de datas já apanhada antes ([[reservas-toisostring-timezone]]). Fix: calcular "hoje" em `Europe/Lisbon` no servidor.
- **[P3] `prazoHora` órfã ressuscita** — `tarefas/edit/route.ts:16`. Limpar a data de uma tarefa (`prazo:null`) deixa a `prazoHora` antiga no doc; ao pôr data nova, a tarefa aparece no calendário à hora antiga sem o utilizador a ter escolhido. `prazo` também não tem regex no schema. Fix: se `prazo===null`, forçar `prazoHora:null`.
- **[P3] Pesquisa global: termo desaparece da caixa** — `Topbar.tsx:59`. `GlobalSearch` aceita `defaultValue` mas o Topbar nunca o passa → depois de pesquisar a caixa volta a vazio (código morto). Fix: passar `q` para o Topbar → `GlobalSearch` na página de resultados.
- **[P3] Add/remove arquivos = read-modify-write do array** — `arquivo/route.ts:121`. Duas abas/dispositivos (é PWA) ou upload+delete simultâneos perdem um write → blob órfão. Fix: `$push`/`$pull` atómicos.

### Site público
- **[P3] aria-labels/alt hardcoded não seguem o locale** — `Nav.tsx:71` (+ Footer, ProductCard, TrustStrip, About). Strings PT fixas; caso inverso `CategoryFilter.tsx:33` "Filter by category" fixo em EN. `language-switcher.tsx:64` anuncia o idioma atual, não a ação. Fix: namespace `A11y` em messages + corrigir o switcher.
- **[P3] Imagem OG mostra o domínio morto como texto** — `opengraph-image.tsx:148`. `reddune.solutions` hardcoded na faixa da imagem partilhada em redes/WhatsApp. Fix: `www.reddunesolutions.pt`.
- **[P3] `sitemap.ts` usa `lastModified = new Date()` em todas as entradas** — `sitemap.ts:25`. Todos os `<lastmod>` iguais (hora do deploy) → o Google ignora o campo. Fix: constante de build para estáticas + `updatedAt` do Mongo para /loja e /portfolio, ou omitir.

### Painel UX
- **[P3] Confirmações destrutivas inconsistentes** — `LeadsTable.tsx:111` + `BlockIpButton.tsx:17` usam `window.confirm` nativo; os outros 9 fluxos usam `ConfirmDialog` Oasis. Fix: trocar os dois pelo `confirm()` do design.
- **[P3] Detalhe de Loja/Portfólio sem breadcrumbs** — `loja/[id]/page.tsx:20` + `portfolio/[id]/page.tsx:20` sem prop `crumbs`; todas as outras páginas têm. Fix: `crumbs={["Painel","Conteúdo","Loja", product.name.pt]}` (e Portfólio).
- **[P3] Regra mobile de compactar botões da topbar é código morto** — `painel.css:1020`. Selector `.btn.primary span` que os botões shadcn da topbar não têm → compactação para ícone-só nunca acontece; em 360px o botão "Novo projeto" fica por extenso. Fix: aplicar o padrão desenhado ou usar `max-sm:hidden` no label.
- **[P3] "Hoje" do dashboard ≠ "Hoje" do calendário** — `painel/page.tsx:119`. Dashboard = projectos activos vencidos-ou-hoje; calendário = projectos+tarefas de hoje de qualquer estado (incl. fechado/cancelado, tarefas feitas). Contagens diferentes com o mesmo rótulo. Fix: predicado partilhado.
- **[P3] KPI "Ticket médio" divide receita de 6 meses por fechados de sempre** — `relatorios/page.tsx:181`. Numerador limitado a 6 meses, denominador all-time → subestima sistematicamente à medida que o histórico cresce. Fix: contar fechados nos mesmos 6 meses.

### Deps / config
- **[P3] `public/logo-mark.png` é duplicado byte-a-byte de `icone.png`** — 483,9KB cada (mesmo md5) para um logo renderizado a 28-40px. `logo-mark.png` está EM USO (Nav, Sidebar, CompanyProfileForm). Fix: reduzir para ~160-200px (~15KB); evitar duas cópias do mesmo binário.
- **[P3] Painel carrega famílias de fonte a mais** — `(painel)/layout.tsx:15`. Bricolage (5 pesos) + DM Sans (4) preload no root layout mas substituídas por Poppins/Inter no painel → 2 famílias de peso morto em /painel. (Correção do verificador: Newsreader/Geist Mono **são** usadas no painel, não são peso morto.) Fix: `weight:"variable"` nas variáveis, ou mover as fontes públicas para um layout do grupo público.
- **[P3] `images.remotePatterns` permite hosts não usados** — `next.config.ts:68`. `placehold.co`, `images.unsplash.com`, `picsum.photos` = zero usos → superfície de abuso do `/_next/image` por terceiros. Fix: remover as 3 entradas (confirmar antes que nenhum doc antigo do Mongo aponta para lá).

---

## Refutado (1)
Um achado (dos 45) não passou a verificação adversarial e foi descartado.

## Nota de método
Cada achado acima foi confirmado por um agente verificador independente que tentou **refutá-lo** contra o código real (abrir ficheiros, confirmar linhas, testar a lógica) — política de zero-alucinação do segundo cérebro. As correções dos verificadores (linhas exatas, nuances, casos parcialmente intencionais) estão incorporadas.
