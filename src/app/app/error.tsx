'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0F0F14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8654A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={18} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 800, color: 'white', fontSize: 20 }}>LockIn</span>
      </div>

      {/* Icon */}
      <div style={{ fontSize: 72, marginBottom: 24, lineHeight: 1 }}>🔓</div>

      {/* Headline */}
      <h1 style={{
        color: 'white',
        fontSize: 'clamp(28px, 6vw, 40px)',
        fontWeight: 900,
        letterSpacing: '-0.03em',
        marginBottom: 16,
        lineHeight: 1.1,
      }}>
        You just got<br />unlocked.
      </h1>

      {/* Sub */}
      <p style={{
        color: '#6B7280',
        fontSize: 16,
        lineHeight: 1.7,
        maxWidth: 360,
        marginBottom: 12,
      }}>
        Something broke mid-session. It happens — even the best lose focus for a second.
      </p>
      <p style={{
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: 600,
        marginBottom: 40,
      }}>
        The question is: how fast do you get back?
      </p>

      {/* CTA row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          onClick={reset}
          style={{
            background: '#E8654A',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            padding: '14px 28px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(232,101,74,0.35)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(232,101,74,0.45)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(232,101,74,0.35)'
          }}
        >
          🔒 Lock back in
        </button>

        <Link href="/app" style={{
          color: '#6B7280',
          fontSize: 14,
          textDecoration: 'none',
          padding: '10px',
        }}>
          Or reload the app →
        </Link>
      </div>

      {/* Streak reminder */}
      <p style={{ color: '#374151', fontSize: 12, marginTop: 48 }}>
        Your streak is still intact — don&apos;t let a bug end it.
      </p>
    </div>
  )
}
