import '../../app/globals.css'
import Link from 'next/link'
import { DarkCard } from '../../components/ui/card'
import { auth } from '../../auth'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-3">
          <div className="text-lg font-sora mb-4">Inbox Genie</div>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/app/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/app/calls" className="hover:text-white">Calls</Link>
            <Link href="/app/bookings" className="hover:text-white">Bookings</Link>
            <Link href="/app/leads" className="hover:text-white">Leads</Link>
            <Link href="/app/revive" className="hover:text-white">Revive</Link>
            <Link href="/app/settings" className="hover:text-white">Settings</Link>
          </nav>
        </aside>
        <main className="col-span-9 space-y-6">{children}</main>
      </div>
    </div>
  )
}
