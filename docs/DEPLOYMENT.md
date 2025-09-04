# Deployment Guide

## Overview

Inbox Genie uses a split deployment architecture:
- **API**: Deployed on Render (Node.js backend)
- **Web**: Deployed on Vercel (Next.js frontend)

## API Deployment (Render)

### Required Environment Variables

Set these in your Render dashboard:

```bash
# Core Settings
ALLOWED_ORIGINS=https://inboxgenie.vercel.app,https://app.inboxgenie.app
APP_BASE_URL=https://api.inboxgenie.onrender.com
DEMO_MODE=true
OUTREACH_PAUSED=true
PORT=3001

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis (Optional)
REDIS_URL=
REQUIRE_REDIS=false

# Provider APIs
RETELL_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
FUB_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Security
NEXTAUTH_SECRET=
JWT_SECRET=

# Monitoring (Optional)
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=

# Rate Limiting
RATE_LIMIT_IP_PER_MIN=60
RATE_LIMIT_TENANT_PER_MIN=600
```

### Deploy Steps

1. **Using Blueprint**:
   ```bash
   render blueprint deploy infra/render.yaml
   ```

2. **Using Render UI**:
   - Create new Web Service
   - Connect GitHub repository
   - Set Build Command: `corepack enable && pnpm i --frozen-lockfile || pnpm i && pnpm -r build`
   - Set Start Command: `pnpm --filter @inbox-genie/api prisma:migrate && node dist/main.js`
   - Set Health Check Path: `/health/liveness`
   - Add all environment variables listed above

## Web Deployment (Vercel)

### Required Environment Variables

Set in your Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://api.inboxgenie.onrender.com
```

### Deploy Steps

1. **Using Vercel CLI**:
   ```bash
   cd apps/web
   vercel --prod
   ```

2. **Using Vercel UI**:
   - Import GitHub repository
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm install && pnpm --filter @inbox-genie/web build`
   - Install Command: `pnpm install`
   - Output Directory: `.next`
   - Add environment variable: `NEXT_PUBLIC_API_URL`

## Post-Deployment Setup

### 1. Provider Webhooks

Once deployed, configure webhooks in your provider dashboards:

**Twilio**:
- Voice webhook: `https://api.inboxgenie.onrender.com/webhooks/voice`
- SMS webhook: `https://api.inboxgenie.onrender.com/webhooks/sms`

**Retell**:
- Webhook URL: `https://api.inboxgenie.onrender.com/webhooks/voice`

**Stripe** (when enabled):
- Webhook URL: `https://api.inboxgenie.onrender.com/webhooks/billing`

### 2. Domain Configuration

Update CORS settings if using custom domains:
- Set `ALLOWED_ORIGINS` to include your custom domain
- Update `NEXT_PUBLIC_API_URL` if using custom API domain

### 3. Verification

Run smoke tests against production:

```bash
API_BASE=https://api.inboxgenie.onrender.com pnpm smoke
```

## Security Notes

- Keep `DEMO_MODE=true` and `OUTREACH_PAUSED=true` until ready for production
- Never commit secrets to the repository
- Use `DRY_RUN_TO` for safe SMS/call testing
- Redis is optional - system works in null mode

## Troubleshooting

### API Health Checks
- Liveness: `GET /health/liveness`
- Readiness: `GET /health/readiness` (shows DB/Redis status)

### Common Issues
- **Build failures**: Check Node.js version and pnpm lockfile
- **DB connection**: Verify `DATABASE_URL` and `DIRECT_URL`
- **CORS errors**: Check `ALLOWED_ORIGINS` includes your web domain
- **SMS/Voice issues**: Verify provider webhooks and API keys