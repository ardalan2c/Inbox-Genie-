"use client"
import { useEffect, useState } from 'react'
import { DarkCard } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { API_BASE } from '@/lib/config'

export default function BillingPage() {
  const base = API_BASE
  const [summary, setSummary] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  useEffect(() => { (async () => { const res = await fetch(`${base}/settings/billing/summary`); setSummary(await res.json()); const u = await fetch(`${base}/settings/usage/summary`).then(r=>r.json()); setUsage(u) })() }, [])
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Billing</h1>
      <DarkCard className="p-5 space-y-3">
        <div className="text-sm">Plan: {summary?.subscriptionId ? 'Active' : 'Not active'}</div>
        <div className="flex gap-3">
          <CheckoutButton plan="starter" label="Start Starter" />
          <CheckoutButton plan="pro" label="Start Pro" />
          <CheckoutButton plan="team10" label="Start Team-10" />
          {summary?.customerId && <a className="underline text-sm" href={`${base}/billing/portal?customerId=${summary.customerId}`}>Open customer portal →</a>}
        </div>
        <div className="text-sm">Invoices</div>
        <ul className="text-xs text-slate-400 list-disc pl-5">
          {(summary?.invoices || []).map((i: any) => (<li key={i.id}>{i.status} — {i.totalCents || 0} cents</li>))}
        </ul>
        {usage && (
          <div className="pt-4">
            <div className="text-sm">Voice minutes: {usage.usage.voice}/{usage.caps.minutes}</div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="bg-accent h-2" style={{ width: `${Math.min(100, (usage.usage.voice/usage.caps.minutes)*100)}%` }} /></div>
            <div className="text-sm mt-3">SMS: {usage.usage.sms}/{usage.caps.sms}</div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="bg-primary h-2" style={{ width: `${Math.min(100, (usage.usage.sms/usage.caps.sms)*100)}%` }} /></div>
          </div>
        )}
      </DarkCard>
    </div>
  )
}

function CheckoutButton({ plan, label }: { plan: 'starter'|'pro'|'team10'; label: string }) {
  const base = API_BASE
  return <Button className="rounded-full" onClick={async () => { const res = await fetch(`${base}/billing/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) }); const j = await res.json(); if (j.url) window.location.href = j.url }}> {label} </Button>
}
