# Plano de melhorias — RedDune Website + Painel

> Gerado a partir da auditoria completa (site público + painel + backend), verificado contra o código real por agentes em paralelo + revisão adversarial. Data: 2026-06-29.

**Stack:** Next.js 16 (App Router) · React 18 · TypeScript · MongoDB (driver nativo) · NextAuth v5 · next-intl · Tailwind · Vercel (auto-deploy on push `main`).

**Legenda prioridade:** **P0** destrava/segurança imediata · **P1** quick win alto valor · **P2** feature útil · **P3** estratégico/decisão.
**Camadas:** C0 = só env no Vercel (zero código) · C1 = quick wins + segurança · C2 = features/UX · C3 = estratégico.
**Esforço:** XS = minutos · S = <1h · M = horas · L = 1–2 dias · XL = >2 dias.

## ✅ Por onde começar
- **Faz já (P0, minutos):** `UX3` tarefas: alinhar estados visíveis com os do botão criar · `OG1` Corrigir og-image.png em falta no layout
- **Lote quick-win (P1):** `ENV1` `CRM1` `CRM2` `SEC1` `SEC2` `CLN1` `CLN2` `CLN5` `UX1` `UX2` `UX4` `FEAT3` `FAQ`
- **Camada 0 (env, sem código):** `ENV1` destrava TODA a gestão de imagens do painel — é o de maior valor imediato.

## Checklist mestre

| ID | Item | Camada | Prio | Esforço |
|---|---|:--:|:--:|:--:|
| `ENV1` | Activar upload de imagens (Vercel Blob) | C0 | **P1** | S |
| `ENV2` | Activar push de lead novo (VAPID Web Push) | C0 | **P2** | M |
| `ENV3` | Activar rate-limit distribuído (Upstash Redis) | C0 | **P2** | S |
| `ENV4` | Activar Turnstile anti-bot (só se houver spam) | C0 | **P3** | S |
| `CRM1` | Converter lead → cliente | C1 | **P1** | M |
| `CRM2` | Apagar cliente: ligar UI ao DELETE já existente | C1 | **P1** | S |
| `SEC1` | CSP em report-only (next.config.ts) | C1 | **P1** | M |
| `SEC2` | Validação zod nos upserts de products/portfolio | C1 | **P1** | M |
| `SEC3` | BlockIpButton: mostrar erro/toast (catch vazio) | C1 | **P2** | XS |
| `SEC4` | Migrar produtos DB legacy → products + índices | C1 | **P2** | M |
| `SEC5` | DELETE projetos: cascata sem transação (nota) | C1 | **P3** | S |
| `CLN1` | Loja: esconder tabs Encomendas/Stock/Promoções | C1 | **P1** | XS |
| `CLN2` | Definições: esconder mock + corrigir âncoras | C1 | **P1** | S |
| `CLN3` | Clientes: kebab (⋮) → chevron | C1 | **P2** | XS |
| `CLN4` | Dívidas: renomear "Receber" → "Ver projecto" | C1 | **P2** | XS |
| `CLN5` | Topbar search: ajustar placeholder ao âmbito real | C1 | **P1** | XS |
| `DEAD1` | Apagar código/assets mortos (FilterBar, heros, env.ts…) | C1 | **P2** | S |
| `UX3` | tarefas: alinhar estados visíveis com os do botão criar | C2 | **P0** | S |
| `UX1` | TarefaChecklist: otimista por-linha + confirm + revalidate | C2 | **P1** | M |
| `UX2` | TarefasPorProjeto: otimista + confirm no delete | C2 | **P1** | M |
| `UX4` | ImageUploadZone: adiar delete do blob para o save | C2 | **P1** | M |
| `UX5` | ServicosEditor: erro por-card + chave estável | C2 | **P2** | M |
| `UX6` | Loja/Portfólio: loading no delete + redirect + validar URL | C2 | **P2** | M |
| `UX7` | Kanban drag-and-drop (@dnd-kit) | C2 | **P3** | XL |
| `FEAT1` | Definições reais — perfil da empresa (colecção settings) | C2 | **P2** | M |
| `FEAT2` | Sino real — notificações in-app (leads + audit_log) | C2 | **P2** | M |
| `FEAT3` | Pesquisa global a sério (clientes + tarefas) | C2 | **P1** | M |
| `OG1` | Corrigir og-image.png em falta no layout | C2 | **P0** | XS |
| `FAQ` | Página /faq i18n + JSON-LD FAQPage | C2 | **P1** | M |
| `TEST` | Testemunhos de clientes (home + página) | C2 | **P2** | L |
| `CASE` | Estudos de caso — /portfolio/[slug] próprio | C2 | **P2** | L |
| `BLOG` | Blog/Artigos bilingue + CRUD no painel + SEO | C2 | **P2** | XL |
| `NEWS` | Newsletter / captura de email (dep. canal de envio) | C3 | **P3** | M |
| `EST1` | Faturação: decidir forma fiscal + ferramenta | C3 | **P3** | M |
| `EST2` | Loja: e-commerce real vs manter inquiry-only | C3 | **P3** | L |


## 🟡 Camada 0 — Activar features dormentes (env no Vercel, sem código)

## Cluster: Activar features DORMENTES (só env no Vercel — zero código)

Confirmei os 4 pontos abrindo os ficheiros. Todo o código de consumo já existe e degrada graciosamente sem chaves; as dependências (`@vercel/blob ^2.4.0`, `web-push ^3.6.7`) já estão no `package.json`. Cada item abaixo é só pôr env vars no Vercel (Project → Settings → Environment Variables) e fazer um redeploy (as envs novas só entram em build novo).

