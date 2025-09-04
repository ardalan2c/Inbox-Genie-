"use client"
import { useEffect, useState } from 'react'
import { DarkCard } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { API_BASE } from '@/lib/config'

export default function BusinessProfilePage() {
  const base = API_BASE
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  useEffect(() => { (async () => {
    const res = await fetch(`${base}/settings/business-profile`)
    const j = await res.json()
    setText(JSON.stringify(j.profile, null, 2))
  })() }, [])
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Business Profile</h1>
      <DarkCard className="p-5 space-y-3">
        <textarea className="w-full h-80 rounded-xl text-sm p-3 bg-slate-950/40 border border-slate-800" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-3">
          <Button className="rounded-full" onClick={async () => { const res = await fetch(`${base}/settings/business-profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: JSON.parse(text) }) }); const j = await res.json(); setStatus('Saved'); }}>Save</Button>
          <span className="text-sm text-slate-400">{status}</span>
        </div>
      </DarkCard>
    </div>
  )
}

