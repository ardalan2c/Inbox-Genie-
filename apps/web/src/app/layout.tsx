import './globals.css'
import { Inter, Sora } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_BASE } from '@/lib/config'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

const queryClient = new QueryClient()

export const metadata = { title: 'Inbox Genie', description: 'AI front desk for real estate, salons, and clinics.' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const candidates = [API_BASE].filter(Boolean) as string[]
  let demoMode = false
  for (const b of candidates) {
    try {
      const r = await fetch(`${b}/health/keys`, { cache: 'no-store' })
      if (r.ok) { const j = await r.json(); demoMode = !!j?.demoMode; break }
    } catch {}
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} font-inter antialiased bg-slate-50 text-slate-900`}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b">
              <div className="container h-14 flex items-center justify-between">
                <Link href="/" className="font-sora font-semibold tracking-tight">Inbox Genie</Link>
                <nav className="flex items-center gap-6 text-sm">
                  <Link href="/pricing">Pricing</Link>
                  <Link href="/features">Features</Link>
                  {demoMode && <Link href="/demo">Demo</Link>}
                  <Link href="/auth/signup" className="inline-flex items-center rounded-full bg-primary text-white px-4 py-2 shadow-soft">Start free pilot</Link>
                </nav>
              </div>
            </header>
            {children}
            <footer className="border-t mt-24 py-10 text-sm text-slate-500">
              <div className="container flex justify-between">
                <span>© {new Date().getFullYear()} Inbox Genie</span>
                <div className="flex gap-6">
                  <Link href="/security">Security</Link>
                  <Link href="/docs">Docs</Link>
                  <Link href="/contact">Contact</Link>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
