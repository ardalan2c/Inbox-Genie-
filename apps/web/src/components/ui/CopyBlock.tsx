"use client"
import React from 'react'

export function CopyBlock({ label = 'Copy', value }: { label?: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="group relative mt-2 rounded-xl border bg-slate-50">
      <pre className="overflow-x-auto px-4 py-3 text-xs text-slate-800"><code>{value}</code></pre>
      <button onClick={onCopy} className="absolute right-2 top-2 rounded-full border bg-white px-3 py-1 text-xs shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
        {copied ? 'Copied' : label}
      </button>
    </div>
  )
}

