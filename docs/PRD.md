# Inbox Genie — PRD (MVP)

Goal: AI front desk for real estate → salons/clinics. Answer calls, text back missed calls, qualify, book, revive dormant leads, and write back to CRM — 24/7. Demo-capable today.

Must haves
- Landing + pricing match UI theme
- Dark dashboard with KPIs + Go Live checklist
- Availability API with fallback 3 slots
- Hold (Redis SETNX TTL 180s) and Confirm endpoints
- Webhooks: voice (Retell), SMS (Twilio), billing (Stripe)
- Compliance guard (quiet hours, kill switch)
- Revive module skeleton: fetch, enqueue, pause/resume, worker tick
- Env banner when keys missing; endpoints return 501

Acceptance
- Lighthouse ≥95 on / and /pricing
- /availability returns 3 slots without OAuth
- Twilio webhook verifies signature and parses 1/2/3 + STOP
- Voice webhook persists summary.ready
- Dashboard checklist copy-webhook URLs work

