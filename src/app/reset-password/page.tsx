'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; the client lib handles it
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/app'), 2000)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Lock size={28} color="var(--primary)" strokeWidth={2.5} />
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>LockIn</span>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Set new password</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Choose a strong password to protect your account.
          </p>

          {done ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-semibold">Password updated!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Redirecting you to the app...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Verifying your reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input
                className="input"
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
              <input
                className="input"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                className="btn-primary py-3 mt-1"
                disabled={loading}
              >
                {loading ? '...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
