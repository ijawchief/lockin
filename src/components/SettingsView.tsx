'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'

function NumericSetting({ label, value, onChange, min = 1, max = 60 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <ChevronDown size={16} />
        </button>
        <span className="w-8 text-center font-semibold text-sm">{value}m</span>
        <button
          className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <ChevronUp size={16} />
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
        style={{ background: value ? 'var(--primary)' : 'var(--border)' }}
      >
        <div
          className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
          style={{ left: value ? '23px' : '2px' }}
        />
      </button>
    </div>
  )
}

export default function SettingsView() {
  const { settings, updateSettings, darkMode, toggleDarkMode, profile } = useApp()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function copyInviteLink() {
    const link = profile?.username
      ? `https://lockinhq.co/u/${profile.username}`
      : 'https://lockinhq.co'
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="scroll-area px-4 pt-4">
      <h1 className="text-2xl font-bold mb-5">Settings</h1>

      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Timer</p>
        <NumericSetting label="Pomodoro" value={settings.pomo_duration} onChange={v => updateSettings({ pomo_duration: v })} />
        <NumericSetting label="Short Break" value={settings.short_break} onChange={v => updateSettings({ short_break: v })} />
        <NumericSetting label="Long Break" value={settings.long_break} onChange={v => updateSettings({ long_break: v })} />
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium">Long break every</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
              onClick={() => updateSettings({ long_break_interval: Math.max(1, settings.long_break_interval - 1) })}
            >
              <ChevronDown size={16} />
            </button>
            <span className="w-16 text-center font-semibold text-sm">{settings.long_break_interval} pomos</span>
            <button
              className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
              onClick={() => updateSettings({ long_break_interval: Math.min(10, settings.long_break_interval + 1) })}
            >
              <ChevronUp size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Automation</p>
        <Toggle
          label="Auto-start Break"
          desc="Automatically start break when pomo ends"
          value={settings.auto_start_break}
          onChange={v => updateSettings({ auto_start_break: v })}
        />
        <Toggle
          label="Auto-start Pomodoro"
          desc="Automatically start pomo when break ends"
          value={settings.auto_start_pomo}
          onChange={v => updateSettings({ auto_start_pomo: v })}
        />
      </section>

      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Notifications</p>
        <Toggle
          label="Sound"
          desc="Play alarm when timer ends"
          value={settings.sound_enabled}
          onChange={v => updateSettings({ sound_enabled: v })}
        />
      </section>

      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Appearance</p>
        <Toggle
          label="Dark Mode"
          desc="Switch to a dark colour scheme"
          value={darkMode}
          onChange={toggleDarkMode}
        />
      </section>

      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Invite Your Team</p>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          Share your profile link — teammates see your stats and can sign up from there.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="text-xs flex-1 truncate" style={{ color: 'var(--muted)' }}>
            lockinhq.co/u/{profile?.username ?? '…'}
          </span>
        </div>
        <button
          onClick={copyInviteLink}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: copied ? '#D1FAE5' : 'var(--primary)',
            color: copied ? '#059669' : 'white',
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Copy invite link'}
        </button>
      </section>

      <button
        onClick={signOut}
        className="w-full py-3 rounded-xl font-semibold text-sm border"
        style={{ color: '#EF4444', borderColor: '#FCA5A5', background: '#FFF5F5' }}
      >
        Sign Out
      </button>
    </div>
  )
}
