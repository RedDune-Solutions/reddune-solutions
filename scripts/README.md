# Reddune scripts — sync Obsidian → Site

## sync-obsidian.mjs

Lê o vault Obsidian local, parseia os projectos (`tipo-doc: projeto`) das pastas
`02_Projetos - Clientes/` e `03_Projetos - Internos/`, converte para o schema da dashboard,
e envia snapshot via POST autenticado para `/api/lembretes` (ex-`/api/tarefas`).

> **LEGADO** — as pastas do vault e o endpoint mudaram desde que isto foi
> escrito (o endpoint actual não aceita POST). Mantido como referência.

**Princípios:**
- Vault permanece local — só viaja snapshot curado
- Campos sensíveis filtrados (`valor-pago`, `método-pagamento`, contactos privados não vão)
- Sync é manual ou agendado, nunca real-time
- Site nunca toca no PC do utilizador

## Setup

1. Cria o ficheiro de configuração:
   ```powershell
   Copy-Item scripts\.env.example scripts\.env
   ```

2. Edita `scripts/.env`:
   - `OBSIDIAN_VAULT_PATH` — caminho absoluto do vault (ex: `C:\Users\asus\Documents\Obsidian\RedDune`)
   - `SITE_URL` — `http://localhost:9002` (dev) ou `https://reddune.solutions` (prod)
   - `SYNC_SECRET` — gera token forte (`openssl rand -hex 32` ou `[guid]::NewGuid()`); o mesmo valor tem de estar em `.env.local` no servidor

3. Confirma que `package.json` tem o script:
   ```json
   "scripts": { "sync:obsidian": "node scripts/sync-obsidian.mjs" }
   ```

## Uso

### Test mode (não faz POST)
```powershell
$env:DRY_RUN="1"; npm run sync:obsidian
```

### Sync real
```powershell
npm run sync:obsidian
```

Output esperado:
```
[sync-obsidian] Vault: C:\Users\asus\Documents\Obsidian\RedDune
[sync-obsidian] 67 ficheiros .md encontrados
[sync-obsidian] 35 tarefas para sync (32 ignorados)
  - Clientes: 33, Internos: 2
  - Por status: { 'em-curso': 5, proximo: 12, fechado: 18 }
[sync-obsidian] POST http://localhost:9002/api/tarefas
[sync-obsidian] OK: {"ok":true,"updatedAt":"2026-05-10T21:50:12.123Z","count":35}
```

## Sync automático (Windows Task Scheduler)

1. Abrir **Task Scheduler** → **Create Basic Task**
2. Trigger: **Daily** (ou a cada hora via Advanced)
3. Action: **Start a program**
   - Program: `node`
   - Arguments: `scripts/sync-obsidian.mjs`
   - Start in: caminho absoluto do projeto (ex: `C:\Users\asus\source\repos\Projetos\reddune-solutions`)
4. Conditions: desmarca "Start only if computer is on AC power" se quiseres correr em portátil

## Filtros de privacidade

O script **só envia** estes campos do frontmatter:
- `titulo` (filename)
- `cliente` (texto resolvido do `[[link]]`)
- `próxima-acção`
- `status`, `tipo`, `responsável`
- `data-criado`, `data-prevista`
- `valor-estimado`
- Resumo do body (primeiros 200 chars, sem markdown)

**Não envia:** `valor-pago`, `método-pagamento`, conteúdo completo do body, anexos, contactos privados.

Se quiseres alterar os campos públicos, edita `parseProject()` em `sync-obsidian.mjs`.

## Troubleshooting

### `OBSIDIAN_VAULT_PATH não definido`
Cria `scripts/.env` a partir do `.env.example`.

### `HTTP 401 Unauthorized`
- O `SYNC_SECRET` no `scripts/.env` não bate com o `SYNC_SECRET` do servidor (`.env.local` ou env vars Vercel)
- Confirma que ambos os lados têm o mesmo token

### `HTTP 400 Invalid payload`
- Algum projecto tem frontmatter mal formado
- Corre com `DRY_RUN=1` para ver o payload e identificar o problema

### `0 tarefas para sync` mas tens projectos
- Confirma `tipo-doc: projeto` no frontmatter (ou ajusta filtro em `parseProject`)
- Confirma que o `status` está num dos valores reconhecidos
