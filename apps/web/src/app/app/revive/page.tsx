"use client"
import { useState } from 'react'
import { DarkCard } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { API_BASE } from '@/lib/config'

export default function RevivePage() {
  const [status, setStatus] = useState<string>('Idle')
  const call = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST' })
    const j = await res.json()
    setStatus(JSON.stringify(j))
  }
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Revive</h1>
      <DarkCard className="p-5 space-y-3">
        <div className="flex gap-3">
          <Button className="rounded-full" onClick={() => call('/revive/fetch')}>Fetch leads</Button>
          <Button className="rounded-full" onClick={() => call('/revive/enqueue')}>Enqueue jobs</Button>
          <Button className="rounded-full" onClick={() => call('/revive/tick')}>Start tick</Button>
          <Button className="rounded-full" onClick={() => call('/revive/pause')}>Pause</Button>
          <Button className="rounded-full" onClick={() => call('/revive/resume')}>Resume</Button>
        </div>
        <pre className="text-xs bg-slate-800/50 p-3 rounded-xl">{status}</pre>
      </DarkCard>
    </div>
  )
}

