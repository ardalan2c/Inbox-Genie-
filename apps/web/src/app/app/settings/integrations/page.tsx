"use client"
import { useEffect, useState } from 'react'
import { DarkCard } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { API_BASE } from '@/lib/config'

export default function IntegrationsPage() {
  const base = API_BASE
  const [state, setState] = useState<any>({})
  useEffect(() => { (async () => { const res = await fetch(`${base}/settings/integrations/state`); setState(await res.json()) })() }, [])
  const webhook = (path: string) => `${base}${path}`
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Integrations</h1>
      <DarkCard className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div><div className="text-sm">FollowUpBoss</div><div className={`text-xs ${state.fub ? 'text-green-400' : 'text-amber-400'}`}>{state.fub ? 'Connected' : 'Missing API key'}</div></div>
          <div><div className="text-sm">Google Calendar</div><div className={`text-xs ${state.google ? 'text-green-400' : 'text-amber-400'}`}>{state.google ? 'Connected' : 'Not connected'}</div><a className="underline text-xs" href={`${base}/oauth/google/start`}>Connect →</a></div>
          <div><div className="text-sm">Twilio</div><div className={`text-xs ${state.twilio ? 'text-green-400' : 'text-amber-400'}`}>{state.twilio ? 'Configured' : 'Missing env keys'}</div></div>
          <div><div className="text-sm">Stripe</div><div className={`text-xs ${state.stripe ? 'text-green-400' : 'text-amber-400'}`}>{state.stripe ? 'Configured' : 'Missing env keys'}</div></div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-sm">Copy webhook URLs</div>
          <Copy value={webhook('/webhooks/voice')} />
          <Copy value={webhook('/webhooks/sms')} />
          <Copy value={webhook('/webhooks/billing')} />
        </div>
      </DarkCard>
    </div>
  )
}

function Copy({ value }: { value: string }) { return <Button size="sm" className="rounded-full" onClick={() => navigator.clipboard.writeText(value)}>Copy {new URL(value).pathname}</Button> }

