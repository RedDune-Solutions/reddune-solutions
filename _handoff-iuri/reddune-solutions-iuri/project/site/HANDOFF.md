# RedDune Solutions — Handoff Técnico

> Documento de entrega para **Claude Code** (ou developer humano).
> Objectivo: pegar nas 11 páginas HTML estáticas em `site/` e transformá-las num projecto **Next.js 15 (App Router) + TypeScript + Tailwind + next-intl**, sem perder uma vírgula da estética Oasis.

---

## 1. Stack técnico recomendado

| Camada | Tecnologia |
| --- | --- |
| Framework | **Next.js 15** (App Router, Server Components por defeito) |
| Linguagem | **TypeScript** estrito (`strict: true`) |
| Estilo | **Tailwind CSS 4** + tokens CSS variables (mapear de `styles.css`) |
| i18n | **next-intl** (rotas `/pt/…` e `/en/…`, default = `pt`) |
| Fonts | `next/font/google` — `Bricolage Grotesque`, `Newsreader`, `DM Sans`, `Geist Mono` |
| Imagens | `next/image` para tudo o que não é SVG inline |
| Animações | CSS keyframes (já em `styles.css`) + `IntersectionObserver` (já em `scripts.js`) — **não trazer Framer Motion**, é overkill |
| Deploy | Vercel (preferido) ou Netlify |
| Analytics | `@vercel/analytics` ou Plausible (**sem GA, sem Meta Pixel** — política de privacidade promete-o) |

**Não usar:** CMS (Sanity, Contentful), nem base de dados. Conteúdo em ficheiros JSON/MDX no repositório.

---

## 2. Estrutura de pastas alvo

```
reddune-website/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                          # nav + footer + fonts
│   │   ├── page.tsx                            # /
│   │   ├── servicos/
│   │   │   ├── page.tsx                        # /servicos
│   │   │   ├── assistencia-tecnica/page.tsx
│   │   │   ├── web-digital/page.tsx
│   │   │   └── software-recuperacao/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── loja/
│   │   │   ├── page.tsx
│   │   │   ├── politica-garantia/page.tsx
│   │   │   └── politica-devolucao/page.tsx
│   │   ├── contacto/page.tsx
│   │   └── politica-privacidade/page.tsx
│   ├── globals.css                             # tokens + base
│   ├── robots.ts
│   ├── sitemap.ts
│   └── opengraph-image.tsx
├── components/
│   ├── chrome/
│   │   ├── Nav.tsx
│   │   └── Footer.tsx
│   ├── hero/
│   │   ├── Hero.tsx                            # hero principal (home)
│   │   └── HeroLite.tsx                        # hero curto (páginas internas)
│   ├── home/
│   │   ├── ServicesPreview.tsx
│   │   ├── PortfolioPreview.tsx
│   │   ├── StatsRow.tsx
│   │   ├── About.tsx
│   │   └── CTAWave.tsx
│   ├── primitives/
│   │   ├── ButtonPrimary.tsx
│   │   ├── ButtonGhost.tsx
│   │   ├── ButtonLight.tsx
│   │   ├── ButtonOutline.tsx
│   │   ├── Eyebrow.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── PortfolioCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── FAQItem.tsx                         # <details> com chevron animado
│   │   ├── Sparks.tsx                          # client component
│   │   ├── DuneBackground.tsx                  # SVG das dunes
│   │   └── Sun.tsx
│   └── motion/
│       ├── Reveal.tsx                          # IntersectionObserver wrapper
│       └── Counter.tsx                         # animated number
├── content/
│   ├── pt/
│   │   ├── home.json
│   │   ├── servicos.json
│   │   ├── portfolio.json
│   │   ├── loja.json
│   │   ├── contacto.json
│   │   ├── politicas/
│   │   │   ├── garantia.md
│   │   │   ├── devolucao.md
│   │   │   └── privacidade.md
│   │   └── ui.json                             # nav, footer, CTAs partilhados
│   └── en/                                     # mesma estrutura, traduzido
├── messages/                                   # next-intl strings curtas
│   ├── pt.json
│   └── en.json
├── public/
│   └── assets/
│       └── logo.png
├── lib/
│   ├── constants.ts                            # WA, EMAIL, PHONE, IG
│   └── whatsapp.ts                             # helper para gerar URLs WA com texto
├── i18n.ts
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Tokens de design (extrair de `site/styles.css`)

Mapear para Tailwind config + CSS variables em `globals.css`:

```css
:root {
  /* paleta */
  --sand-cream: #fff7e8;
  --sand-warm:  #f3c79b;
  --sand-mid:   #e89968;
  --sand-deep:  #c97045;
  --ember:      #d6422a;
  --ember-deep: #a8201a;
  --crimson:    #7a1410;
  --black-warm: #2a0805;
  --black-deeper: #1a0805;

  /* tipografia */
  --font-display: 'Bricolage Grotesque', sans-serif;
  --font-serif:   'Newsreader', serif;          /* italic only */
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'Geist Mono', monospace;

  /* escala */
  --radius-card: 28px;
  --radius-btn:  100px;
  --max-w:       1280px;
}
```

**Regras de tipografia:**
- Display (h1, h2, hero): `Bricolage Grotesque` `font-weight: 700-800`, `letter-spacing: -0.04em`, `line-height: 0.95`
- Itálico decorativo dentro de display: trocar para `Newsreader Italic`
- Body: `DM Sans` 16-18px
- Eyebrows / meta: `Geist Mono` 11-13px, `letter-spacing: 0.15em`, `text-transform: uppercase`

---

## 4. Contratos partilhados (`lib/constants.ts`)

```ts
export const PHONE = '+351 961 531 235';
export const PHONE_RAW = '351961531235';
export const EMAIL = 'reddunesolutions@gmail.com';
export const WHATSAPP_BASE = `https://wa.me/${PHONE_RAW}`;
export const INSTAGRAM = 'https://www.instagram.com/reddune_solutions/';
export const LOCATION = { city: 'Fuseta', region: 'Algarve', lat: 37.0556, lng: -7.7445 };

