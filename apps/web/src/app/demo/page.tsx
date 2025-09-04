import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { DemoControl } from '../../components/demo/DemoControl'
import { API_BASE } from '@/lib/config'

export default async function DemoPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const candidates = [API_BASE].filter(Boolean) as string[]
  let keys: any = null
  let base = candidates[0]!
  for (const b of candidates) {
    try {
      const r = await fetch(`${b}/health/keys`, { cache: 'no-store' })
      if (r.ok) { keys = await r.json(); base = b; break }
    } catch {}
  }
  if (!keys) redirect('/')
  
  if (!keys?.demoMode) redirect('/')

  const apiBase = base
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container py-10">
        <h1 className="text-3xl font-sora font-semibold mb-6">Inbox Genie — Demo Control Center</h1>
        <DemoControl status={{ demoMode: !!keys.demoMode, retell: !!keys.retell, twilio: !!keys.twilio, stripe: !!keys.stripe, fub: !!keys.fub, google: !!keys.google }} apiBase={apiBase} />
      </div>
    </div>
  )
}
