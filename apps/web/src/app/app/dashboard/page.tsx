"use client"
import { DarkCard } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/config'

const kpis = [
  { label: 'Answer %', value: '85%' },
  { label: '24/7 voice', value: '30' },
  { label: 'One-tap booking', value: 'CRM' }
]

export default function DashboardPage() {
  const webhook = (path: string) => `${API_BASE}${path}`
  const [usage, setUsage] = useState<any>(null)
  const [ready, setReady] = useState<any>(null)
  useEffect(() => { (async () => { try { const u = await fetch(`${API_BASE}/settings/usage/summary`).then(r=>r.json()); setUsage(u) } catch {} try { const r = await fetch(`${API_BASE}/health/readiness`).then(r=>r.json()); setReady(r) } catch {} })() }, [])
  const items = [
    { label: 'Connect CRM', href: '/app/settings/integrations' },
    { label: 'Connect Calendar', href: '/app/settings/integrations' },
    { label: 'Pick number', href: '/app/settings' },
    { label: 'Test missed-call SMS', href: '/app/settings' }
  ]
  const [testPhone, setTestPhone] = useState('')
  const [demoStatus, setDemoStatus] = useState<{ [key: string]: string }>({})
  const isDemoMode = process.env.NODE_ENV === 'development'
  
  const runDemo = async (action: string, endpoint: string) => {
    setDemoStatus(prev => ({ ...prev, [action]: 'running' }))
    try {
      const response = await fetch(`${API_BASE}/demo/${endpoint}`, { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        setDemoStatus(prev => ({ ...prev, [action]: 'success' }))
        setTimeout(() => setDemoStatus(prev => ({ ...prev, [action]: '' })), 3000)
      } else {
        setDemoStatus(prev => ({ ...prev, [action]: 'error' }))
        setTimeout(() => setDemoStatus(prev => ({ ...prev, [action]: '' })), 3000)
      }
    } catch (error) {
      setDemoStatus(prev => ({ ...prev, [action]: 'error' }))
      setTimeout(() => setDemoStatus(prev => ({ ...prev, [action]: '' })), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-3xl tracking-tight">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <DarkCard key={k.label} className="p-5">
            <div className="text-sm text-slate-400">{k.label}</div>
            <div className="text-3xl font-sora">{k.value}</div>
          </DarkCard>
        ))}
      </div>

      <DarkCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Go Live checklist</div>
        </div>
        {ready && <div className="text-xs text-slate-400 mb-2">Readiness: {ready.ready ? 'green' : 'degraded'}</div>}
        <ul className="space-y-3">
          <li className="flex items-center justify-between"><span>Copy Voice webhook URL</span><Copy value={webhook('/webhooks/voice')} /></li>
          <li className="flex items-center justify-between"><span>Copy SMS webhook URL</span><Copy value={webhook('/webhooks/sms')} /></li>
          <li className="flex items-center justify-between"><span>Copy Stripe webhook URL</span><Copy value={webhook('/webhooks/billing')} /></li>
          {items.map((i) => (
            <li key={i.label} className="flex items-center justify-between text-slate-300"><span>{i.label}</span><a className="text-sm text-white underline" href={i.href}>Open</a></li>
          ))}
        </ul>
      </DarkCard>

      {usage && (
        <DarkCard className="p-5">
          <div className="font-medium mb-3">Usage</div>
          <div className="text-sm">Voice minutes: {usage.usage.voice}/{usage.caps.minutes}</div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="bg-accent h-2" style={{ width: `${Math.min(100, (usage.usage.voice/usage.caps.minutes)*100)}%` }} /></div>
          <div className="text-sm mt-3">SMS: {usage.usage.sms}/{usage.caps.sms}</div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="bg-primary h-2" style={{ width: `${Math.min(100, (usage.usage.sms/usage.caps.sms)*100)}%` }} /></div>
          {usage.overage.minutes>0 && <div className="mt-2 text-amber-400 text-xs">Overage estimated: ${usage.overage.estimateCents/100}</div>}
        </DarkCard>
      )}

      {isDemoMode && (
        <DarkCard className="p-5">
          <div className="font-medium mb-4">🎭 Demo Mode - Safe Testing</div>
          <div className="text-sm text-slate-400 mb-4">Test all features safely with mock providers - no real API calls or charges!</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              className="rounded-xl h-12 flex items-center justify-between bg-blue-900/50 hover:bg-blue-900/70 border border-blue-700"
              onClick={() => runDemo('seed', 'seed')}
              disabled={demoStatus.seed === 'running'}
            >
              <span>🌱 Seed Demo Data</span>
              <StatusIcon status={demoStatus.seed} />
            </Button>
            
            <Button 
              className="rounded-xl h-12 flex items-center justify-between bg-green-900/50 hover:bg-green-900/70 border border-green-700"
              onClick={() => runDemo('missed', 'missed-call')}
              disabled={demoStatus.missed === 'running'}
            >
              <span>📞 Simulate Missed Call → SMS</span>
              <StatusIcon status={demoStatus.missed} />
            </Button>
            
            <Button 
              className="rounded-xl h-12 flex items-center justify-between bg-purple-900/50 hover:bg-purple-900/70 border border-purple-700"
              onClick={() => runDemo('revive', 'revive')}
              disabled={demoStatus.revive === 'running'}
            >
              <span>🔄 Simulate Revive Call</span>
              <StatusIcon status={demoStatus.revive} />
            </Button>
            
            <Button 
              className="rounded-xl h-12 flex items-center justify-between bg-orange-900/50 hover:bg-orange-900/70 border border-orange-700"
              onClick={() => runDemo('voice', 'voice/summary')}
              disabled={demoStatus.voice === 'running'}
            >
              <span>🎤 Inject Voice Summary</span>
              <StatusIcon status={demoStatus.voice} />
            </Button>
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            💡 Check browser console and server logs to see mock provider actions
          </div>
        </DarkCard>
      )}

      <DarkCard className="p-5">
        <div className="font-medium mb-2">Send test 3-slot SMS</div>
        <div className="flex gap-2 items-center">
          <input value={testPhone} onChange={(e)=>setTestPhone(e.target.value)} placeholder="+1XXXXXXXXXX" className="rounded-xl px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100" />
          <Button className="rounded-full" size="sm" onClick={async()=>{await fetch(`${API_BASE}/booking/test-sms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:testPhone})})}}>Send</Button>
          <div className="text-xs text-slate-400">DRY_RUN_TO overrides in dev</div>
        </div>
      </DarkCard>
    </div>
  )
}

function Copy({ value }: { value: string }) {
  return <Button onClick={() => navigator.clipboard.writeText(value)} className="rounded-full" size="sm">Copy</Button>
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'running') return <div className="text-blue-400 animate-spin">⟳</div>
  if (status === 'success') return <div className="text-green-400">✓</div>
  if (status === 'error') return <div className="text-red-400">✗</div>
  return null
}