export const SERVICE_AREAS = [
  { slug: 'assistencia-tecnica',     priceFrom: 15,  title: 'Assistência Técnica'   },
  { slug: 'web-digital',             priceFrom: 450, title: 'Web & Digital'         },
  { slug: 'software-recuperacao',    priceFrom: 25,  title: 'Software & Recuperação'},
];
```

`lib/whatsapp.ts`:
```ts
import { WHATSAPP_BASE } from './constants';
export function waLink(message: string) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;
}
```

---

## 5. i18n (next-intl)

- **Rotas:** `/pt/...` e `/en/...`. Default = `pt`. Redirect `/` → `/pt`.
- **Detecção:** browser `Accept-Language` (apenas no primeiro acesso, cookie persistente).
- **Toggle:** componente `<LanguageSwitcher>` na Nav (top-right, antes do CTA WhatsApp). Estilo: `Geist Mono`, `PT / EN`, separador vertical.
- Strings curtas (nav, botões, labels) → `messages/{pt,en}.json` consumidos via `useTranslations()`.
- Conteúdo longo (políticas, copy de serviços) → ficheiros separados em `content/pt/...` e `content/en/...`, importados nas pages com `params.locale`.

> **Notas para tradução EN:** manter "WhatsApp", "Fuseta", "Algarve" sem traduzir. "RedDune Solutions" é sempre o mesmo. Decimais (€) seguem locale.

---

## 6. SEO

Cada `page.tsx` exporta `generateMetadata()` com:
- `title` e `description` específicos da página
- `openGraph` com `url`, `siteName: 'RedDune Solutions'`, `locale`, `type: 'website'`
- `alternates.languages` (PT ↔ EN cross-link)

**JSON-LD obrigatório:**
- **Home:** `LocalBusiness` com geo, opening hours, areaServed.
- **Páginas de serviço:** `Service` + `Offer` com `priceSpecification`.
- **FAQs:** `FAQPage` (todas as `<details>` que viste nos serviços).
- **Loja:** `ItemList` dos produtos.

`sitemap.ts` deve gerar todas as 11 rotas × 2 idiomas = 22 URLs.

---

## 7. Acessibilidade & performance

- **Lighthouse alvo:** 95+ em todas as métricas.
- Texto sobre dunes: contraste mínimo AA garantido pelos overlays escuros.
- `prefers-reduced-motion`: já tratado em `styles.css` (`@media (prefers-reduced-motion: reduce)`), garantir que se traduz para `globals.css`.
- `next/image` em qualquer foto futura (placeholders SVG ficam inline).
- Pre-load só de `Bricolage Grotesque` Variable e `DM Sans` regular/medium. As outras fontes lazy.

---

## 8. Mapeamento HTML → Componentes

| Arquivo em `site/` | Página Next.js | Componentes principais |
| --- | --- | --- |
| `index.html` | `app/[locale]/page.tsx` | `Hero`, `ServicesPreview`, `PortfolioPreview`, `StatsRow`, `About`, `CTAWave` |
| `servicos/index.html` | `app/[locale]/servicos/page.tsx` | `HeroLite`, `ServicesPreview`, `ProcessSteps`, `CTAWave` |
| `servicos/<slug>/index.html` | `app/[locale]/servicos/[slug]/page.tsx` | `HeroLite`, `ServiceItems`, `StatsRow`, `FAQList`, `CTAWave` |
| `portfolio/index.html` | `app/[locale]/portfolio/page.tsx` | `HeroLite`, `PortfolioGrid`, `CTAWave` |
| `loja/index.html` | `app/[locale]/loja/page.tsx` | `HeroLite`, `ProductGrid`, `StoreGuarantees` |
| `loja/politica-*` | `app/[locale]/loja/politica-*/page.tsx` | `HeroLite`, `PolicyContent` (MDX renderer) |
| `contacto/index.html` | `app/[locale]/contacto/page.tsx` | `HeroLite`, `ContactCards`, `LocationCard` |
| `politica-privacidade/index.html` | `app/[locale]/politica-privacidade/page.tsx` | `HeroLite`, `PolicyContent` |

**As 3 páginas de serviço (`assistencia-tecnica`, `web-digital`, `software-recuperacao`) partilham 100% a mesma estrutura.** Implementa-as como uma **única route dinâmica** `app/[locale]/servicos/[slug]/page.tsx` com `generateStaticParams` a iterar os 3 slugs. O conteúdo de cada uma vive em `content/{locale}/servicos/{slug}.json`.

---

## 9. Animações — manter exatamente como estão

- **Sparks** (partículas a subir): client component, gerado uma vez no mount.
- **Reveal on scroll**: `<Reveal>` wrapper com `IntersectionObserver`.
- **Counters** nos stats: `<Counter to={380} suffix="+" />`.
- **Parallax dunes**: listener `mousemove` no hero — só em desktop, desligar em mobile e em `prefers-reduced-motion`.
- **CSS keyframes** (`sun-rise`, `spark-float`, `dune-shift`, `hero-line`, etc.) → copiar tal-e-qual de `styles.css` para `globals.css`.

---

## 10. WhatsApp CTAs — mensagens pré-formatadas

Cada CTA tem mensagem contextual. Helper:

```ts
const messages = {
  home_hero: 'Olá! Gostava de pedir um orçamento.',
  servicos_at: 'Olá! Vim da página de Assistência Técnica.',
  servicos_wd: 'Olá! Vim da página de Web & Digital.',
  servicos_sr: 'Olá! Vim da página de Software & Recuperação.',
  produto: (name: string) => `Olá! Queria pedir orçamento para: ${name}`,
  generico: 'Olá!'
};
```

---

## 11. Checklist de entrega

- [ ] Lighthouse > 95 em todas as páginas (mobile e desktop)
- [ ] Todas as rotas funcionam em PT e EN com fallback consistente
- [ ] WhatsApp CTAs abrem em nova janela (`target="_blank"` + `rel="noopener"`)
- [ ] `sitemap.xml` e `robots.txt` gerados
- [ ] JSON-LD válido (testar no [Rich Results Test](https://search.google.com/test/rich-results))
- [ ] Sem trackers de terceiros (consistente com `/politica-privacidade`)
- [ ] `reddunesolutions.pt` aponta para Vercel/Netlify; SSL automático
- [ ] DNS dos emails preservados (não tocar nos MX records existentes)
- [ ] Página 404 personalizada com mesma estética Oasis
- [ ] Open Graph image gerada (Next.js `opengraph-image.tsx`)

---

## 12. Próximos passos depois do MVP

1. **Substituir os placeholders SVG do portfólio** por fotos reais quando o cliente as enviar.
2. **Lançar blog** (estrutura já pensada, ficou de fora do MVP) — pasta `content/{locale}/blog/*.mdx`.
3. **Loja → e-commerce real**: actualmente é pedido-de-orçamento por WhatsApp; futura migração para Stripe + área de cliente.
4. **Dashboard privada do cliente**: fora do site público, sem entry-point — desenvolver em subdomínio (`app.reddunesolutions.pt`) com auth separada.

---

**Mantém a estética. Mantém o tom. Não inventes copy nova sem alinhar com o cliente.**

Estética Oasis = quente, orgânica, profissional. Cada elemento tem que parecer feito por uma pessoa que percebe do assunto, não por um template.
