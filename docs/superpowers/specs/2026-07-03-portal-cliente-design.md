# Portal do Cliente — Design (2026-07-03)

## Problema

Mostrar entregáveis aos clientes (mockups HTML, PDFs, protótipos com deploy) falha de maneiras
diferentes: ficheiros que não abrem, GitHub Pages que não actualiza, cache presa, cada cliente
recebe as coisas por um canal diferente. Perde-se tempo e passa má imagem.

## Objectivo

Uma única forma, sempre igual, no domínio RedDune: o cliente abre um link, vê o estado do
projecto e os entregáveis, e deixa comentários. O Iuri gere tudo a partir do painel existente.

## Decisões (com razões)

| Decisão | Escolha | Porquê |
|---|---|---|
| Acesso | Link secreto por projecto (`/p/[token]`), sem contas | Etapa actual: clientes pequenos, zero fricção, zero suporte de passwords. Revogável. Migrável para contas mais tarde sem deitar nada fora. |
| Visibilidade | Cliente vê tudo do projecto EXCEPTO campos de texto livre | Escolha do Iuri (opção B moderada). Texto livre (`bodyMd`, `notasResumo`, `proximaAccao`, `descricao` das linhas) pode conter notas internas → excluído por regra fixa no código, não por gestão manual. |
| Valores | Agregados: Total · Pago · Em falta + subtotais por categoria (Peça / Mão-de-obra / Outro) | Transparência sem revelar margens. Sem quantidades, preços unitários ou descrições. |
| HTML | Ficheiro único `.html` suportado (upload + iframe sandbox); sites multi-ficheiro = link/iframe para o deploy (Vercel/Pages) | Mockups do Claude Design são HTML único — caso de uso real. Hosting multi-ficheiro seria reinventar a Vercel + risco desnecessário. |
| Feedback | Caixa de comentários por entregável + geral; sem threads/anotações/aprovações | v1 mínima. Anti-abuso igual ao formulário de contacto (honeypot + rate-limit). |
| Notificações | Web Push para o Iuri (`sendPushToAll`) + contador no painel | Padrão já existente nos leads. Sem email, sem serviços externos (Resend foi removido do projecto). |
| Ficha do cliente | Card "Os teus dados" editável pelo cliente (whitelist de 6 campos) | Iuri pede pouco ao cliente; campos vazios visíveis convidam a preencher. NIF/morada úteis para faturação futura. Auditado via `logMutation`. |

## Arquitectura

### Modelo de dados

**`Projeto` (campos novos):**
- `portal: { tokenHash: string; criadoEm: string; revogadoEm: string | null } | null`
  — hash SHA-256 do token; o token em claro mostra-se UMA vez ao gerar e nunca se guarda.
- `links: ProjetoLink[] | null` — `{ id, label, url }` para protótipos com deploy
  (só `https:`, validado).

**Upload de arquivos (existente, `api/projetos/arquivo`):**
- Adicionar `text/html` → `html` ao `EXT_BY_MIME` (mockups de ficheiro único).

**Colecção nova `portal_comentarios`:**
- `{ id, projetoId, arquivoId: string | null, linkId: string | null, autorNome, texto, criadoEm, lidoEm: string | null, ip }`
- `arquivoId`/`linkId` nulos = comentário geral do projecto. `texto` ≤ 2000 chars.
- Índice em `projetoId`.

**`Cliente`:** sem campos novos; portal escreve apenas na whitelist (ver API).

### Rotas novas

**Página pública `src/app/(portal)/p/[token]/page.tsx`** (server component)
- Lookup por `sha256(token)` no índice `portal.tokenHash`; inválido/revogado → 404 genérico.
- Renderiza DTO sanitizado (nunca o documento inteiro — ver Sanitização).
- Header `X-Robots-Tag: noindex, nofollow` + meta robots; fora do sitemap.
- Secções: cabeçalho com branding · estado/prazo/garantia/hardware · valores agregados ·
  entregáveis (arquivos + links) · comentários · "Os teus dados".

