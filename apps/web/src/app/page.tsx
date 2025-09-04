'use client'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Tabs } from '../components/ui/tabs'
import { Pill } from '../components/ui/badge'
import { Accordion } from '../components/ui/accordion'
import { EnvBanner } from '../components/banner-env'

export default function HomePage() {
  return (
    <main>
      <Script id="jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite', name: 'Inbox Genie', url: 'https://inboxgenie.app',
        potentialAction: { '@type': 'SearchAction', target: 'https://inboxgenie.app/?q={search_term_string}', 'query-input': 'required name=search_term_string' }
      }) }} />
      <EnvBanner />
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'FAQPage', mainEntity:[{ '@type':'Question','name':'Transparent minutes. No setup fees.','acceptedAnswer':{'@type':'Answer','text':'Usage is pooled across your team. Overage $0.12–$0.15/min.' } },{ '@type':'Question','name':'Compliance','acceptedAnswer':{'@type':'Answer','text':'This call may be recorded. Reply STOP to opt out.'}}] }) }} />
      <section className="container grid md:grid-cols-2 gap-12 items-center py-16">
        <div>
          <h1 className="font-sora text-5xl md:text-6xl tracking-tight mb-6">Never miss another lead.</h1>
          <p className="text-lg text-slate-600 mb-6">An AI front desk that answers, qualifies, books, revives dormant leads, and writes back to your CRM—24/7.</p>
          <div className="flex gap-3">
            <Button className="rounded-full">Start free pilot</Button>
            <Button variant="outline" className="rounded-full">Watch 2 min demo</Button>
          </div>
        </div>
        <div className="relative">
          <Card className="p-4 aspect-video flex items-center justify-center">
            <div className="w-full h-48 bg-primary/10 rounded-xl" />
          </Card>
        </div>
      </section>

      <section className="container py-10">
        <div className="opacity-60 text-sm">Toronto brokerages trust Inbox Genie.</div>
        <div className="h-10" />
        <div className="flex flex-wrap gap-3">
          {['Missed-call → instant text-back', '24/7 voice', 'One-tap booking', 'CRM notes', 'Revive engine', 'Analytics'].map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
        </div>
        <div className="h-6" />
        <Tabs items={["Missed-call", "24/7 voice", "Booking", "CRM notes", "Revive", "Analytics"]} value={'Missed-call'} onChange={() => {}} />
      </section>

      <section className="container grid md:grid-cols-3 gap-6">
        {[
          { title: 'Instantly text back all missed calls with a calendar link.' },
          { title: '+12 bookings/mo' },
          { title: '−40% no-shows' }
        ].map((c, i) => (
          <Card key={i} className="p-6"><div className="text-lg font-medium">{c.title}</div></Card>
        ))}
      </section>

      <section className="container grid md:grid-cols-4 gap-6 mt-10">
        {['Missed call → SMS', 'Voice agent answers & books', 'Calendar + CRM write‑back', 'Compliance: recording notice, hours, consent'].map((f) => (
          <Card key={f} className="p-5 text-sm"><div className="font-medium mb-1">{f}</div><p className="text-slate-600">Production-ready building blocks.</p></Card>
        ))}
      </section>

      <section className="container grid md:grid-cols-2 gap-10 mt-16 items-start">
        <div>
          <div className="font-medium mb-4">Pricing teaser</div>
          <Card className="p-6">
            <div className="flex gap-6">
              <div className="rounded-2xl border p-4 flex-1"><div className="font-medium">Starter</div><div className="text-3xl font-sora mt-2">$299</div></div>
              <div className="rounded-2xl border p-4 flex-1"><div className="font-medium">Pro</div><div className="text-3xl font-sora mt-2">$499</div></div>
              <div className="rounded-2xl border p-4 flex-1"><div className="font-medium">Team-10</div><div className="text-3xl font-sora mt-2">$2,990</div></div>
            </div>
            <Link className="inline-block mt-6 text-primary" href="/pricing">See full pricing →</Link>
          </Card>
        </div>
        <div>
          <div className="font-medium mb-4">FAQ</div>
          <Accordion items={[
            { id: 'acc1', title: 'Transparent minutes. No setup fees.', content: 'Usage is pooled across your team. Overage $0.12–$0.15/min.' },
            { id: 'acc2', title: 'Compliance', content: 'This call may be recorded. Reply STOP to opt out.' },
          ]} />
        </div>
      </section>
    </main>
  )
}
