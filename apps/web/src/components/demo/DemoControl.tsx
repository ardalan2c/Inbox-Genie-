"use client"
import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ProviderPill } from '../ui/ProviderPill'
import { CopyBlock } from '../ui/CopyBlock'
import Link from 'next/link'
import { apiPost } from '../../lib/api'
import { Toaster, toast } from 'sonner'

type ProviderStatus = {
  demoMode: boolean
  retell: boolean
  twilio: boolean
  stripe: boolean
  fub: boolean
  google: boolean
}

export function DemoControl({ status, apiBase }: { status: ProviderStatus; apiBase: string }) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const [ariaMessage, setAriaMessage] = React.useState('')

  const post = async (path: string, label: string) => {
    if (busy) return
    setBusy(label)
    setAriaMessage('')
    try {
      const res = await apiPost(path)
      const msg = typeof res?.message === 'string' ? res.message : `${label} succeeded`
      toast.success(msg)
      setAriaMessage(msg)
    } catch (e: any) {
      const err = e?.message || `${label} failed`
      toast.error(err)
      setAriaMessage(err)
    } finally {
      setBusy(null)
    }
  }

  const curl = (p: string) => `curl -X POST "${apiBase}${p}"`

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-800 border-indigo-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden />
            Demo Mode — no real calls/SMS/billing
          </span>
          <ProviderPill name="Demo" real={status.demoMode} demoMode={status.demoMode} />
          <ProviderPill name="Retell" real={status.retell} demoMode={status.demoMode} />
          <ProviderPill name="Twilio" real={status.twilio} demoMode={status.demoMode} />
          <ProviderPill name="Stripe" real={status.stripe} demoMode={status.demoMode} />
          <ProviderPill name="FUB" real={status.fub} demoMode={status.demoMode} />
          <ProviderPill name="Google" real={status.google} demoMode={status.demoMode} />
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/app/dashboard" className="text-sm underline hover:no-underline">Dashboard</Link>
          <Link href="/app/calls" className="text-sm underline hover:no-underline">Calls</Link>
          <Link href="/app/revive" className="text-sm underline hover:no-underline">Revive</Link>
          <Link href="/pricing" className="text-sm underline hover:no-underline">Pricing</Link>
          <Link href="/" className="text-sm underline hover:no-underline">Home</Link>
        </nav>
      </div>

      <div aria-live="polite" role="status" className="sr-only">{ariaMessage}</div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium mb-2">Seed demo data</h3>
          <p className="text-sm text-slate-600 mb-4">Create sample tenant, leads, calls, and bookings.</p>
          <Button onClick={() => post('/demo/seed', 'Seed demo data')} disabled={busy!==null} aria-busy={busy==='Seed demo data'}>
            {busy==='Seed demo data' ? 'Seeding…' : 'Seed demo data'}
          </Button>
          <CopyBlock value={curl('/demo/seed')} />
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-2">Simulate missed call → SMS</h3>
          <p className="text-sm text-slate-600 mb-4">Log a missed call and send SMS with booking slots.</p>
          <Button onClick={() => post('/demo/missed-call', 'Simulate missed call')} disabled={busy!==null} aria-busy={busy==='Simulate missed call'}>
            {busy==='Simulate missed call' ? 'Simulating…' : 'Simulate missed call'}
          </Button>
          <CopyBlock value={curl('/demo/missed-call')} />
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-2">Simulate revive campaign</h3>
          <p className="text-sm text-slate-600 mb-4">Queue outbound calls to dormant leads.</p>
          <Button onClick={() => post('/demo/revive', 'Simulate revive campaign')} disabled={busy!==null} aria-busy={busy==='Simulate revive campaign'}>
            {busy==='Simulate revive campaign' ? 'Starting…' : 'Simulate revive campaign'}
          </Button>
          <CopyBlock value={curl('/demo/revive')} />
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-2">Inject voice summary (CRM note)</h3>
          <p className="text-sm text-slate-600 mb-4">Simulate call summary and CRM note/task.</p>
          <Button onClick={() => post('/demo/voice/summary', 'Inject voice summary')} disabled={busy!==null} aria-busy={busy==='Inject voice summary'}>
            {busy==='Inject voice summary' ? 'Injecting…' : 'Inject voice summary'}
          </Button>
          <CopyBlock value={curl('/demo/voice/summary')} />
        </Card>
      </div>

      <div className="space-y-3">
        <details className="rounded-2xl border bg-white p-6">
          <summary className="cursor-pointer list-none font-medium">What’s implemented</summary>
          <div className="mt-3 text-sm text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>Demo seeding of tenant, leads, calls, bookings</li>
              <li>Missed call → SMS with booking slots (mock or real Twilio)</li>
              <li>Revive campaign calls (mock or real Retell)</li>
              <li>Voice summary processing + CRM (mock or real FUB)</li>
            </ul>
          </div>
        </details>
        <details className="rounded-2xl border bg-white p-6">
          <summary className="cursor-pointer list-none font-medium">Technical notes</summary>
          <div className="mt-3 text-sm text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>Actions POST to API with credentials included</li>
              <li>Provider pills reflect real vs mock based on keys and demo mode</li>
              <li>ARIA-live announces success/error; buttons are fully focusable</li>
              <li>Respects reduced motion by avoiding animations</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  )
}

