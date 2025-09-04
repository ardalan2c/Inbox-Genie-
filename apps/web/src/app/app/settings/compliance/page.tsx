"use client"
import { useState } from 'react'
import { DarkCard } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { API_BASE } from '@/lib/config'

export default function CompliancePage() {
  const base = API_BASE
  const [csv, setCsv] = useState('')
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  async function refreshLogs() { try { const res = await fetch(`${base}/settings/audit/logs`); const j = await res.json(); setLogs(j.logs || []) } catch {} }
  
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Compliance</h1>
      <DarkCard className="p-5 space-y-3">
        <div className="text-sm">DNC CSV upload (one number per line)</div>
        <textarea className="w-full h-48 rounded-xl text-sm p-3 bg-slate-950/40 border border-slate-800" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <Button className="rounded-full" onClick={async () => { const res = await fetch(`${base}/settings/compliance/dnc/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) }); const j = await res.json(); setStatus(`Inserted ${j.inserted}`); refreshLogs() }}>Upload</Button>
        <div className="text-xs text-slate-400">{status}</div>
      </DarkCard>
      <DarkCard className="p-5 text-sm text-slate-300">Recording notice: This call may be recorded. Reply STOP to opt out.</DarkCard>
      <DarkCard className="p-5">
        <div className="font-medium mb-2">Audit logs</div>
        <Button size="sm" className="rounded-full mb-3" onClick={refreshLogs}>Refresh</Button>
        <ul className="text-xs text-slate-400 space-y-1 max-h-60 overflow-auto">
          {logs.map((l, i) => (<li key={i}>{new Date(l.createdAt).toLocaleString()} — {l.type}</li>))}
        </ul>
      </DarkCard>
    </div>
  )
}