**`GET /api/portal/arquivo/[id]?token=…`** — proxy de ficheiros do portal
- Valida token → projecto → arquivo pertence ao projecto → stream do blob.
- O proxy actual (`/api/projetos/arquivo/[id]`) exige sessão NextAuth do admin; não serve.
- PDFs/imagens: `Content-Disposition: inline`.
- HTML: servir com header `Content-Security-Policy: sandbox allow-scripts` E mostrado em
  `<iframe sandbox="allow-scripts">` — origem opaca, sem cookies/storage do domínio (cinto duplo).

**`POST /api/portal/comentario`**
- Body: `{ token, arquivoId?, linkId?, autorNome?, texto, website }` (`website` = honeypot).
- Rate-limit dedicado (ex.: 10/10min por IP), validação, grava + `sendPushToAll`
  ("💬 comentário no projecto X", url para o projecto no painel).

**`PATCH /api/portal/cliente`**
- Body: `{ token, dados }`. Whitelist estrita: `nome, telemovel, email, morada, nif, empresa`.
- Validação por campo (email/NIF formato), rate-limit, `logMutation` com before/after.
- Só funciona se o projecto tiver `clienteId` (projectos internos não têm ficha).

### Painel (página do projecto `/painel/projetos/[id]`)

Secção nova "Portal do cliente":
- Gerar link (mostra token uma vez + botão copiar) · Revogar · Regenerar.
- Gestão de `links` (label + url).
- Lista de comentários com "marcar como lido" + contador de não-lidos.

### Sanitização (regra central)

Função `toPortalProjeto(projeto): PortalProjetoDTO` — **allowlist explícita**:
`titulo, status (label), prazo, tipo(s) (labels), garantiaAte, hardware {marca, modelo},
arquivos [{id, nome, tipo, tamanho}], links [{id, label, url}], valores agregados`.
Tudo o resto fica fora por omissão — campo novo no `Projeto` nunca vaza sem decisão explícita.

Valores: se `linhas` existem → total = Σ(quantidade×precoUnit), subtotais por `categoria`;
senão → `valorEstimado`. `Em falta = max(0, total − valorPago)`.

Ficha: `toPortalCliente(cliente): PortalClienteDTO` — mesma allowlist da escrita
(`nome, telemovel, email, morada, nif, empresa`). Notas internas do cliente nunca saem.

### Segurança

- Token: 32 bytes aleatórios (base64url). Guardado apenas como SHA-256.
- Link é um *bearer secret*: quem o tem vê o projecto e edita a ficha. Aceite nesta escala;
  mitigação = revogação + auditoria de escritas + rate-limits.
- Escritas do portal limitadas a: comentários (nova colecção) + 6 campos do cliente. Nada mais.
- Blob URLs continuam server-only; revogar o token corta o acesso aos ficheiros (proxy).
- Rate-limit nas 3 rotas API; a página `/p/` tem lookup barato + 404 sem detalhe.

## Fora de scope (v1)

Contas/login de cliente · anotações sobre designs · aprovações formais · versionamento de
ficheiros · upload pelo cliente · threads de comentários · portal em EN (clientes são PT).

## Testes

- Unit: `toPortalProjeto` (campos proibidos NUNCA presentes; agregação de valores por categoria).
- Unit: validação do `PATCH /api/portal/cliente` (whitelist rejeita campos extra).
- Manual em dev: gerar link, abrir portal, ver PDF/HTML, comentar (recebe push), editar ficha,
  revogar link → 404.
- `next build` + lint limpos.

## Riscos conhecidos

- Link partilhado para lá do cliente (ele reencaminha) → mesma exposição que enviar PDF por
  email hoje; revogável.
- HTML de mockup com scripts corre no browser do cliente — mitigado por sandbox de origem
  opaca; nunca servir HTML sem os dois cintos (header CSP + atributo sandbox).
- Limite de 10MB por ficheiro mantém-se (subir noutro momento se precisar).
