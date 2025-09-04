# Deploy — Inbox Genie

Targets
- Web (Next.js): Vercel
- API (NestJS): Render (Docker) — default. Fly.io is also compatible.

Prereqs
- Postgres (Supabase recommended)
- Redis (Upstash or Render Redis)
- Provider keys: Stripe, Twilio, Retell, Google, FollowUpBoss

Web — Vercel
1. Import `apps/web` as a Vercel project.
2. Set env vars:
   - NEXT_PUBLIC_API_URL=https://YOUR-API.example.com
   - NEXTAUTH_SECRET
   - SENTRY_DSN (optional)
3. Deploy → vercel --prod

API — Render
1. New Web Service from repo root with `infra/render.yaml`.
2. Add env vars (see render.yaml placeholders):
   - APP_BASE_URL=https://YOUR-API.example.com
   - DATABASE_URL=postgresql://...
   - REDIS_URL=redis://...
   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
   - RETELL_API_KEY, FUB_API_KEY
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - NEXTAUTH_SECRET
   - SENTRY_DSN, OTEL_EXPORTER_OTLP_ENDPOINT (optional)
   - RATE_LIMIT_IP_PER_MIN=60, RATE_LIMIT_TENANT_PER_MIN=600
3. Health check path: /health/readiness
4. Migrations: render.yaml runs `prisma migrate deploy` on start.

Stateful services
- Postgres: Use Supabase, set DATABASE_URL.
- Redis: Upstash or Render Redis; set REDIS_URL.

Webhooks to set (point to API base URL)
- Twilio Voice:  POST /webhooks/voice
- Twilio SMS:    POST /webhooks/sms
- Stripe:        POST /webhooks/billing
- Retell:        POST /webhooks/voice

Scaling notes
- Rate limiting via Redis (60 r/m per IP, 600 r/m for /webhooks/*).
- Concurrency cap per tenant (default 3 simultaneous calls).
- OUTREACH_PAUSED=true acts as a kill switch.

