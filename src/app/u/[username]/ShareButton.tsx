'use client'

import { useState } from 'react'

export default function ShareButton({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: copied ? '#D1FAE5' : '#1A1A2E',
        color: copied ? '#059669' : '#9CA3AF',
        border: '1px solid',
        borderColor: copied ? '#6EE7B7' : '#2D2D3F',
      }}
    >
      {copied ? '✓ Copied!' : '🔗 Copy profile link'}
    </button>
  )
}
