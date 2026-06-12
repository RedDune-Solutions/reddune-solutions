# reddune-solutions — notas para o Claude

Site Next.js (App Router) na Vercel + MongoDB. Login NextAuth (credenciais, utilizador único).
Área de admin em `/painel`. Deploy = push para `main` (Vercel auto).

## Estado de segurança (feito)
- Proteção de força bruta no login: 10/min em `/api/auth/callback/credentials` (`middleware.ts`).
- Rate limit global de `/api` (200/min). `rateLimitDistributed` (Upstash opcional -> MongoDB
  coleção `rate_limits` -> memória). O middleware Edge usa Upstash-ou-memória (o driver Mongo não corre no Edge).
- Formulário de contacto: honeypot + rate limit + Turnstile (adormecido, sem chaves).
  `src/app/api/sendEmail/route.ts` verifica o Turnstile quando configurado.
- Headers de segurança já existiam em `next.config.ts`.

## Opcional / pendente
- Chaves Turnstile só se aparecer spam. Chaves Upstash opcionais (usa MongoDB por defeito).
- O `.env.example` foi removido a pedido do utilizador (não recriar).

## Conclusão
CAPTCHA NÃO é prioritário nesta fase — honeypot + rate limit já cobrem o abuso real.
Alternativas se um dia quiserem: hCaptcha (encaixa no Supabase Auth), Vercel Firewall/BotID.
