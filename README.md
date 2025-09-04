# Inbox Genie

AI-powered front desk system with voice and SMS capabilities. This monorepo contains a Next.js web app and NestJS API server, designed for launch-ready deployment.

## Quickstart (Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker compose -f infra/docker-compose.yml up -d

# 3. Setup database
make migrate && make seed

# 4. Start development servers
pnpm -r dev
```

**Servers:**
- Web: http://localhost:3000 
- API: http://localhost:3001

**Expose with ngrok for webhooks:**
```bash
ngrok http 3001
```

## Run Audit & Tests

```bash
# Runtime health checks
pnpm audit:run

# Performance audit 
pnpm lh

# Accessibility tests
pnpm e2e

# Full test suite
pnpm test
```

## Webhook Configuration

Set provider webhooks to your API base URL (use ngrok URL for local dev):

- **Twilio Voice**: `POST $API_BASE_URL/webhooks/voice`
- **Twilio SMS**: `POST $API_BASE_URL/webhooks/sms` 
- **Stripe**: `POST $API_BASE_URL/webhooks/billing`
- **Retell**: `POST $API_BASE_URL/webhooks/voice`

## Go-Live Checklist

See [AUDIT.md](AUDIT.md) for detailed production readiness assessment.

**Security & Limits**

All critical security measures now implemented:
- ✅ CORS restricted to specific origins (`ALLOWED_ORIGINS`)
- ✅ Security headers via Helmet middleware  
- ✅ Input validation with class-validator DTOs
- ✅ Plan caps enforcement (`ENFORCE_CAPS`, `OVERAGE_MODE`)
- ✅ Rate limiting with Redis backend

**Environment Variables:**
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (production: your domains)
- `ENFORCE_CAPS`: Enable usage limit enforcement (`true`/`false`)  
- `OVERAGE_MODE`: Behavior when limits exceeded (`soft`/`hard`)
- `USAGE_WARN_THRESHOLD`: Warning threshold (0.9 = 90%)

**Before production:**
- [ ] Configure environment secrets properly
- [ ] Set up monitoring and alerts
- [ ] Set `ENFORCE_CAPS=true` and `OVERAGE_MODE=hard` for production

**Environment Requirements:**
- All API keys configured (see [.env.example](.env.example))
- `APP_BASE_URL` set to deployed API URL
- `NEXT_PUBLIC_API_URL` set to deployed API URL  
- Database and Redis connections configured

## Deploy

**Web (Vercel):**
```bash
cd apps/web
vercel --prod
```

**API (Render):** 
- Use `infra/render.yaml` configuration
- Render auto-runs migrations on start
- Health checks via `/health/readiness`

See [docs/DEPLOY.md](docs/DEPLOY.md) for detailed deployment instructions.

## Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: NestJS, Fastify, Prisma ORM
- **Database**: PostgreSQL with Redis cache
- **Integrations**: Retell (voice), Twilio (SMS), Stripe (billing), FUB (CRM)
- **Auth**: NextAuth v5 with magic links

## Development

```bash
# Lint code
pnpm lint

# Build all packages  
pnpm build

# Check dev environment keys
pnpm dev:keys
```

**Key Directories:**
- `apps/web/` - Next.js frontend
- `apps/api/` - NestJS backend  
- `packages/core/` - Shared utilities
- `infra/` - Docker, deployment configs
- `scripts/` - Audit and development tools 