> Nota transversal: depois de adicionar qualquer env no Vercel é preciso **Redeploy** (ou novo push a `main`). Variáveis `NEXT_PUBLIC_*` são inlined no bundle em build-time — não basta adicionar, tem de rebuildar. NUNCA pôr chaves privadas (`VAPID_PRIVATE_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `BLOB_READ_WRITE_TOKEN`) no git/`.env` commitado — só no painel Vercel.

### [ENV1] Upload de imagens (Vercel Blob) — `P1` · esforço `S`
- **Estado actual:** `src/app/api/upload/product-image/route.ts:29-34` devolve **500** `"Storage não configurado (BLOB_READ_WRITE_TOKEN em falta)"` quando `process.env.BLOB_READ_WRITE_TOKEN` não existe — antes sequer de ler o ficheiro. O resto da rota (auth `:18`, rate-limit 20/min `:24`, validação MIME/tamanho, `put()` em `products/<uuid>.<ext>` `:62-70`) está completo. Cliente: `src/components/painel/ImageUploadZone.tsx` comprime para WebP ≤0.5MB/1600px e faz `POST /api/upload/product-image` (`:91`); o erro 500 sobe como toast "Erro ao carregar". Cleanup já implementado em `src/lib/blob.ts` (`deleteManagedBlob` filtra pelo host `.public.blob.vercel-storage.com`). Dependência `@vercel/blob ^2.4.0` já instalada (`package.json:22`). **Sem o token, toda a gestão de imagens do painel está bloqueada.**
- **Alteração:** Não tocar em código. No Vercel: Storage → **Create Database → Blob** (ou Marketplace → Blob), criar um store (ex. `reddune-images`) e ligá-lo ao projecto `reddune-solutions`. Ligar o store injecta automaticamente `BLOB_READ_WRITE_TOKEN` nas envs do projecto (Production + Preview). Em alternativa manual: copiar o token `vercel_blob_rw_...` do store e adicioná-lo como env `BLOB_READ_WRITE_TOKEN`. Depois **Redeploy**. (Opcional dev local: `vercel env pull .env.local` para puxar o token — `.env.local` está gitignored.)
- **Aceitação:** Em `/painel` (produto, secção imagens) arrastar uma imagem → barra "A comprimir…" → "A enviar…" → aparece thumbnail com badge "Capa", sem toast de erro. A `url` devolvida aponta para `*.public.blob.vercel-storage.com`. Remover a imagem (X) apaga o blob (best-effort). Resposta da rota deixa de ser 500.
- **Risco/nota:** Vercel Blob tem free tier (1GB armazenamento + transferência limitada); confirmar plano. Imagens já compridas no cliente (~<500KB) ajudam. URLs antigas externas (Drive/Instagram) NÃO são apagadas pelo cleanup (protecção intencional em `blob.ts:10-17`) — ok. É o destravador de maior valor imediato → P1.

### [ENV2] Push de lead novo (Web Push / PWA) — `P2` · esforço `M`
- **Estado actual:** `src/lib/push.ts:14-20` — `ensureConfigured()` faz **no-op silencioso** se `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ou `VAPID_PRIVATE_KEY` faltarem; `sendPushToAll()` retorna sem enviar. Disparo já ligado em `src/app/api/sendEmail/route.ts:114-122` (best-effort, não quebra a gravação do lead) com payload `{title:"Novo lead 🌵", body:"<nome> — <assunto>", url:"/painel/leads"}`. Opt-in: `src/components/painel/PushOptIn.tsx` — botão "Ativar notificações"; `:6,:30` **não renderiza nada** se `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ausente (degrada). Subscrição guardada via `POST /api/push/subscribe` (`src/app/api/push/subscribe/route.ts`, auth + Mongo `push_subscriptions`). Service worker `public/sw.js:25-40` já trata `push` e `notificationclick`. `SUBJECT` default já é `mailto:reddunesolutions@gmail.com` (`push.ts:11`). Dependência `web-push ^3.6.7` instalada. **Tudo pronto; só faltam as chaves VAPID.**
- **Alteração:** Não tocar em código. Gerar par de chaves localmente: `npx web-push generate-vapid-keys` (output: `Public Key:` e `Private Key:` em base64url). No Vercel adicionar três envs (Production + Preview): `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = a pública; `VAPID_PRIVATE_KEY` = a privada (SÓ no Vercel, nunca commit); opcional `VAPID_SUBJECT` = `mailto:reddunesolutions@gmail.com` (já é o default, dá para omitir). **Redeploy** (a pública é `NEXT_PUBLIC_*`, tem de ser inlined em build novo). Depois, em `/painel`, clicar "Ativar notificações" e aceitar o prompt do browser para criar a subscrição.
- **Aceitação:** Após redeploy, o botão "Ativar notificações" passa a renderizar em `/painel` (deixa de estar oculto). Clicar → permissão concedida → estado "Notificações ativas". Submeter o formulário de contacto público → chega notificação "Novo lead 🌵" no dispositivo; clicar abre `/painel/leads`. Subscrições expiradas (404/410) são limpas automaticamente (`push.ts:51-52`).
- **Risco/nota:** iOS só entrega push com a **PWA instalada** (Adicionar ao ecrã principal) e iOS ≥16.4 — testar no telemóvel do Iuri instalando a PWA primeiro. Se trocar as chaves VAPID mais tarde, todas as subscrições existentes invalidam (têm de re-subscrever). Chave pública e privada têm de ser do **mesmo par**. Sem dados reais em risco (só lê leads existentes). P2: útil mas não destrava trabalho — leads já são gravados e visíveis em `/painel/leads` sem push.

### [ENV3] Rate-limit distribuído / anti brute-force (Upstash Redis) — `P2` · esforço `S`
- **Estado actual:** `middleware.ts` (Edge) aplica login 10/min em `/api/auth/callback/credentials` (`:62-77`) e global 200/min em `/api` (`:79-92`). A função `limit()` (`:41-45`) tenta `redisRateLimit()` e **cai para um Map in-memory por instância Edge** (`:13,:23-38`) se Upstash não estiver configurado. `src/lib/rate-limit-redis.ts:22` devolve `null` quando `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` faltam → fallback. **Problema:** o limiter in-memory não é partilhado entre instâncias serverless/Edge — cada instância tem o seu contador, por isso o limite efectivo é fraco contra brute-force distribuído. Nas rotas Node (`src/lib/rate-limit.ts:44-55`) a cadeia é Upstash → MongoDB (`rate-limit-mongo`) → memória, por isso essas já têm fallback partilhado via Mongo; o Edge **não** (driver Mongo não corre no Edge, daí depender de Upstash).
- **Alteração:** Não tocar em código. Criar uma base Upstash Redis: Vercel Marketplace → **Upstash** (ou conta upstash.com → Create Database, região próxima ex. eu-west). Copiar as credenciais REST: `UPSTASH_REDIS_REST_URL` (`https://<id>.upstash.io`) e `UPSTASH_REDIS_REST_TOKEN`. Adicionar ambas como env no Vercel (Production + Preview). **Redeploy**. (Ligar via Marketplace injecta as envs automaticamente.)
- **Aceitação:** Com as envs postas, `redisRateLimit()` deixa de devolver `null` e os contadores passam a ser partilhados. Verificar: fazer >10 tentativas de login num minuto a partir de IPs/instâncias diferentes → 429 `"Too many login attempts"` consistente (não reinicia por instância). Confirmar no dashboard Upstash que as chaves `login:<ip>` e `api:<ip>` aparecem com TTL ~60s.
- **Risco/nota:** Upstash free tier (10k comandos/dia) chega de sobra para este tráfego. Sem dados reais em risco (chaves efémeras com TTL). Decisão: o middleware Edge nunca usa Mongo (limitação Edge), por isso Upstash é a única forma de ter rate-limit Edge partilhado — mas o login também passa pela camada Node onde já há fallback Mongo, logo o ganho real é marginal. P2 (defesa em profundidade), não P0.

### [ENV4] Turnstile (anti-bot no formulário de contacto) — `P3` · esforço `S`
- **Estado actual:** `src/lib/turnstile.ts:17` — `verifyTurnstile()` retorna `true` (skip) se `TURNSTILE_SECRET_KEY` não estiver definido; com secret definido, token ausente/inválido → rejeita. Consumido em `src/app/api/sendEmail/route.ts:67-80` (403 `"Verificação anti-spam falhou"` se falhar). Widget cliente `src/components/Turnstile.tsx:28-31`: se `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ausente, chama `onVerify("")` e **não renderiza** (`:61`) — form submete sem token. Hoje a defesa de spam é honeypot (`route.ts:45-52`) + rate-limit + blocklist de IP — segundo o `CLAUDE.md`, suficiente.
- **Alteração:** Não tocar em código. No Cloudflare dashboard → **Turnstile → Add site** (domínio do site reddune), escolher widget (Managed recomendado). Copiar **Site Key** (pública) e **Secret Key**. No Vercel adicionar: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = site key; `TURNSTILE_SECRET_KEY` = secret (só Vercel, nunca commit). **Redeploy** (site key é `NEXT_PUBLIC_*`).
- **Aceitação:** No formulário de contacto público aparece o widget Turnstile. Submeter sem resolver → 403. Submeter com challenge resolvido → lead gravado normalmente. Sem as envs, comportamento actual (widget oculto, verify skip) mantém-se intacto.
- **Risco/nota:** **Só activar se aparecer spam real** (decisão do utilizador, alinhado com `CLAUDE.md` — "CAPTCHA NÃO é prioritário"). Adiciona fricção ao visitante legítimo. Site key e secret têm de ser do mesmo widget Cloudflare. Para teste, Cloudflare tem chaves "always passes/always blocks" documentadas. P3 — estratégico/só-se-preciso.

## 🟢 Camada 1 — Fechar o funil comercial (CRM)

## Cluster: Fechar o funil comercial (CRM)

Contexto confirmado nos ficheiros:
- `Lead.clienteId?: string | null` existe (`src/types/lead.ts:32`). O lead **não** tem campo `telefone` — só `nome`, `email`, `subject`, `mensagem`, `notas`, `ip` (`src/types/lead.ts:21-35`). O telefone do cliente terá de ficar `null` na conversão.
- `Cliente` tem `nome, email, telefone, nif, morada, notas, criadoEm` (`src/types/cliente.ts`).
- Data layer leads: `getLeadById`, `updateLeadEstado`, `upsertLead` (`src/lib/mongodb/leads.ts`). **Não** existe função para gravar `clienteId` no lead — só `upsertLead` (grava o objecto inteiro) e `updateLeadEstado` (só estado).
- Data layer clientes: `upsertCliente`, `getClienteById`, `deleteCliente` (`src/lib/mongodb/clientes.ts:23-33`).
- `POST /api/clientes/upsert` cria/actualiza cliente e devolve `{ ok, id }` (`src/app/api/clientes/upsert/route.ts:40`); valida com `clienteInputSchema`.
- `DELETE /api/clientes/[id]` **já existe** com `logMutation` e `revalidatePath("/painel/clientes")` (`src/app/api/clientes/[id]/route.ts:8-35`), mas **nenhuma UI o invoca**.
- Dependentes de `clienteId`: `projetos` (`getAllProjetos().filter(p => p.clienteId === id)`, `clientes/[id]/page.tsx:36`) e `pagamentos` (`getPagamentosByCliente`, `pagamentos.ts:16`). Ao apagar cliente, esses documentos ficam órfãos (a UI já mostra "(projeto removido)").
- Padrão optimista gold-standard: `InlineStatusSelect.tsx:62-79` e `LeadsTable.changeEstado` (`LeadsTable.tsx:89-108`) — set optimista → `safeJsonPost`/`safeFetch` → revert + toast destrutivo em erro → `startTransition(router.refresh())`.

---

### [CRM1] Converter lead → cliente — `P1` · esforço `M`
- **Estado actual:** O Sheet do lead (`src/components/painel/LeadsTable.tsx:191-278`) só tem acções "Eliminar" e "Responder". Não há ligação lead→cliente. `Lead.clienteId` existe mas nunca é escrito (nenhuma função em `leads.ts` o actualiza isoladamente). Não existe rota de conversão.
- **Alteração:**
  1. **Nova rota** `src/app/api/leads/[id]/convert/route.ts` (handler `POST`, `withAuth`, `export const dynamic = "force-dynamic"`). Justificação: `/api/clientes/upsert` só cria cliente; a conversão precisa de transacção lógica (criar cliente **e** ligar `lead.clienteId` **e** mudar `lead.estado` para `"ganho"`) — uma rota dedicada evita 3 chamadas do cliente e mantém atomicidade no servidor.
  2. Fluxo na rota: `getLeadById(id)`; se já tiver `clienteId`, devolver 409 (`apiError("Lead já convertido", 409)`). Senão: `const novoId = randomUUID()`; construir `Cliente` a partir do lead — `nome: lead.nome`, `email: lead.email`, `telefone: null` (lead não tem telefone), `nif: null`, `morada: null`, `notas: lead.mensagem` (prefixar ex.: `"Lead (${SUBJECT_LABELS[lead.subject]}): " + lead.mensagem`), `criadoEm: new Date().toISOString()`. Chamar `upsertCliente(cliente)`.
  3. **Nova função no data layer** `src/lib/mongodb/leads.ts`: `linkLeadCliente(id, clienteId): Promise<boolean>` que faz `updateOne({ id }, { $set: { clienteId, estado: "ganho", atualizadoEm: new Date().toISOString() } })`. (Alternativa: reusar `getLeadById` + `upsertLead` com o objecto mutado, mas uma função focada é mais limpa e segue o estilo de `updateLeadEstado`.)
  4. Na rota chamar `logMutation({ collection: "clientes", entityId: novoId, op: "create", userEmail, after: cliente })` (segue `upsert/route.ts:31`), depois `revalidatePath("/painel/leads")`, `revalidatePath("/painel/clientes")`, `revalidatePath('/painel/clientes/${novoId}')`. Devolver `apiOk({ ok: true, clienteId: novoId })`.
  5. **UI** em `LeadsTable.tsx`: no `SheetFooter` (junto a Eliminar/Responder, ~linha 252) adicionar botão "Converter em cliente" (ícone `UserPlus` de lucide). Estado optimista: estender o `overrides` existente para mudar o badge de estado para `"ganho"` imediatamente (reusa `estadoOf`/`setOverrides`, `LeadsTable.tsx:83-91`); adicionar `busy === "convert"` ao tipo de `busy` (linha 81). Em `safeJsonPost('/api/leads/${id}/convert', {})`: se `!res.ok` → revert override + toast destrutivo (igual a `changeEstado`); se ok → toast sucesso "Convertido em cliente", `setOpenId(null)`, e `router.push('/painel/clientes/${res.data.clienteId}')` (ou `router.refresh()` se preferir ficar na lista). Esconder/desactivar o botão quando `selected.clienteId` já está preenchido (mostrar antes link "Ver cliente" para `/painel/clientes/${selected.clienteId}`).
- **Aceitação:** Abrir um lead "novo" → clicar "Converter em cliente" → badge muda para "Ganho" de imediato; navega (ou aparece link) para a ficha do novo cliente com nome/email preenchidos e a mensagem do lead na nota; reabrir o lead mostra "Ver cliente" em vez do botão converter; segunda tentativa de converter devolve 409. Em falha de rede o badge reverte e aparece toast vermelho.
- **Risco/nota:** NUNCA tocar em documentos Mongo reais durante o desenvolvimento — testar com lead de teste. Decisão necessária: (a) o que fazer se já existir cliente com o mesmo email (por agora cria sempre novo — aceitável; deduplicação fica para depois); (b) confirmar o prefixo/formato da nota com o Iuri. `randomUUID` importa-se de `node:crypto` (já usado em `upsert/route.ts:2`). Lead sem telefone é esperado — não inventar campo.

---

### [CRM2] Apagar cliente (ligar UI ao DELETE existente) — `P1` · esforço `S`
- **Estado actual:** `DELETE /api/clientes/[id]` existe e funciona (`src/app/api/clientes/[id]/route.ts:8-35`), com `logMutation` e `revalidatePath`. **Nenhum componente o chama.** Na página de detalhe (`src/app/(painel)/painel/clientes/[id]/page.tsx`) só há "Voltar a clientes" e a `ClienteForm`. Na lista (`clientes/page.tsx:140-144`) o "menu" da linha é só um `<Link>` com ícone `MoreVertical` que reabre a ficha — não há acção de apagar. Dependentes confirmados: `projetos` com `clienteId === id` e `pagamentos` com `clienteId === id` (ambos ficam órfãos; a timeline de pagamentos já mostra "(projeto removido)", `[id]/page.tsx:180`).
- **Alteração:**
  1. **Novo componente client** `src/components/painel/ApagarClienteButton.tsx` (`"use client"`): props `{ clienteId: string; clienteNome: string; numProjetos: number; numPagamentos: number; }`. Botão destrutivo (ícone `Trash2`, estilo `text-ember` como em `LeadsTable.tsx:257`). `onClick`: `window.confirm` com aviso condicional — se `numProjetos > 0 || numPagamentos > 0`, mensagem do tipo `"Apagar ${clienteNome}? Tem ${numProjetos} projecto(s) e ${numPagamentos} pagamento(s) que vão ficar SEM cliente associado. Esta acção não se desfaz."`; senão mensagem simples. Em confirmação: `safeDelete('/api/clientes/${clienteId}')` (existe `safeDelete` em `safe-fetch.ts`); estado `deleting` com `Loader2`; em erro → toast destrutivo; em sucesso → `router.push("/painel/clientes")` + `router.refresh()`.
  2. **Ligar na página de detalhe** `clientes/[id]/page.tsx`: a página já calcula `projetos` (linha 36) e tem `pagamentos` (linha 31). Render do botão no cabeçalho, ao lado de "Voltar a clientes" (linha 67-75), passando `numProjetos={projetos.length}` e `numPagamentos={pagamentos.length}`.
  3. (Opcional, mesma sessão) também no menu da linha em `clientes/page.tsx:140-144` — mas como aí não há contagem de pagamentos fácil sem mais agregação, recomenda-se manter o DELETE só na ficha de detalhe e deixar o `MoreVertical` como está. Decisão do Iuri.
- **Aceitação:** Na ficha de um cliente sem projectos, clicar "Apagar cliente" → confirm simples → redirecciona para `/painel/clientes` e o cliente desaparece da lista. Num cliente com projectos, o confirm avisa quantos projectos/pagamentos ficarão órfãos antes de prosseguir. Cancelar o confirm não apaga nada. Após apagar, o `logMutation` regista a operação (já implementado na rota).
- **Risco/nota:** NUNCA correr o DELETE contra dados reais durante testes — usar cliente de teste. Decisão necessária: **comportamento com dependentes** — opções: (a) avisar e permitir (recomendado, baixo esforço, é o descrito acima); (b) bloquear se `numProjetos > 0` (devolver 409 no servidor — exigiria alterar a rota para verificar `getAllProjetos`/`getPagamentosByCliente` antes de apagar); (c) soft-delete/arquivar (adicionar `arquivado: boolean` ao `Cliente` + filtrar nas queries — esforço maior, fica para outro item). O `enunciado` pede "apagar/arquivar" — confirmar com o Iuri se quer hard-delete com aviso (opção a) ou bloqueio (opção b). A rota actual faz hard-delete sem verificar dependentes.

## 🔒 Camada 1 — Segurança, validação & integridade de dados

## Segurança, validação e integridade de dados

### [SEC1] CSP em report-only (Content-Security-Policy-Report-Only) — `P1` · esforço `M`
- **Estado actual:** `next.config.ts:24-40` define `headers()` com `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security`, mas **NÃO** tem `Content-Security-Policy` nem `Content-Security-Policy-Report-Only`. Os hosts de imagem permitidos estão em `images.remotePatterns` (`next.config.ts:42-53`): `placehold.co`, `images.unsplash.com`, `picsum.photos`, `flagcdn.com`, `instagram.flis11-1.fna.fbcdn.net`, `instagram.flis11-2.fna.fbcdn.net`, `drive.google.com`, `*.public.blob.vercel-storage.com`. Os 3 primeiros (placehold/unsplash/picsum) são placeholders de demo e provavelmente já não são usados em produção.
- **Alteração:**
  1. Em `next.config.ts`, adicionar ao array `headers` do bloco `source: "/:path*"` um header `Content-Security-Policy-Report-Only` (report-only primeiro, para não derrubar o site com inline scripts do Next/next-intl). Directivas iniciais:
     - `default-src 'self'`
     - `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://flagcdn.com https://instagram.flis11-1.fna.fbcdn.net https://instagram.flis11-2.fna.fbcdn.net https://drive.google.com` (incluir `https://placehold.co https://images.unsplash.com https://picsum.photos` só se ainda forem usados — ver ponto 3)
     - `script-src 'self' 'unsafe-inline'` (o Next App Router injecta inline bootstrap scripts; começar com `'unsafe-inline'` em report-only e migrar para nonce numa 2.ª fase — ver Risco)
     - `style-src 'self' 'unsafe-inline'` (Tailwind/styled inline)
     - `connect-src 'self' https://*.public.blob.vercel-storage.com` (+ Upstash se vier a ser usado)
     - `font-src 'self' data:`
     - `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`
  2. Manter como `Content-Security-Policy-Report-Only` durante alguns dias; monitorizar violações (browser console / endpoint `report-uri` opcional). Só depois renomear para `Content-Security-Policy` (enforcing).
  3. **Decisão necessária:** confirmar se `placehold.co`/`unsplash`/`picsum` ainda são referenciados (grep por esses domínios em `src/`). Se não, remover de `images.remotePatterns` E não os incluir no CSP — reduz superfície.
- **Aceitação:** `curl -I https://<site>` mostra o header `content-security-policy-report-only`. Navegar o site público (PT/EN, /loja, /portfolio) e o /painel sem que imagens/scripts deixem de carregar; violações aparecem só como avisos (report-only), não bloqueiam. Após promover a enforcing, nenhuma violação real no console em fluxos normais.
- **Risco/nota:** Inline scripts do Next são o maior risco — por isso começar SEMPRE em report-only e nunca saltar directo para enforcing sem nonce. Lição do vault: variáveis `NEXT_PUBLIC_*` são inlined no build/middleware; um CSP mal calibrado pode derrubar o site em produção (Vercel auto-deploy on push main). Migrar para nonce exige integração com o middleware/`headers()` dinâmicos — fica para 2.ª fase. `frame-ancestors 'none'` complementa o `X-Frame-Options` já existente.

### [SEC2] Validação zod em falta nos upserts de products e portfolio — `P1` · esforço `M`
- **Estado actual:** Existe já um padrão zod estabelecido — `src/app/api/servicos/upsert/route.ts:7,24-27` importa `servicoInputSchema` de `@/lib/validation-servico` e faz `safeParse(body)` devolvendo `400` com `issues` em falha. Os esquemas vivem em `src/lib/validation.ts`, `validation-servico.ts`, `validation-projeto.ts`, `validation-tarefa-template.ts`. **Mas:**
  - `src/app/api/products/upsert/route.ts:22-62` coerça à mão: `price: Number(body.price) || 0` (`:58` aceita preço **negativo**; `NaN` cai para 0 silenciosamente), `imageUrls` (`:28`) é `Array.isArray(...).map(String)` **sem cap nem validação de URL**, `category`/`condition` (`:50-57`) são strings livres sem enum.
  - `src/app/api/portfolio/upsert/route.ts:26-57` idem: `imageUrl`/`url` (`:36,:54`) são `String(...).trim()` sem validar formato URL; `categoria` (`:31-33`) já valida contra `SERVICO_SLUG` (bom), mas o resto é livre.
- **Alteração:**
  1. Criar `src/lib/validation-product.ts` com `productInputSchema` (zod), espelhando `validation-servico.ts`: `id` opcional string; `name`/`description`/`category`/`condition` como objectos `{ pt: string, en: string }` (`name.pt` obrigatório não-vazio); `price: z.number().nonnegative()` (rejeitar negativo/NaN); `imageUrls: z.array(z.string().url()).max(N)` (ex.: cap N=10); `available`/`featured` booleanos opcionais. Considerar `z.enum` para categorias/condições conhecidas (ou pelo menos `.max()` no comprimento das strings).
  2. Criar `src/lib/validation-portfolio.ts` com `portfolioInputSchema`: `title.pt` obrigatório; `imageUrl: z.string().url()`; `url: z.string().url().optional().or(z.literal(""))`; `categoria` validada contra `SERVICO_SLUG`; `destaqueLanding` boolean.
  3. Em ambos os routes, substituir a coerção manual por `const parsed = schema.safeParse(body); if (!parsed.success) return 400 com issues` (igual a `servicos/upsert/route.ts:24-27`), e usar `parsed.data`.
- **Aceitação:** POST a `/api/products/upsert` com `price: -5` ou `imageUrls` com 50 entradas ou URL inválida devolve `400` com `issues`; payload válido continua a gravar. Idem para portfolio com `imageUrl` não-URL. Produtos/portfolio existentes continuam a editar normalmente.
- **Risco/nota:** Confirmar a forma exacta dos campos que o frontend (`ProductForm.tsx`, `PortfolioForm.tsx`) envia para não rejeitar payloads legítimos — alinhar o schema com o que o form manda (ex.: `category` pode chegar só com `pt`). NUNCA mexer nos dados já gravados; isto valida só **entradas novas**.

### [SEC3] BlockIpButton engole erros (catch vazio) — `P2` · esforço `XS`
- **Estado actual:** `src/components/painel/BlockIpButton.tsx:21-32` faz `await fetch("/api/blocked-ips", ...)` sem verificar `res.ok`, e o `catch` (`:28-30`) está vazio (só comentário "silencioso"). Se o bloqueio falhar (rede ou 4xx/5xx) o utilizador não recebe feedback e julga que bloqueou. O padrão de toast já existe no painel — ex.: `LeadsTable.tsx:30` importa `useToast` de `@/hooks/use-toast`.
- **Alteração:** Em `BlockIpButton.tsx`: importar `useToast` de `@/hooks/use-toast`; verificar `if (!res.ok) throw new Error(...)` após o fetch; no sucesso `toast({ title: "IP bloqueado" })`, no `catch` `toast({ title: "Falha ao bloquear IP", variant: "destructive" })` (ou equivalente da API do hook). Remover o catch vazio.
- **Aceitação:** Com o endpoint a falhar (simular 500 ou offline), clicar o botão mostra um toast de erro em vez de falhar em silêncio; no sucesso mostra confirmação e `router.refresh()` corre.
- **Risco/nota:** Confirmar a assinatura de `useToast`/`toast` (variant disponível) no hook do projecto. Baixo risco — componente isolado.

### [SEC4] Produtos em DB legacy "website"/"loja" sem índices — migração segura — `P2` · esforço `M`
- **Estado actual:** `src/lib/mongodb/products.ts:9-10` tem `DB_NAME = "website"` e `COLLECTION = "loja"` hardcoded (legacy). O `init-indexes.ts` (`:9`) cria índices em `client.db(process.env.MONGODB_DB_NAME)` e **não lista** a coll de produtos — ou seja, nenhum índice é aplicado à coll viva `website.loja` (as queries em `:56-58`, `:97-99` filtram por `available`/`category` sem índice). O script `scripts/migrate-products-db.mjs` existe e é idempotente (upsert por `_id`, `:48`) mas, pelo comentário `products.ts:6-8` e o passo 4 do script, **nunca foi corrido** (o código ainda aponta para legacy).
- **Alteração (passos cautelosos, por ordem):**
  1. **Backup primeiro:** `mongodump` da coll `website.loja` (ou export Atlas) antes de tocar em nada. Guardar fora do repo.
  2. Criar `scripts/.env` com `MONGODB_URI` e `MONGODB_DB_NAME` e correr `node scripts/migrate-products-db.mjs` (idempotente — pode correr 2x sem duplicar, upsert por `_id`).
  3. Verificar em Atlas que `<MONGODB_DB_NAME>.products` tem **o mesmo nº de docs** que `website.loja` (passo 3 do script) e que `_id`s coincidem.
  4. Editar `src/lib/mongodb/products.ts:9-10` para `DB_NAME = process.env.MONGODB_DB_NAME!` e `COLLECTION = "products"`.
  5. Adicionar a `init-indexes.ts` (dentro do `Promise.all`, `:11-55`) índices para a nova coll: `db.collection("products").createIndex({ available: 1, featured: -1, createdAt: -1 })` e `db.collection("products").createIndex({ "category.pt": 1 })` (ou conforme as queries reais — ver `:56-58`, `:97-99`). NÃO usar índice único em `_id` (já existe por defeito).
  6. Deploy, validar `/loja` em produção; só **depois** de confirmar tudo OK, apagar `website.loja` (passo 5 do script) — manter o backup uns dias.
- **Aceitação:** `/loja` e o /painel da loja mostram os mesmos produtos de antes; `db.products.getIndexes()` lista os novos índices; `explain()` das queries de listagem usa `IXSCAN` em vez de `COLLSCAN`. Nenhum produto perdido (contagem igual à do backup).
- **Risco/nota:** **CONSTRAINT CRÍTICA — nunca perder/corromper dados reais.** Backup obrigatório antes do passo 2. A migração é idempotente mas a edição do código (passo 4) e o `drop` da coll legacy (passo 6) são irreversíveis sem backup. Fazer passos 4-5 num único deploy e validar antes do passo 6. Se `getProductById` (`:80-90`) usa `ObjectId` — confirmar que os `_id` migrados continuam `ObjectId` (o script preserva `doc._id`, OK).

### [SEC5] DELETE /api/projetos/[id] cascateia tarefas sem transação — `P3` · esforço `S`
- **Estado actual:** `src/app/api/projetos/[id]/route.ts:25-30` faz `getProjetoById` → `deleteTarefasByProjeto(id)` → `deleteProjeto(id)` sequencialmente, **sem transação Mongo**. Se `deleteTarefasByProjeto` (`:26`) tiver sucesso mas `deleteProjeto` (`:27`) falhar, ficam tarefas órfãs apagadas mas o projecto persiste (estado inconsistente). Sem rollback.
- **Alteração (opcional):** Envolver as duas operações numa transação Mongo (`session.withTransaction`) — requer que `clientPromise` suporte sessões e que o cluster seja replica set (Atlas é). Alternativa mais leve: inverter a ordem (apagar o projecto primeiro, depois as tarefas) para que, se a 2.ª falhar, o projecto já desapareceu e as tarefas órfãs podem ser limpas por um job/verificação posterior. Documentar a escolha.
- **Aceitação:** Apagar um projecto remove projecto + tarefas atomicamente (ou, na alternativa, sem deixar tarefas visíveis sem projecto-pai). Forçar falha no meio não deixa estado meio-apagado.
- **Risco/nota:** **Risco baixo** — app single-user, probabilidade de falha intercalada é mínima. **Decisão necessária:** vale o esforço de transação? Provavelmente adiar; registar como nota. Transações exigem replica set (confirmado em Atlas) e podem complicar o `clientPromise` partilhado.

## 🧹 Camada 1 — Limpar UI decorativa / código morto

## Cluster: Limpar/decidir UI VISÍVEL-MAS-MORTA

> Confirmado contra o código a 2026-06-29. Correcção de drift assinalada por item.

### [CLN1] Loja: tabs Encomendas/Stock/Promoções + card "Encomendas pendentes" — `P1` · esforço `XS`
- **Estado actual:** Em `src/components/painel/LojaClient.tsx:79-81` há três botões `disabled` (`Encomendas`, `Stock`, `Promoções`) ao lado da tab activa `Catálogo`. Mais abaixo (`:167-182`) há um card "Encomendas pendentes" com texto fixo "Sistema de encomendas ainda não configurado" e empty state hardcoded. Não há backend de encomendas — só catálogo de `Product` (CRUD real).
- **Alteração:** Recomendação default = **esconder agora, construir depois** (ligado ao item estratégico de e-commerce). Em `LojaClient.tsx`: (a) remover os três `<button disabled>` das linhas 79-81, deixando só a tab `Catálogo`; (b) remover o bloco do card "Encomendas pendentes" (linhas 167-182, o comentário + `<div className="card">`). Alternativa mais leve se quiseres sinalizar roadmap: manter os botões mas trocar o texto para `Encomendas (em breve)` etc. e envolver o card num rótulo "Em breve" — mas o default é remover, porque botões disabled sem tooltip não comunicam nada.
- **Aceitação:** A página `/painel/loja` mostra apenas a tab `Catálogo` e o grid de produtos; não aparecem botões cinzentos clicáveis-mas-mortos nem o card vazio de encomendas. Build passa (`pnpm build`/`next build`).
- **Risco/nota:** Nenhuma dependência de dados Mongo (só UI). Decisão necessária: confirmar que e-commerce/encomendas fica para fase futura antes de remover (vs. esconder). Não tocar na colecção `products`.

### [CLN2] Definições mockup: notificações, integrações, perfil sem submit, logo + âncoras partidas — `P1` · esforço `S`
- **Estado actual:** `src/app/(painel)/painel/definicoes/page.tsx`. Mock: const `NOTIF` (`:21-27`, 5 toggles puramente visuais `<span className="toggle">` sem handler, `:136`/`:161`), const `INTEG` (`:29-34`, Google Calendar/Stripe/MB Way/Notion com toggles falsos + botão "Adicionar" `:149` sem onClick), secção "Perfil da empresa" com `<input className="ipt" defaultValue=...>` (`:88-109`) sem `<form>`/submit, e botões "Alterar logo"/"Remover" (`:82-83`) sem handler. Secções reais e funcionais coexistem: `TabOrderSettings`, `KanbanOrderSettings`, `ProjetoTiposCustomEditor`. **Âncoras do nav partidas:** `NAV` (`:11-19`) tem ids `perfil, notif, integ, fact, user, aparencia, backup`, mas no DOM só existem secções `id="perfil"`, `id="notif"`, `id="integ"`, `id="aparencia"` (DUAS vezes — `:168` e a segunda secção Aparência em `:181` não tem id, mas a âncora `#aparencia` aponta para a primeira), e `id="backup"` está aplicado à secção de "Tipos de projecto" (`:195`), não a backups. Logo: `#fact` (Facturação) e `#user` (Utilizadores) não têm alvo nenhum → âncoras mortas; e o label "backup" leva-te a "Tipos de projecto".
- **Alteração:** Default = **esconder o mock agora**; "Perfil real" e "Notificações reais" são features próprias (cluster features), aqui só decidir o que esconder. Passos: (1) remover/comentar as secções `#perfil` (`:66-111`), `#notif` (`:114-140`) e `#integ` (`:143-165`) OU manter como "em breve" desactivando inputs e marcando com badge; o default é remover até existir persistência. (2) Limpar `NAV` (`:11-19`): tirar entradas sem secção real — `fact` e `user`; corrigir o id da secção "Tipos de projecto" de `id="backup"` para `id="projectos"` (ou criar entrada `Projectos` no NAV) e remover a entrada `backup` até existir secção real de backups. (3) ⚠️ **Correcção (revisor):** NÃO há `id` duplicado — a 2ª secção Aparência (`:181`, Kanban) é que **não tem `id`** (âncora `#aparencia` aponta para a 1ª; a 2ª fica sem alvo). Dar-lhe um id próprio (ex. `id="aparencia-kanban"`) ou fundir as duas secções. (4) Remover botões "Alterar logo"/"Remover" e const `INTEG`/`NOTIF` se as secções saírem.
- **Aceitação:** Todas as entradas do nav lateral de Definições saltam para uma secção existente (sem âncora morta); não há ids duplicados no DOM (validar no devtools); não há toggles nem inputs que pareçam editáveis mas não guardam nada. As secções reais (ordem de tabs, ordem Kanban, tipos de projecto) continuam a funcionar.
- **Risco/nota:** Decisão necessária (esconder vs. construir já) — alinhar com cluster de features (Perfil/Notificações reais). Não afecta dados Mongo. Cuidado: `getAllProjetoTiposCustom()` (`:37`) e os três componentes reais têm de continuar montados.

### [CLN3] Clientes: ícone ⋮ (MoreVertical) é só link duplicado — `P2` · esforço `XS`
- **Estado actual:** `src/app/(painel)/painel/clientes/page.tsx:140-143` — a última coluna da linha tem `<Link href={/painel/clientes/${c.id}}><MoreVertical className="row-menu" /></Link>`. O ícone "kebab" (⋮) sugere um menu de acções, mas só repete o link da própria linha (o nome do cliente em `:122` já leva ao mesmo sítio). Falsa affordance.
- **Alteração:** Default rápido = **trocar o ícone por um chevron** que comunica "abrir": importar `ChevronRight` de `lucide-react` e substituir `<MoreVertical className="row-menu" />` por `<ChevronRight className="row-menu" />` (manter o `aria-label="Abrir ficha"`). Fix bom (mais tarde): substituir por um menu real (dropdown com Editar / Ver projectos / Apagar) — fora de âmbito deste cluster.
- **Aceitação:** A coluna de acções na tabela de clientes mostra um chevron (não um kebab); clicar continua a abrir `/painel/clientes/{id}`. Nenhum utilizador espera um menu que não existe.
- **Risco/nota:** Trivial, só import + 1 linha. Sem impacto em dados.

### [CLN4] Dívidas: botão "Receber" que só abre o projecto — `P2` · esforço `XS`
- **Estado actual:** `src/app/(painel)/painel/dividas/page.tsx:199-201` — `<Link className="btn ghost tiny" href={/painel/projetos/${p.id}}><Check /> Receber</Link>`. O label "Receber" + ícone `Check` implica registar pagamento, mas só navega para a ficha do projecto. (O botão "Lembrete" ao lado, `:194-197`, é honesto — abre mailto.)
- **Alteração:** Default = **renomear para "Ver projecto"** e trocar o ícone `Check` por algo neutro (`ArrowUpRight`/`ChevronRight`). Editar linhas 199-201: label `Ver projecto`, remover import de `Check` se ficar sem uso. Fix bom (mais tarde, fora de âmbito): modal de pagamento inline que escreve na colecção de pagamentos do projecto — feature, não quick-win.
- **Aceitação:** Na página `/painel/dividas`, o botão diz "Ver projecto" e não promete uma acção de cobrança que não acontece. Clicar leva à ficha do projecto.
- **Risco/nota:** Trivial. Se `Check` ficar sem outros usos no ficheiro, remover do import para não dar warning de lint. Sem impacto em dados.

### [CLN5] Topbar search: placeholder promete âmbito que não existe — `P1` · esforço `XS`
- **Estado actual:** `src/components/painel/GlobalSearch.tsx:52` placeholder "Procurar projectos, clientes, tarefas…", mas `handleSubmit` (`:32-38`) só faz `router.push(/painel/projetos?q=...)`. Procura exclusivamente projectos; clientes e tarefas nunca são pesquisados.
- **Alteração:** Default fix rápido = ajustar o placeholder para a realidade. Editar `:52` para `placeholder="Procurar projectos…"`. Fix bom (relacionado com features, fora de âmbito): transformar em command-palette ⌘K que pesquisa projectos + clientes + tarefas e mostra resultados agrupados — exige nova rota/endpoint de pesquisa (ex.: `/api/search?q=`) e UI de dropdown.
- **Aceitação:** O placeholder da barra de pesquisa do painel reflecte exactamente o que a pesquisa faz (só projectos). Sem promessa falsa de "clientes, tarefas".
- **Risco/nota:** Trivial. Atalho ⌘K (`:21-30`) já funciona e fica intacto. Sem impacto em dados. ⚠️ **Precedência (revisor):** `CLN5` e `FEAT3` são mutuamente exclusivos — se fizeres `FEAT3` (pesquisa real a clientes+tarefas), o placeholder amplo passa a estar correcto e **não** se faz CLN5. Faz CLN5 só se adiares FEAT3.

### [DEAD1] Código e assets mortos: FilterBar, ViewToggle, heros órfãos, env.ts, businessEmail, audit magic-link — `P2` · esforço `S`
- **Estado actual (cada um confirmado):**
  - `src/components/painel/FilterBar.tsx` e `src/components/painel/ViewToggle.tsx` — **0 imports** em todo o `src/` (grep `from ".../painel/(FilterBar|ViewToggle)"` → nenhum). A página de calendário usa `CalendarViewToggle`, componente diferente.
  - Assets órfãos em `public/`: `services-hero.png` (**1.5 MB**), `shop-hero.jpg` (**57 KB** — drift: o prompt dizia 1.5MB, o pesado é o `services-hero.png`), `icone.png` (**484 KB**). Grep no código: `services-hero`/`shop-hero` → 0 referências; `icone.png` referido **apenas** no plano `claude/seo-plan.md:304` (documento, não código nem manifesto activo).
  - `src/lib/env.ts` — `serverEnv` tem **0 usos** em `src/` fora da própria definição; `SYNC_SECRET` só é lido em `scripts/sync-obsidian.mjs` (que usa `process.env.SYNC_SECRET` directamente, não este módulo). `publicEnv.baseUrl` — confirmar uso antes de mexer (não auditado aqui).
  - `businessEmail` em `src/config/contact.ts:10-11` — **0 usos** fora da definição (a app usa `contactInfo.email`).
  - `src/lib/mongodb/audit.ts:7` — tipo `"magic-link-request"` em `AuthEventType` nunca é emitido (grep do literal só acerta na própria definição); o login é por credenciais NextAuth, sem magic-link.
- **Alteração:** Default = **apagar**. (1) `rm src/components/painel/FilterBar.tsx src/components/painel/ViewToggle.tsx`. (2) `rm public/services-hero.png public/shop-hero.jpg` (e `public/icone.png` se confirmares que não é usado como favicon/manifest — está só num doc de plano; verificar `src/app/manifest.ts`/`icon.*`/`<link rel>` antes). (3) Em `src/lib/env.ts`: remover o objecto `serverEnv` inteiro e o getter `SYNC_SECRET`; manter `publicEnv` se usado. (4) Remover `businessEmail` de `src/config/contact.ts` (linhas 10-11). (5) Em `audit.ts:7`, remover `"magic-link-request"` da união `AuthEventType`. Correr `next build`/tsc após cada bloco.
- **Aceitação:** `pnpm build` (ou `next build`) passa sem erros de tipo nem imports partidos; grep posterior por cada símbolo/ficheiro não acerta em nada no código; tamanho de `public/` reduz ~2 MB.
- **Risco/nota:** Antes de apagar `icone.png` confirmar que não é referenciado por `manifest.ts`/favicon (o doc `seo-plan.md` sugere que era candidato a ícone PWA — pode ser intenção futura → **decisão necessária** para esse ficheiro específico; os outros dois heros são seguros). `serverEnv`/`SYNC_SECRET`: não tocar em `scripts/sync-obsidian.mjs` nem nas env vars Vercel — só se remove a definição morta em `src/lib/env.ts`. Nenhuma alteração toca dados reais do Mongo.

## 🟠 Camada 2 — Polir UX (otimismo, confirmações, loading)

## Cluster — Polir UX (toggles/deletes não-otimistas, sem confirmação, sem loading por-linha)

Padrão gold-standard a copiar: `src/components/painel/InlineStatusSelect.tsx` — guarda estado local (`useState`), aplica a mudança optimista, faz revert no `previous` se a API falhar, mostra `toast` destrutivo no erro, e só depois `startTransition(() => router.refresh())`. O `useConfirm` (`src/components/ui/confirm-dialog`) já é usado em LojaClient/PortfolioClient/ServicosEditor — está disponível para reutilizar.

### [UX1] TarefaChecklist — toggle/delete otimistas por-linha + confirm + revalidate do projeto — `P1` · esforço `M`
- **Estado actual:** `src/components/painel/TarefaChecklist.tsx`. `toggleFeita` (:36-46) e `deletarTarefa` (:60-67) fazem round-trip e só depois `router.refresh()` — não são otimistas. Há uma única flag `pending` de `useTransition` (:29) passada a TODOS os `TarefaItem` via `disabled={pending}` (:111,:129) → durante o refresh todas as linhas ficam bloqueadas. `deletarTarefa` (:60) apaga SEM confirmação. O endpoint `/api/tarefas/edit` (`src/app/api/tarefas/edit/route.ts` :56-58) revalida `/painel/tarefas`, `/painel/calendario`, `/painel` mas NÃO `/painel/projetos/[id]` — e este componente vive na página de projeto; o delete `/api/tarefas/[id]/route.ts` (:35-37) tem a mesma lacuna. (Comparar com `upsert` :59 e `from-template` :61 que já revalidam `/painel/projetos/${projetoId}`.)
- **Alteração:**
  1. Tornar otimista por-linha: gerir as tarefas em `useState` local (cópia das props) ou um `Set<string>` de ids `busy`. No toggle, actualizar o `feita` localmente de imediato; no erro, reverter ao valor anterior + `toast` destrutivo (copiar shape de InlineStatusSelect :62-78).
  2. Substituir a flag global `disabled={pending}` por um estado por-linha (`busyId === tarefa.id`), à semelhança de `TarefasPorProjeto` que já usa `busy` (ver UX2). Passar `disabled` só ao item afectado.
  3. Adicionar `useConfirm` (import `@/components/ui/confirm-dialog`) ao `deletarTarefa`: `await confirm({ title: 'Apagar tarefa?', confirmLabel: 'Apagar', tone: 'destructive' })` antes do `safeDelete`.
  4. Acrescentar `revalidatePath(\`/painel/projetos/${...}\`)` em `src/app/api/tarefas/edit/route.ts` (precisa do `projetoId` — ou aceitar `projetoId` opcional no payload, ou ler a tarefa antes de patch para obter o `projetoId`) e em `src/app/api/tarefas/[id]/route.ts` (ler tarefa antes de apagar para saber o `projetoId`).
- **Aceitação:** Marcar/desmarcar um checkbox actualiza a UI instantaneamente; outras linhas continuam clicáveis durante o refresh; apagar pede confirmação; após editar/apagar, voltar à página do projeto noutro tab mostra estado correcto (cache revalidada).
- **Risco/nota:** O endpoint de delete precisa de ler o `projetoId` da tarefa antes de apagar (uma leitura extra). NUNCA tocar nos dados reais do Mongo além do patch/delete que já existe. Decisão: aceitar `projetoId` no payload do `edit` (mais simples) vs. ler server-side (mais robusto).

### [UX2] TarefasPorProjeto — toggle/delete otimistas + confirm no delete — `P1` · esforço `M`
- **Estado actual:** `src/components/painel/TarefasPorProjeto.tsx`. Já tem `busy` por-linha (:81, :206 `busy === t.id || pending`), melhor que TarefaChecklist. Mas `toggleFeita` (:112-124) e `deleteTarefa` (:126-135) continuam não-otimistas: marcam `busy`, esperam o round-trip e só então `router.refresh()` — o checkbox "arrasta" até o servidor responder. `deleteTarefa` (:126) apaga SEM confirmação (o botão Trash :232 chama directamente).
- **Alteração:**
  1. Tornar otimista: manter as tarefas em `useState` local derivado das props e flipar `feita` de imediato no toggle; reverter no erro + `toast` (já tem o toast :119-122).
  2. Adicionar `useConfirm` ao `deleteTarefa` antes do `safeDelete` (mesma string sugerida em UX1). Opcionalmente remover otimisticamente o item da lista e re-inserir no erro.
  3. Beneficia automaticamente do revalidate adicionado em UX1 (mesmos endpoints `/api/tarefas/edit` e `/api/tarefas/[id]`).
- **Aceitação:** Clicar no checkbox marca/desmarca sem latência percetível; apagar pede confirmação; em falha de rede a UI reverte e mostra toast.
- **Risco/nota:** Atenção ao re-render: as props (`tarefas`) mudam após `router.refresh()`, é preciso reconciliar o estado local com as novas props (ex.: `key` no componente ou efeito de sync). NÃO alterar a lógica de filtros/ordenação existente.

### [UX3] tarefas: scope mismatch entre página e botão de criação — `P0` · esforço `S`
- **Estado actual:** `src/app/(painel)/painel/tarefas/page.tsx` :34 filtra para mostrar SÓ tarefas de projetos com estado `em-curso` ou `proximo` (`const emAberto = new Set(["em-curso", "proximo"])`). Mas `src/components/painel/NovaTarefaGlobalButton.tsx` :32-37 permite escolher projetos em `ACTIVE_STATUSES = STATUS_GROUPS.ativo + proximo + aguarda + pronto` = `em-curso, proximo, aguardando-cliente, aguardando-encomenda, terminado` (confirmado em `src/types/projeto.ts` :28-34). Resultado: criar tarefa num projeto `aguardando-cliente`/`aguardando-encomenda`/`terminado` cria a tarefa mas ela fica INVISÍVEL na lista.
- **Alteração:** Alinhar os dois conjuntos. Recomendado: extrair uma constante única partilhada (ex.: em `src/types/projeto.ts`, algo como `TAREFAS_VISIBLE_STATUSES`) e usá-la tanto no filtro da página (`page.tsx` :34) como no `ACTIVE_STATUSES` do botão. Decidir o conjunto: ou alargar a página para incluir `aguarda` + `terminado` (mais consistente com o que o botão oferece), ou restringir o botão a `em-curso, proximo`. Sugiro alargar a página (não esconder trabalho já criado).
- **Aceitação:** Criar uma tarefa em qualquer projeto oferecido pelo selector do botão "Nova tarefa" → essa tarefa aparece de imediato na lista `/painel/tarefas` (após o refresh já existente).
- **Risco/nota:** Decisão necessária do Iuri sobre o conjunto exacto. P0 porque é perda de dados percebida pelo utilizador (tarefa "desaparece").

### [UX4] ImageUploadZone — adiar delete do blob para reconciliação no save — `P1` · esforço `M`
- **Estado actual:** `src/components/painel/ImageUploadZone.tsx` :164-169. `removeAt` chama `onChange(value.filter(...))` E imediatamente `safeJsonPost("/api/upload/product-image/delete", { url })` — apaga o blob no Vercel Blob na hora. Como o componente é usado em formulários (ServicosEditor :515, PortfolioForm :105, ProductForm) onde o save é separado: se o utilizador remove uma imagem JÁ guardada e depois cancela/fecha o form sem guardar, o blob foi apagado mas a referência continua no Mongo → imagem partida na página pública.
- **Alteração:** Não apagar o blob no `removeAt`. Apenas remover da lista local (`onChange`). A limpeza de blobs órfãos deve acontecer server-side no momento do save (upsert), comparando o array de URLs antigo vs. novo e apagando os que saíram. ⚠️ **Correcção do revisor:** a reconciliação server-side **JÁ EXISTE** em `/api/products/upsert` (~:30-67) e `/api/portfolio/upsert` (~:38-61) — fazem diff do array antigo vs. novo + `deleteManagedBlob(s)` depois do save. NÃO é preciso construí-la. Acção real: (1) **remover** a chamada `safeJsonPost(".../delete")` do `removeAt` em `ImageUploadZone.tsx:168` (deixar só o `onChange`) — isto sozinho resolve "remover imagem guardada + cancelar form", porque o save passa a tratar a limpeza; (2) **verificar** se `/api/servicos/upsert` tem a mesma reconciliação e, se faltar, adicionar lá o mesmo diff + `deleteManagedBlob`. Para imagens recém-carregadas mas nunca guardadas (cancela o form), aceitar como blob órfão tolerável OU limpar quando o form desmonta sem save (mais complexo — pode ficar para depois).
- **Aceitação:** Abrir editar de um serviço/produto com imagem, remover a imagem, fechar o form SEM guardar → a imagem continua a aparecer no site público. Remover + Guardar → o blob é efectivamente apagado.
- **Risco/nota:** Requer mexer em múltiplos endpoints de upsert. Verificar todos os consumidores de `ImageUploadZone` (grep `ImageUploadZone`). NUNCA apagar blobs ainda referenciados no Mongo. Decisão: como tratar uploads novos abandonados (cancelar form) — aceitável deixar órfão por agora.

### [UX5] ServicosEditor — erro por-card + chave estável + Trash desativado no save — `P2` · esforço `M`
- **Estado actual:** `src/components/painel/ServicosEditor.tsx`. Um único `error` string partilhado por todos os cards (:109, mostrado uma vez no topo :282-286) — validação falhada num card (ex.: :178 "Título obrigatório", :194 "Preço inválido") aparece global e é pisada pelo card seguinte. Drafts usam chave por índice: `key={d.id ?? \`new_${idx}\`}` (:293) e `savingId` também usa `new_${idx}` (:207, :518, :528-530); reordenar/remover drafts novos dessincroniza a identidade. O botão Trash (:536-543) NÃO é desativado durante o save (só o botão Guardar :528 verifica `savingId`).
- **Alteração:**
  1. Erro por-card: substituir `error: string|null` global por erro no próprio `Draft` (ex.: campo `error?: string` em cada item) e renderizar inline dentro do card respectivo.
  2. Chave estável: gerar um `uid` (ex.: `crypto.randomUUID()`) em `emptyDraft` (:80) e usá-lo como `key` e como token de `savingId` em vez de `new_${idx}`. Substituir todas as ocorrências de `new_${idx}` (:207, :518, :528, :530).
  3. Desativar o Trash durante o save: adicionar `disabled={savingId === <uid do draft>}` ao botão remover (:536-543).
- **Aceitação:** Validação falhada num card mostra o erro só nesse card; adicionar vários cards novos e guardar um deles não afecta os outros (loading correcto); durante um save o Trash desse card está desativado.
- **Risco/nota:** Mudar a `key` força remontagem dos cards já existentes uma vez (aceitável). Não alterar o payload enviado ao `/api/servicos/upsert`.

### [UX6] Loja/Portfólio — loading por-linha no delete + redirect após editar em [id] + validar URL — `P2` · esforço `M`
- **Estado actual:**
  - `src/components/painel/LojaClient.tsx` :157 — botão Apagar chama `handleDelete` (:50-66) que tem `useConfirm` mas NÃO marca loading por-linha; durante o await é possível duplo-clique (sem `disabled`).
  - `src/components/painel/PortfolioClient.tsx` :143 — mesmo padrão, `handleDelete` (:54-70) sem loading por-linha.
  - `src/app/(painel)/painel/loja/[id]/page.tsx` :31 renderiza `<ProductForm product={product} />` SEM `onSaved`/`onCancel`; e `src/app/(painel)/painel/portfolio/[id]/page.tsx` :31 renderiza `<PortfolioForm item={item} />` igualmente sem `onSaved`. O `PortfolioForm` (:76) chama `onSaved?.()` — mas como não é passado, após guardar fica na página de detalhe (só toast + refresh), sem voltar à lista.
  - `src/components/painel/PortfolioForm.tsx` :60-66 — o campo `url` (:114-115, placeholder `https://...`) é enviado com `url.trim()` SEM validação de formato; aceita qualquer string.
- **Alteração:**
  1. Loading por-linha no delete: em LojaClient e PortfolioClient, adicionar `useState<string|null>` `deletingId`; ao iniciar `handleDelete` marcar o id, no `finally` limpar; passar `disabled={deletingId === id}` ao botão Apagar (LojaClient :157, PortfolioClient :143) para evitar duplo-clique.
  2. Redirect após editar: nas páginas `[id]`, passar `onSaved` ao form que faça `router.push('/painel/loja')` / `/painel/portfolio` (criar um pequeno client wrapper, pois as páginas são Server Components — ou converter num client component que use `useRouter`). Em alternativa, o form pode aceitar uma prop `redirectTo`.
  3. Validar URL no PortfolioForm: antes do submit (:48-57) validar `url` com `new URL(url)` (ou regex `^https?://`) quando não-vazio; em caso inválido `setError("URL inválido — usa http(s)://...")` e abortar.
- **Aceitação:** Clicar Apagar duas vezes rápido não dispara dois deletes; após guardar a edição em `/painel/loja/[id]` o utilizador volta à lista `/painel/loja`; introduzir um URL sem `http(s)://` no portfólio bloqueia o save com mensagem.
- **Risco/nota:** As páginas `[id]` são Server Components — o redirect precisa de lógica client (`useRouter`); avaliar criar wrapper. Confirmar se `ProductForm` já expõe `onSaved` (LojaClient :94 usa-o, logo existe). Não alterar a lógica de upsert.

### [UX7] Kanban sem drag-and-drop — `P3` · esforço `XL`
- **Estado actual:** `src/components/painel/KanbanBoard.tsx`. Renderiza colunas por estado (:81-115) com `TarefaCard` por projeto; a mudança de estado é feita apenas pelo dropdown `InlineStatusSelect` dentro do card. Não há arrastar cartões entre colunas.
- **Alteração:** Integrar `@dnd-kit/core` + `@dnd-kit/sortable`. Tornar cada `TarefaCard` arrastável e cada coluna uma drop-zone; `onDragEnd` chama `/api/projetos/edit` (`field: "status"`) com optimistic update (reaproveitar a lógica de InlineStatusSelect). Manter o dropdown como fallback acessível.
- **Aceitação:** Arrastar um cartão de "Em curso" para "Terminado" muda o estado do projeto (persistido) com update otimista; teclado/leitor de ecrã continuam a funcionar via dropdown.
- **Risco/nota:** Nova dependência (`@dnd-kit`, ~bundle). Esforço alto; deixar para depois conforme indicado. Garantir que o DnD não conflitua com `stopPropagation` dos selects/links dentro do card. Persistência via endpoint existente — NÃO inventar nova colecção.

## ⭐ Camada 2 — Features novas do painel

## CLUSTER — Features novas do PAINEL (mockup → real)

Padrões confirmados na auditoria (a seguir em todos os itens):
- Loaders Mongo: `src/lib/mongodb/*.ts`, `import "server-only"`, `getDb()` de `./client`, projeção `{ _id: 0 }` (ver `clientes.ts:1-33`, `leads.ts:1-54`).
- Rotas: `withAuth`/`parseJson`/`apiOk`/`apiError` de `src/lib/api.ts:13-80`; `export const dynamic = "force-dynamic"`.
- Audit: `logMutation({collection, entityId, op, userEmail, after})` de `src/lib/mongodb/mutation-audit.ts:21-36`.
- Índices: registar em `src/lib/mongodb/init-indexes.ts` (bloco `Promise.all`, linhas 11-55).
- Client save: `safeJsonPost` + `useToast` (ver `InlineStatusSelect.tsx:19-79`); upload Blob via `POST /api/upload/product-image` (`route.ts`, devolve `{url}`).
- **CONSTRAINT: zero migração de dados reais — só colecções/código NOVOS (`settings`). Nunca tocar em `projetos`/`clientes`/`tarefas`/`leads`/`pagamentos` existentes.**

---

### [FEAT1] Definições REAIS — perfil da empresa persistido — `P2` · esforço `M`
- **Estado actual:** `src/app/(painel)/painel/definicoes/page.tsx` é um mockup. O cartão "Perfil da empresa" (linhas 66-111) usa `<input defaultValue="RedDune Solutions" />`, NIF/Telefone vazios com `placeholder="—"`, e o logo é `Image src="/logo-mark.png"` (linha 76) estático. Os botões "Alterar logo"/"Remover" (linhas 82-83) não têm handler. Nada persiste. Não existe colecção `settings` nem `src/lib/mongodb/settings.ts` (confirmado: `ls src/lib/mongodb/` não tem `settings.ts`).
- **Alteração:**
  1. **Tipo** — criar `src/types/settings.ts`: `export interface CompanySettings { nomeLegal: string; nif: string | null; email: string | null; telefone: string | null; morada: string | null; logoUrl: string | null; atualizadoEm: string; }`. O `id` fixo `"company"` é só campo de query, não vai no tipo público.
  2. **Loader** — criar `src/lib/mongodb/settings.ts` (modelar em `clientes.ts`): colecção `"settings"`, doc único `{ id: "company" }`.
     - `getCompanySettings(): Promise<CompanySettings>` — `findOne({ id: "company" }, { projection: { _id: 0, id: 0 } })`; se `null`, devolver defaults sensatos (`nomeLegal: "RedDune Solutions"`, `email: "reddunesolutions@gmail.com"`, restantes `null`) — **nunca lança, nunca escreve no GET**.
     - `saveCompanySettings(data): Promise<void>` — `updateOne({ id: "company" }, { $set: { ...data, id: "company", atualizadoEm } }, { upsert: true })`.
  3. **Validação** — criar `src/lib/validation-settings.ts` com zod (modelar em `clienteSchema`, `validation-projeto.ts:70-79`): `companySettingsSchema = z.object({ nomeLegal: z.string().min(1).max(200), nif: z.string().max(20).nullable(), email: z.string().email().max(200).nullable().or(z.literal("").transform(()=>null)), telefone: z.string().max(50).nullable(), morada: z.string().max(500).nullable(), logoUrl: z.string().url().max(1000).nullable() })`.
  4. **Rota** — criar `src/app/api/settings/route.ts`:
     - `export const GET = withAuth(async () => apiOk({ settings: await getCompanySettings() }))`.
     - `export const PUT = withAuth(async (session, request) => { const p = await parseJson(request, companySettingsSchema); if (!p.ok) return p.response; const before = await getCompanySettings(); await saveCompanySettings(p.data); await logMutation({ collection:"settings", entityId:"company", op:"update", userEmail: session.user.email ?? null, before, after: p.data }); revalidatePath("/painel/definicoes"); return apiOk({ ok:true }); })`.
  5. **Índice** — em `init-indexes.ts` adicionar `db.collection("settings").createIndex({ id: 1 }, { unique: true })` no `Promise.all`.
  6. **UI** — extrair o cartão "Perfil da empresa" para `src/components/painel/CompanyProfileForm.tsx` (`"use client"`); a page passa `settings={await getCompanySettings()}` como prop. Inputs **controlados** (`useState` por campo). Botão "Guardar" → `safeJsonPost`... (na verdade PUT: usar `safeFetch`/`fetch` com `method:"PUT"` para `/api/settings`) + `useToast` em sucesso ("Perfil guardado") e erro. Logo: reutilizar `ImageUploadZone` (já existe em `src/components/painel/ImageUploadZone.tsx`) ou o fluxo do `POST /api/upload/product-image` que devolve `{url}` → guardar em `logoUrl`; o `<Image>` da page passa a `src={settings.logoUrl ?? "/logo-mark.png"}`. "Remover" → `logoUrl = null`.
- **Aceitação:** Em `/painel/definicoes`, editar NIF/telefone/morada e Guardar → toast de sucesso; F5 mantém os valores (vieram do Mongo). Carregar novo logo → preview muda e persiste após reload. Doc `settings/company` aparece no Mongo; `audit_log` regista `op:"update", collection:"settings"`. GET `/api/settings` autenticado devolve `{settings:{...}}`; sem sessão devolve 401.
- **Risco/nota:** Colecção `settings` é nova — sem conflito com dados reais. Estes campos são a **base para FEAT futura de faturação/emails** (NIF/morada/logo no PDF). **Decisão necessária (menor):** se o logo é PNG/SVG até 2 MB, o `product-image/route.ts` actual só aceita jpeg/png/webp e `5MB` — reutiliza-se tal qual (SVG fica de fora; aceitável) OU cria-se `POST /api/upload/logo` que aceita `image/svg+xml`. Recomendo reutilizar e adiar SVG.

---

### [FEAT2] Sino real — notificações in-app derivadas de leads + audit_log — `P2` · esforço `M`
- **Estado actual:** `src/components/painel/Topbar.tsx:66-68` é um `<button class="btn ghost icon">` com ícone `Bell` e **sem onClick, sem badge** — o próprio comentário do componente diz "Bell is decorative for now" (linha 21). O Topbar é **server component** renderizado por CADA página (ex.: `definicoes/page.tsx:41`, `projetos/page.tsx`), não no layout. Já existe `countLeadsNovos()` (`leads.ts:51-54`) e `getRecentAuditEntries(limit)` (`mutation-audit.ts:49-58`). Há push self-hosted (CL1) mas isso é **fora** da app.
- **Decisão (sem over-engineering):** **NÃO criar colecção `notifications`.** Derivar tudo de dados que já existem: badge = `countLeadsNovos()`; dropdown = últimos N leads novos + últimas N entradas de `audit_log`. Justificação: a única fonte de "coisa nova que exige acção" hoje são os leads; o audit_log dá o "feed de actividade". Uma colecção `notifications` exigiria escrever em cada mutação (acoplamento) sem benefício real nesta fase. Push (fora) e sino (dentro) ficam assim coerentes e ambos alimentados pelos mesmos leads.
- **Alteração:**
  1. **Rota** — criar `src/app/api/notifications/route.ts`: `export const GET = withAuth(async () => { const [novos, recentes] = await Promise.all([countLeadsNovos(), getAllLeads()]); const auditoria = await getRecentAuditEntries(8); return apiOk({ badge: novos, leadsNovos: recentes.filter(l=>l.estado==="novo").slice(0,5).map(({id,nome,subject,criadoEm})=>({id,nome,subject,criadoEm})), atividade: auditoria.map(a=>({collection:a.collection, op:a.op, at:a.at})) }); })`. (Reusa loaders existentes; nada novo no Mongo.)
  2. **Componente** — criar `src/components/painel/NotificationsBell.tsx` (`"use client"`): renderiza o botão `Bell` + badge `(n)` quando `badge>0`; ao clicar abre dropdown (Popover do shadcn já usado no projecto, ou um `<div>` posicionado). Faz `fetch("/api/notifications")` em `useEffect` no mount + `setInterval` 60s (ou ao abrir). Secções: "Leads novos" (cada um linka `/painel/leads`), "Actividade recente" (linka `/painel/auditoria`). Rodapé com 2 links: "Ver leads" → `/painel/leads`, "Ver auditoria" → `/painel/auditoria`.
  3. **Integração** — em `Topbar.tsx` substituir o `<button>` decorativo (linhas 66-68) por `<NotificationsBell />`. Como Topbar é server e o sino é client, basta importar o componente client (boundary normal). Não precisa passar props — o sino busca os dados.
  4. Remover o comentário "Bell is decorative for now" (linha 21).
- **Aceitação:** Com ≥1 lead `estado:"novo"`, o sino mostra badge com o número; clicar abre dropdown que lista os leads novos e a actividade recente; clicar num lead/​link navega para `/painel/leads` ou `/painel/auditoria`. Marcar todos os leads como "contactado" → após refresh/intervalo o badge desaparece. Sem sessão, `/api/notifications` devolve 401.
- **Risco/nota:** Read-only — não escreve em lado nenhum, zero risco para dados reais. `getRecentAuditEntries` já existe e está indexado (`audit_log {at:-1}`, `init-indexes.ts:44`). **Nota de scope:** badge baseado em "leads novos" pode ficar permanentemente a 0 se o Iuri nunca usar o estado "novo"; é o comportamento honesto pedido (sino reflecte o que existe). Polling de 60s é suficiente; não vale a pena SSE/websockets aqui.

---

### [FEAT3] Pesquisa global a sério — alargar a clientes + tarefas — `P1` · esforço `M`
- **Estado actual:** `src/components/painel/GlobalSearch.tsx` tem placeholder `"Procurar projectos, clientes, tarefas…"` (linha 52) mas `handleSubmit` (linhas 32-38) **só** faz `router.push("/painel/projetos?q=...")`. A page de projetos filtra server-side via `applyFilters` (`filter-projetos.ts:3-31`), que pesquisa apenas dentro de projetos (titulo/clienteNome/proximaAccao/notasResumo/tipo). Ou seja: o placeholder **mente** — clientes e tarefas nunca são pesquisados.
- **Decisão:** Alargar a sério (é P1, alto valor e o esforço é contido reusando loaders existentes). Criar uma **página de resultados unificada** `/painel/procurar?q=` que pesquisa as 3 colecções em memória (datasets pequenos; os loaders `getAllProjetos/getAllClientes/getAllTarefas` já são usados na sidebar — `layout.tsx:39-42`).
- **Alteração:**
  1. **Página** — criar `src/app/(painel)/painel/procurar/page.tsx` (`dynamic = "force-dynamic"`), recebe `searchParams: { q }`. Faz `Promise.all([getAllProjetos(), getAllClientes(), getAllTarefas()])`, filtra cada um por substring case-insensitive: projetos via `applyFilters(projetos,{q})` (reuso); clientes por `nome/email/telefone/nif/morada`; tarefas por `titulo/notas`. Renderiza `<Topbar title="Resultados" description={...} />` + 3 secções (Projectos/Clientes/Tarefas) com contagem por grupo e links: projeto → `/painel/projetos/{id}`, cliente → `/painel/clientes/{id}`, tarefa → `/painel/projetos/{projetoId}`. Empty state por grupo quando 0.
  2. **GlobalSearch** — em `GlobalSearch.tsx:36` trocar o destino de `/painel/projetos?q=` para `/painel/procurar?q=`. Manter ⌘K e o `useTransition`.
  3. (Opcional, baixo custo) extrair os matchers cliente/tarefa para `src/lib/search-painel.ts` (`matchCliente(c,q)`, `matchTarefa(t,q)`) para serem testáveis/reutilizáveis.
- **Aceitação:** Escrever um nome de cliente na barra e Enter → vai para `/painel/procurar?q=...` e mostra esse cliente na secção "Clientes" (e projetos/tarefas que batam). Pesquisar um título de tarefa → aparece na secção "Tarefas" e linka para o projeto. Placeholder deixa de ser mentira. Sem `q`, a página mostra estado vazio com convite a pesquisar.
- **Risco/nota:** Filtragem em memória é aceitável dado o volume actual (mesmo padrão da sidebar). **Decisão necessária:** se preferir o caminho mínimo (S em vez de M), a alternativa é manter só projetos e corrigir o placeholder para `"Procurar projectos…"` — mas recomendo o alargamento, pois clientes/tarefas são procuras frequentes e o ganho de UX justifica. Read-only, zero risco para dados. Se mais tarde o volume crescer, migrar para `$text` index Mongo (mudança localizada nos loaders).

## 📰 Camada 2/3 — Mais conteúdo no site público

## Mais informação — Site público

### [OG1] Corrigir og-image.png em falta no layout — `P0` · esforço `XS`
- **Estado actual:** `src/app/layout.tsx:69` e `:75` referenciam `/og-image.png` em `openGraph.images` e `twitter.images`, mas não existe `public/og-image.*` (confirmado: glob `public/og-image.*` → sem resultados). Logo, qualquer scraper que leia esses metadados estáticos aponta para um ficheiro 404. Ao mesmo tempo já existe um OG dinâmico funcional em `src/app/opengraph-image.tsx` (rota convencional Next que gera 1200x630 com a paleta Oasis) e o builder JSON-LD já usa `${base()}/opengraph-image` (`src/lib/structured-data.ts:31`).
- **Alteração:** Recomendado remover as referências estáticas e deixar a convenção `opengraph-image.tsx` tratar tudo (o Next injecta automaticamente as tags `og:image`/`twitter:image` a apontar para `/opengraph-image`). Em `src/app/layout.tsx`: apagar a linha `images: [{ url: "/og-image.png", width: 1200, height: 630 }]` do bloco `openGraph` (manter `siteName` e `type`) e apagar a linha `images: ["/og-image.png"]` do bloco `twitter` (manter `card`). Não criar `public/og-image.png` (seria duplicação do que o `opengraph-image.tsx` já faz e ficaria dessincronizado). Alternativa só-se-quiser-estático: gerar `public/og-image.png` 1200x630 com a marca e apagar `opengraph-image.tsx` — não recomendado por perder a geração automática.
- **Aceitação:** Validar o URL de produção em https://www.opengraph.xyz/ ou no debugger do Facebook/LinkedIn: a pré-visualização mostra a imagem Oasis ("A resposta certa.") sem 404. `view-source` da home não contém `og-image.png`; contém `<meta property="og:image" content=".../opengraph-image...">`.
- **Risco/nota:** Nenhum dado Mongo envolvido. Trivial e sem risco visual. Garante que partilhas em redes sociais não ficam sem imagem.

### [FAQ] Página /faq geral i18n + JSON-LD FAQPage — `P1` · esforço `M`
- **Estado actual:** Existe o padrão de FAQ a nível de serviço (`src/app/servicos/[slug]/page.tsx` usa `faqPageLd`) e o builder `faqPageLd(faqs)` já está pronto em `src/lib/structured-data.ts:152`. Não existe rota `/faq` geral (glob `src/app/{blog,faq,testemunhos}/**` → sem resultados) nem entrada no sitemap (`src/app/sitemap.ts` lista só as 11 rotas actuais) nem no Footer (`src/components/layout/Footer.tsx` lista services/portfolio/shop).
- **Alteração:** (1) Criar `src/app/faq/page.tsx` (server component) seguindo o esqueleto de `src/app/portfolio/page.tsx`: `Header` + `PageHero` + secção de accordion (reutilizar o componente de accordion já usado nas páginas de serviço) + `CTAWave` + `Footer`, com `generateMetadata()` (title/description via `getTranslations`). (2) Conteúdo das perguntas em `messages/pt.json` e `messages/en.json` sob uma nova chave `FaqPage` (estático i18n; não precisa Mongo — perguntas gerais tipo "Onde estão?", "Fazem deslocações?", "Que garantia dão?", "Recuperam dados de discos danificados?", "Quanto custa X?"). (3) Injectar JSON-LD chamando `faqPageLd(...)` + `jsonLdScript(...)` num `<script type="application/ld+json">` dentro da página (mesmo padrão de `servicos/[slug]`). (4) Adicionar `{ path: "/faq", changeFrequency: "monthly", priority: 0.6 }` a `src/app/sitemap.ts`. (5) Adicionar `<FooterLink href="/faq">` no Footer e (opcional) no Header.
- **Aceitação:** `/faq` rende em PT e EN (trocar locale muda o texto), o accordion abre/fecha, `/sitemap.xml` inclui `/faq`, e o Rich Results Test do Google reconhece um `FAQPage` válido na página.
- **Risco/nota:** Decisão necessária: lista exacta de perguntas/respostas (o Iuri deve fornecer o conteúdo real; o agente só monta a estrutura). Manter consistência com o JSON-LD FAQ já existente nas páginas de serviço para não duplicar perguntas idênticas.

### [TEST] Testemunhos de clientes (home + página) — `P2` · esforço `L`
- **Estado actual:** Não há testemunhos em lado nenhum (sem componente, sem colecção, sem secção na home). O projecto já tem padrão consolidado para conteúdo editável: tipos bilingues `{pt,en}` (ex. `src/types/portfolio.ts`, `src/types/product.ts` com `LocalizedText`), data-layer Mongo (`src/lib/mongodb/portfolio.ts` com `getAll/upsert/delete`), API CRUD (`src/app/api/portfolio/{route,upsert,[id]}/route.ts`) e gestão no painel (`src/app/(painel)/painel/portfolio/page.tsx` + `PortfolioClient`).
- **Alteração:** Decisão: dinâmico (recomendado, gerível) vs estático JSON. Caminho dinâmico, seguindo o padrão portfólio:
  (1) Tipo `src/types/testimonial.ts`: `{ id, nome: string, empresa?: string, texto: {pt,en}, fotoUrl?: string, rating?: number, destaque: boolean, createdAt }`.
  (2) Data-layer `src/lib/mongodb/testimonials.ts` (DB `website`, colecção nova `testimonials`) com `getAllTestimonials`, `getDestaques`, `upsertTestimonial`, `deleteTestimonial` (copiar estrutura de `portfolio.ts`, incl. `mapDoc` defensivo).
  (3) API `src/app/api/testimonials/{route,upsert,[id]}/route.ts` espelhando `api/portfolio`.
  (4) Painel: `src/app/(painel)/painel/testemunhos/page.tsx` + `TestimonialsClient` (copiar `PortfolioClient`) e adicionar item à sidebar do painel.
  (5) Render público: componente `src/components/sections/Testimonials.tsx` (Oasis v5 + `Reveal`) usado na home (inserir entre secções existentes) e opcionalmente página `/testemunhos`.
  (6) Foto via Vercel Blob (mesmo fluxo de upload já usado na loja/portfólio).
- **Aceitação:** Criar/editar/apagar um testemunho no painel reflecte-se na home; texto muda com o locale PT/EN; sem testemunhos a secção não aparece (graceful empty). Imagem otimizada via `next/image`.
- **Risco/nota:** NUNCA mexer em dados reais existentes no Mongo — `testimonials` é colecção nova. Decisão necessária: dinâmico vs JSON estático (se forem poucos e fixos, JSON em `content/{pt,en}/testimonials.json` poupa o CRUD e baixa o esforço para M).

### [CASE] Estudos de caso — página /portfolio/[slug] própria — `P2` · esforço `L`
- **Estado actual:** Os cards do portfólio só linkam para URL externo: `PortfolioCardShared` (`src/components/sections/PortfolioCardShared.tsx:45`) usa `href = hrefOverride ?? (item.url || hrefFallback || "/contacto?from=portfolio")` e abre em `target="_blank"`. O tipo `PortfolioItem` (`src/types/portfolio.ts:11`) só tem `title/imageUrl/url/categoria/destaqueLanding` — não há corpo, galeria, nem slug. Não existe rota `/portfolio/[slug]` (só `/portfolio/page.tsx`). Sitemap não inclui itens individuais.
- **Alteração:**
  (1) Estender `PortfolioItem` (`src/types/portfolio.ts`) com campos opcionais: `slug?: string`, `corpo?: {pt,en}` (markdown), `galeria?: string[]`, `desafio?: {pt,en}`, `solucao?: {pt,en}`, `resultado?: {pt,en}`, `cliente?: string`, `data?: string`. Manter `url` como link externo opcional.
  (2) Atualizar `mapDoc`/`upsertPortfolioItem` em `src/lib/mongodb/portfolio.ts` para ler/gravar os novos campos (defensivo, todos opcionais — não quebra docs existentes) e adicionar `getPortfolioItemBySlug(slug)`.
  (3) Criar `src/app/portfolio/[slug]/page.tsx` (server, ISR via `export const revalidate`), com `generateMetadata` (OG/canonical), hero + galeria + blocos Desafio/Solução/Resultado, render de markdown, e JSON-LD (`CreativeWork`/`Article`). `generateStaticParams` opcional.
  (4) Em `PortfolioCardShared`: se o item tiver `slug` e corpo, linkar internamente para `/portfolio/${slug}` (sem `target=_blank`); senão manter o comportamento actual (link externo/contacto) — backward-compatible.
  (5) Painel: estender `PortfolioClient` (form em `src/app/(painel)/painel/portfolio/[id]/page.tsx` e componente) com os novos campos.
  (6) Sitemap: adicionar geração dinâmica das entradas `/portfolio/[slug]` em `src/app/sitemap.ts` (tornar a função `async` e mapear `getAllPortfolioItems()` que tenham slug+corpo).
- **Aceitação:** Um item com corpo abre `/portfolio/[slug]` interno (mais tempo no site) com galeria e secções; itens sem corpo continuam a linkar externo como hoje. A página individual aparece no `/sitemap.xml` e passa no Rich Results Test.
- **Risco/nota:** NUNCA mexer nos docs reais já em `portfolio` — todos os campos novos são opcionais e o `mapDoc` continua a aceitar docs antigos. Garantir slug único (validar no upsert). Sanitizar markdown se for input livre.

### [BLOG] Blog / Artigos bilingue com CRUD no painel + SEO — `P2` · esforço `XL`
- **Estado actual:** Não existe blog (glob `src/app/{blog,faq,testemunhos}/**` → vazio). Existe toda a infra de referência: tipos bilingues, data-layer Mongo (`src/lib/mongodb/portfolio.ts`), API CRUD (`src/app/api/portfolio/*`), gestão no painel (`painel/portfolio`), sitemap estático (`src/app/sitemap.ts`), builders JSON-LD (`src/lib/structured-data.ts`) e `opengraph-image.tsx` dinâmico.
- **Alteração:**
  (1) Tipo `src/types/post.ts`: `{ id, slug, titulo:{pt,en}, excerto:{pt,en}, corpo:{pt,en} (markdown), coverUrl?, categoria?, autor?, publicado: boolean, data: string }`.
  (2) Data-layer `src/lib/mongodb/posts.ts` (DB `website`, colecção nova `posts`): `getAllPublished`, `getBySlug`, `getAllAdmin`, `upsertPost`, `deletePost` (padrão `portfolio.ts`, com `mapDoc` defensivo e filtro `publicado:true` no público).
  (3) API `src/app/api/posts/{route,upsert,[id]}/route.ts` (espelhar `api/portfolio`, proteger upsert/delete com a sessão NextAuth como nas rotas do painel).
  (4) Páginas públicas: `src/app/blog/page.tsx` (lista de cards, ISR `revalidate`) e `src/app/blog/[slug]/page.tsx` (artigo, ISR, render markdown, `generateMetadata` com OG/canonical/`alternates`).
  (5) JSON-LD: adicionar builder `articleLd(...)` em `src/lib/structured-data.ts` (type `Article` com headline/datePublished/author/image) e injectar em `blog/[slug]`.
  (6) Sitemap: tornar `src/app/sitemap.ts` `async` e juntar `/blog` + cada `/blog/[slug]` publicado.
  (7) Navegação: `<FooterLink href="/blog">` no Footer e link no Header.
  (8) Painel: `src/app/(painel)/painel/blog/page.tsx` + `BlogClient` (editor de markdown/campos PT+EN, toggle publicado), item na sidebar; cover via Vercel Blob.
- **Aceitação:** Criar post no painel (publicado) → aparece em `/blog` e em `/blog/[slug]` nos dois idiomas; rascunho (não publicado) não aparece no público mas sim no painel; artigo passa no Rich Results Test como `Article`; ambos os URLs aparecem em `/sitemap.xml`.
- **Risco/nota:** Esforço XL — é o maior do cluster; faseável (MVP = listagem + artigo + 1 post seed antes do CRUD completo). NUNCA mexer noutras colecções; `posts` é nova. Decisão necessária: editor de markdown (textarea simples vs editor rico) e se o corpo PT/EN é obrigatório nos dois ou permite só um idioma. Considerar sanitização do markdown.

### [NEWS] Newsletter / captura de email (dependente de canal de envio) — `P3` · esforço `M`
- **Estado actual:** Não há captura de newsletter. O envio de email foi removido — `CLAUDE.md` confirma "Resend removido" e o commit recente "contact: remove Resend, save submissions as leads only". O formulário de contacto hoje só grava leads no Mongo (sem envio).
- **Alteração:** Duas vias. (A) Sem provider de email: criar componente `NewsletterSignup` (input + honeypot + rate limit, reutilizar a defesa já existente do contacto) e gravar emails numa colecção nova `newsletter_subscribers` no Mongo (`src/lib/mongodb/newsletter.ts` + `src/app/api/newsletter/route.ts`), com gestão/export no painel. Não envia nada — só recolhe. (B) Com provider (Resend/Mailchimp/Buttondown): integrar double opt-in e envio. Recomendado começar por (A) e só ligar (B) quando houver decisão de ferramenta.
- **Aceitação:** Submeter email no rodapé/landing grava em `newsletter_subscribers`; duplicados são ignorados; honeypot + rate limit bloqueiam abuso; lista visível/exportável no painel.
- **Risco/nota:** Decisão necessária — sem canal de envio a newsletter é só recolha de contactos (cumprir RGPD: consentimento explícito + política de privacidade já existe em `/politica-privacidade`). NUNCA reutilizar a colecção `leads` para isto; usar colecção nova. Adiar até haver intenção real de comunicar (P3).

## 🧭 Camada 3 — Decisões estratégicas (decidir antes de construir)

## Decisões ESTRATÉGICAS (tomar ANTES de construir)

> Estes dois itens **não são tarefas de build** — são decisões que o Iuri tem de tomar primeiro. Construir antes da decisão é desperdício (faturação) ou risco legal (faturação certificada). Baseados nos teus registos (memória `reddune-faturacao-gap` + nota Obsidian `03_Licoes/certificacao-faturacao-at-gratis.md`) e em factos gerais de faturação PT.

---

### [EST1] Faturação: escolher forma fiscal + ferramenta (NÃO construir no painel ainda) — `P3` · esforço `M`
- **Estado actual:**
  - Faturação é **100% MANUAL** e inconsistente: Iuri "não emite ainda ou só emite de vez em quando" (memória `reddune-faturacao-gap.md`, citação de 2026-06-26). Em PT cada serviço/venda exige fatura na altura → situação **não-conforme** hoje.
  - O painel **não gera documento legal nenhum**. `src/types/pagamento.ts:19-28` (interface `Pagamento`) só guarda `valor`, `data`, `metodo`, `notas` — é um registo de pagamento, não uma fatura. Não há ATCUD, série, hash encadeado, QR, nem SAF-T.
  - A tab **"Facturação" é um link morto**: `src/app/(painel)/painel/definicoes/page.tsx:15` (`{ id: "fact", label: "Facturação", icon: Receipt }`) aparece no nav lateral mas **não existe `<section id="fact">`** correspondente no corpo da página (as secções reais são `perfil`, `notif`, `integ`, `aparencia`, `backup`) → o link âncora não leva a lado nenhum.
  - O cartão de integração "Stripe / Pagamentos da loja online" em `definicoes/page.tsx:31` está marcado `on: true` mas é **mockup estático** (array `INTEG` hardcoded, sem ligação real).
  - Forma fiscal (ENI vs Lda) e existência de contabilista **não estão registadas** nos teus ficheiros — "perguntar antes de aconselhar" (memória).
- **Alteração (decisão a tomar, com opções e trade-offs):**
  - **Facto-chave dos teus registos (desfaz o mito do custo):** certificar software de faturação na AT **custa €0** (taxa gratuita, ~30 dias úteis) — nota `certificacao-faturacao-at-gratis.md`. O muro **não é dinheiro ao Estado**, é engenharia (assinatura assimétrica encadeada, SAF-T, inalterabilidade, testes de conformidade) + **manutenção eterna** (cada mudança de lei → reemitir certificado) + **responsabilidade legal** (doc inválido → multa do cliente → culpa do software).
  - **Opção A — Portal das Finanças (recomendada para já se ENI/volume baixo):** o próprio Portal é software certificado da AT; ENI de volume baixo emite **fatura-recibo grátis** sem comprar nada. Prós: €0, zero engenharia, conforme imediato. Contras: manual, sem ligação ao painel.
  - **Opção B — White-label via API certificada (Vendus / InvoiceXpress / Moloni):** o painel mantém o `Pagamento` e ganha um botão "emitir recibo" que chama a API do provider → devolve PDF com ATCUD+QR, anexado ao registo. Prós: automatizado, conforme, time-to-market. Contras: fee mensal/por-documento; é o caminho certo **só depois** da forma fiscal estar decidida. (A nota indica white-label como regra de decisão "cedo / poucos clientes".)
  - **Opção C — Construir motor próprio certificado:** **NÃO recomendar agora.** Mesmo sendo a certificação grátis, carrega manutenção + responsabilidade legal. Gatilho para considerar: quando as fees de white-label pagas **>** custo (tempo) de manter motor próprio. O teu projeto `reddune-pos` já é o sítio para esse motor white-label — **não meter um POS meio-feito no painel da RedDune.**
  - **Passos concretos da decisão:** (1) Iuri confirma com contabilista a forma fiscal (ENI vs Lda) e regulariza a situação atual; (2) escolhe A (Portal, grátis) ou B (API white-label); (3) **só depois** se especifica o build no painel (botão "emitir recibo" → liga à API do provider escolhido → guarda PDF ATCUD+QR no `Pagamento`). A skill `descomplica-factura-pt` cobre ATCUD/SAF-T/comunicação à AT quando chegar a hora.
- **Aceitação:** existe uma decisão escrita (no vault/memória) com (a) forma fiscal confirmada, (b) ferramenta escolhida (Portal vs provider X), (c) se/quando se liga ao painel. Enquanto não houver decisão, **não se mexe em código de faturação**.
- **Risco/nota:** **DECISÃO NECESSÁRIA — bloqueia qualquer build de faturação.** Constraint absoluto: NUNCA tocar nos dados reais do Mongo (pagamentos existentes) nem emitir documentos fiscais a partir de software não certificado (são inválidos → coima). Item separado de quick-win (não estratégico): a tab "Facturação" no nav de `definicoes` é um link morto — ou se remove a entrada do array `NAV` ou se cria a secção; isso é build trivial e não depende desta decisão.

---

### [EST2] Loja: e-commerce real vs manter inquiry-only (e limpar tabs mortas) — `P3` · esforço `L`
- **Estado actual:**
  - A loja pública é **inquiry-only via WhatsApp** — NÃO há carrinho, checkout, pagamento nem encomendas. `src/components/sections/shop/ProductGrid.tsx:10,145` usa `waLink(...)` (link `wa.me`) como única acção; o CTA é "procuro um produto específico" para WhatsApp, não "comprar".
  - O catálogo vem da coleção `products` (Mongo) via `getAllProducts()` — `src/app/loja/page.tsx:11,208`. O tipo `Product` (`src/types/product.ts:11-22`) tem `price`, `available`, `featured`, `imageUrls`, mas **não tem `stock`/quantidade** — não há gestão de inventário.
  - O painel `src/app/(painel)/painel/loja/page.tsx` é **só CRUD de catálogo** (KPIs: total/disponíveis/destaques/ocultos via `LojaClient`). **Não existe coleção nem tab de encomendas/orders** no painel.
  - Mock que finge e-commerce: `definicoes/page.tsx:31` mostra integração "Stripe · Pagamentos da loja online" `on: true` e `:32` "MB Way · IfThenPay" — ambos **mockups estáticos**, sem nenhuma ligação real. Isto cria a falsa impressão de que a loja já vende.
- **Alteração (decisão a tomar):**
  - **Opção A — Manter inquiry-only e limpar (recomendada como default):** assumir que a loja é montra/catálogo + contacto por WhatsApp. Acção: remover/honestar os cartões mock "Stripe" e "MB Way" em `definicoes/page.tsx` (array `INTEG`) para não prometer checkout que não existe. Prós: zero custo, zero RGPD/pagamentos a gerir, alinhado com o negócio atual. Contras: cada venda é manual (chat → faturar à parte — liga ao EST1).
  - **Opção B — E-commerce real:** carrinho + pagamento (Stripe e/ou MB Way via IfThenPay) + coleção nova `encomendas` (orders) no Mongo + campo `stock` no `Product` + tab "Encomendas" no painel + fluxo de estados (pago/enviado/entregue). Prós: vendas automáticas, escala. Contras: esforço alto (L+), obriga a **faturação resolvida primeiro** (EST1 — cada venda online gera fatura), RGPD de dados de pagamento/morada, gestão de stock e devoluções (já há páginas de política `loja/politica-garantia` e `politica-devolucao`).
  - **Ligação ao CL3.1:** a limpeza das tabs/integrações mortas (Stripe/MB Way mock, link "Facturação" morto) faz parte de "remover features fantasma do painel". Se a decisão for A, essa limpeza deve avançar; se for B, os mocks viram features reais.
  - **Passo da decisão:** Iuri escolhe A ou B. Se B, **depende de EST1 estar resolvido** (não há e-commerce conforme sem faturação) e abre-se um épico de build (carrinho → pagamento → encomendas → stock).
- **Aceitação:** decisão escrita registada. Se A: os cartões "Stripe/MB Way" em `definicoes` deixam de afirmar que há pagamentos na loja (removidos ou marcados como planeados). Se B: existe backlog de build com coleção `encomendas`, campo `stock` e tab no painel.
- **Risco/nota:** **DECISÃO NECESSÁRIA.** Opção B está **bloqueada por EST1** (faturação). Constraint: NUNCA tocar nos dados reais do Mongo (coleção `products`). Nota de honestidade: enquanto a decisão não sai, os mocks de pagamento no painel são enganadores — não os apresentar a um cliente como funcionais.

---

## 🔎 Revisão adversarial (verificar antes de executar)

**Veredicto do revisor:** `precisa-ajustes`

| Gravidade | Onde | Problema | Correção |
|:--:|---|---|---|
| alta | UX4 (ImageUploadZone — adiar delete do blob) vs src/app/api/products/upsert/route.ts:30-67 e src/app/api/portfolio/upsert/route.ts:38-61 | Contradição interna grave. O UX4 descreve a reconciliação server-side de blobs órfãos (diff de imageUrls antigo vs novo no save) como algo a ADICIONAR ('adicionar a reconciliação nos endpoints de upsert'). Mas essa reconciliação JÁ EXISTE: products/upsert (linhas 30-38 + deleteManagedBlobs em 65-67) e portfolio/upsert (linhas 38-45 + deleteManagedBlob em 59-61) já comparam o array antigo e apagam os órfãos após o save. O único trabalho real é remover a chamada redundante em ImageUploadZone:168 — e isso, sem mais nada, cobre o caso 'remover imagem guardada + cancelar form' via a reconciliação que já corre no save. O passo de 'products/...' fica por especificar (já está feito). | Reescrever UX4: a reconciliação server-side NÃO precisa de ser construída (já existe em products/upsert e portfolio/upsert). A acção real é só (1) remover o safeJsonPost de delete em ImageUploadZone.tsx:168 e (2) lidar com o caso de upload novo nunca guardado (form cancelado), que é o ÚNICO órfão que a reconciliação do save não apanha. Verificar também ServicosEditor/upsert de serviços, que pode não ter a mesma reconciliação. |
| media | UX2 / definicoes (id="aparencia" duplicado) vs src/app/(painel)/painel/definicoes/page.tsx:168,181 | Afirmação factualmente errada. O plano diz que id="aparencia" aparece 'DUAS vezes (:168 e a segunda secção Aparência em :181 não tem id...)'. Contradiz-se na própria frase: a segunda secção (linha 181/184) NÃO tem id nenhum. Logo NÃO há id duplicado no DOM. O 'fix' do passo 3 ('resolver o id="aparencia" duplicado') está a corrigir um problema que não existe. | Remover a alegação de id duplicado. O problema real (verdadeiro) é que a segunda secção Aparência (Kanban, linha 181) não tem id, por isso não é alvo de nenhuma âncora — mas isso é 'secção sem âncora', não 'id duplicado'. Reformular o passo 3 para apenas dar um id à segunda secção (ex. id="aparencia-kanban") ou fundir as duas. |
| media | DEAD1 (assets mortos) vs public/icone.png + public/icone.ico | Item incompleto: existe também public/icone.ico, que o plano nunca menciona (só fala de icone.png). Como o plano levanta a dúvida 'é favicon/manifest?' para o icone.png, o .ico é ainda mais suspeito de ser favicon e precisa do mesmo cuidado. Confirmei que manifest.ts NÃO referencia nenhum dos dois (usa /icons/icon-192.png etc.) e icone.png só aparece em claude/seo-plan.md — mas o .ico ficou fora da auditoria. | Acrescentar public/icone.ico à lista de candidatos a apagar e verificá-lo contra favicon convencional do Next (src/app/favicon.ico, <link rel=icon>) antes de remover. Nota: manifest.ts confirmadamente NÃO usa nenhum icone.* — usar isto na decisão. |
| baixa | CRM1 vs src/components/painel/LeadsTable.tsx:24,81,89 | Imprecisões de detalhe. (a) O plano diz usar safeJsonPost no LeadsTable, mas o componente importa safeFetch (linha 29), não safeJsonPost — changeEstado usa safeFetch com PATCH manual (linhas 92-96). Misturar os dois nomes vai confundir quem implementa. (b) O plano diz 'adicionar busy === "convert" ao tipo de busy (linha 81)': o tipo actual é useState<"delete"\|null> (linha 81) — está correcto, mas há só um botão Eliminar/Responder no footer (não há 'Responder' como acção JS, é um <a> mailto). O texto 'junto a Eliminar/Responder' é ok mas Responder é link, não acção. | Especificar que a conversão deve usar safeFetch (o padrão deste ficheiro) ou importar safeJsonPost de propósito; alinhar o vocabulário. Confirmar o tipo de busy passa a "delete"\|"convert"\|null. |
| baixa | ENV1 vs src/app/api/upload/product-image/route.ts:62-70 | Drift de linhas. O plano cita put() em 'products/<uuid>.<ext> :62-70'. Na verdade pathname é montado em 62-63 e o put() corre em 66-70. A verificação BLOB_READ_WRITE_TOKEN está em 29-34 (o plano diz :29-34, correcto) e devolve 500 antes de ler ficheiro (correcto). | Ajustar a referência para put() em :66-70 (pathname :62-63). Sem impacto material — substância correcta. |
| baixa | CRM1 — data layer leads vs src/lib/mongodb/leads.ts | Listagem incompleta do data layer. O plano diz que leads.ts tem 'getLeadById, updateLeadEstado, upsertLead'. Faltam createLead (:22), getAllLeads (:7), deleteLead (:45) e countLeadsNovos (:51). Não invalida a conclusão (não existe função para gravar clienteId isoladamente — correcto), mas FEAT2 depende de getAllLeads/countLeadsNovos existirem, e o leitor pode pensar que não existem. | Completar a lista de funções existentes em leads.ts; confirmar que getAllLeads e countLeadsNovos (de que FEAT2 depende) já existem. |
| baixa | UX5 GlobalSearch vs FEAT3 (placeholder) | Conflito não resolvido entre dois itens do mesmo plano. UX5 (P1) manda mudar o placeholder de GlobalSearch.tsx:52 para 'Procurar projectos…' (assumindo que só pesquisa projectos). FEAT3 (P1) manda alargar a pesquisa a clientes+tarefas e MANTER o placeholder amplo (mudar destino para /painel/procurar). Implementar UX5 e depois FEAT3 implica reverter o placeholder. Ambos P1, sem nota de precedência. | Marcar UX5 como mutuamente exclusivo com FEAT3 (ou subordinado): se FEAT3 for feito, UX5 cai. Indicar qual avança primeiro. |
| baixa | DEAD1 — env.ts vs src/lib/env.ts:8-24 | Fraseado confuso/parcialmente impreciso. O plano diz 'remover o objecto serverEnv inteiro E o getter SYNC_SECRET' — mas SYNC_SECRET é um getter DENTRO de serverEnv (linha 12-14), por isso remover serverEnv já remove o getter; são a mesma coisa, não dois passos. Confirmei que serverEnv não tem usos em src (grep só acerta na definição :8) e que publicEnv é amplamente usado (layout, sitemap, robots, structured-data, várias páginas) — logo 'manter publicEnv' é correcto. | Simplificar: 'remover serverEnv inteiro (inclui o getter SYNC_SECRET); manter publicEnv (usado em layout/sitemap/robots/structured-data e ~10 páginas)'. |

**Itens que o revisor sinalizou como possivelmente em falta / a reforçar:**
- public/icone.ico — segundo asset 'icone' não auditado (DEAD1 só fala de icone.png). Decidir junto com icone.png.
- Reconciliação de blobs órfãos no upsert de SERVIÇOS — UX4 menciona 'adicionar a /api/servicos/upsert' mas não verifiquei se servicos/upsert já tem (como products/portfolio já têm) ou não a lógica de diff/delete. Confirmar antes de duplicar.
- Conflito de precedência UX5 vs FEAT3 (placeholder do GlobalSearch) não está declarado em lado nenhum do plano.
- public/icone.ico/favicon: o plano pede para verificar manifest.ts/icon.* antes de apagar icone.png mas não regista a conclusão — confirmado aqui que manifest.ts usa /icons/icon-{192,512}.png e NÃO usa icone.*; faltava essa confirmação no plano.

