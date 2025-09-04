# Runbook

## Local dev

1. pnpm install
2. docker compose -f infra/docker-compose.yml up -d
3. make migrate && make seed
4. pnpm -r dev (web on 3000, api on 3001)

Expose via ngrok: `ngrok http 3001` for API webhooks or `3000` if behind same origin.

Set provider webhooks to your ngrok URL:
- Twilio Voice → POST /webhooks/voice
- Twilio SMS → POST /webhooks/sms
- Stripe → POST /webhooks/billing
- Retell → POST /webhooks/voice

## Webhook caveats
- Twilio signature verification requires the exact public URL used (APP_BASE_URL); include scheme and path.
- Stripe requires the raw body; Fastify raw-body plugin is registered.
- Retell posts JSON events; summary.ready triggers CRM write-back (501 when FUB key missing).

## Kill switch / Dry run
- Toggle `OUTREACH_PAUSED=true` (env or /revive/pause) to stop dialing.
- `DRY_RUN_TO` can override dial target for safe testing.
- Concurrency cap: `Tenant.concurrencyCap` (default 3). Increase only after load tests.

## Usage metering
- Voice minutes increment on `call.ended` (rounded up to full minute).
- SMS increments on booking confirmation and inbound confirmations.
- Soft overage: recorded in `OverageEstimate`; UI flags when pools exceeded.

## Booking flow
- GET /availability → fallback +1h,+2h,+3h when OAuth missing
- POST /booking/hold → Redis SETNX TTL 180s
- POST /booking/confirm → creates Booking; returns 501 if Twilio not configured for SMS

## Health & Observability
- Liveness: GET /health/liveness → 200
- Readiness: GET /health/readiness → DB/Redis/env checks
- Sentry: set `SENTRY_DSN` to capture errors (web & api)
- OpenTelemetry traces: set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable OTLP HTTP export
