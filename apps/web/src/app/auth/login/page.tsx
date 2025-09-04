"use client"
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  return (
    <main className="container py-12 grid md:grid-cols-2 gap-10 items-start">
      <div>
        <h1 className="font-sora text-4xl mb-4">Welcome back</h1>
        <p className="text-slate-600 mb-6">Sign in with a magic link. In MVP mode this simulates sign-in.</p>
        <form onSubmit={async (e) => { e.preventDefault(); await signIn('email', { email, redirect: true, callbackUrl: '/app/dashboard' }) }} className="space-y-3 max-w-sm">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border px-4 py-3" />
          <Button className="rounded-full w-full">Send magic link</Button>
        </form>
      </div>
      <div className="rounded-2xl bg-slate-100 p-6">Brand panel</div>
    </main>
  )
}
