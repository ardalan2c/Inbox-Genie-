"use client"
import { useState } from 'react'
import { PLANS } from '@inbox-genie/core'
import { Card } from '../../components/ui/card'
import Script from 'next/script'
import { Button } from '../../components/ui/button'

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  return (
    <main className="container py-12">
      <Script id="product-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product', name: 'Inbox Genie',
        offers: PLANS.map(p=>({ '@type': 'Offer', priceCurrency: 'USD', price: p.priceMonthly, availability: 'https://schema.org/InStock' }))
      }) }} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sora text-4xl tracking-tight">Pricing</h1>
        <div className="flex items-center gap-2 text-sm">
          <span>Monthly</span>
          <button className="relative inline-flex h-6 w-12 items-center rounded-full bg-slate-200" onClick={() => setAnnual(!annual)} aria-pressed={annual} aria-label="Toggle annual">
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span>Annual</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const price = annual ? Math.round(p.priceMonthly * 12 * 0.9) : p.priceMonthly
          return (
            <Card key={p.key} className="p-6">
              <div className="text-sm uppercase tracking-wide text-slate-500">{p.name}</div>
              <div className="text-4xl font-sora mt-2">${price.toLocaleString()}</div>
              <ul className="mt-4 text-sm text-slate-600 space-y-1">
                <li>{p.minutes} pooled voice minutes</li>
                <li>{p.sms.toLocaleString()} SMS</li>
                <li>{p.calendars === 'multi' ? 'Multi-calendar' : `${p.calendars} calendar`}</li>
                <li>{p.crms === 'multi' ? 'Multi-CRM' : `${p.crms} CRM`}</li>
                {p.features.map((f) => (<li key={f}>{f}</li>))}
              </ul>
              <Button className="w-full mt-6 rounded-full">Get started</Button>
              <div className="mt-2 text-xs text-slate-500">Transparent minutes. No setup fees.</div>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
