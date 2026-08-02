'use client'

import { useState, useEffect } from 'react'
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
  const { settings, updateSettings, darkMode, toggleDarkMode, profile, pushEnabled, togglePush, switchToTeam, switchToPersonal } = useApp()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [teamNameInput, setTeamNameInput] = useState('')
  const [switching, setSwitching] = useState(false)
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      setPushSupported(true)
    }
  }, [])

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

  async function handleSwitchToTeam() {
    if (!teamNameInput.trim()) return
    setSwitching(true)
    await switchToTeam(teamNameInput.trim())
    setSwitching(false)
    setShowTeamModal(false)
    setTeamNameInput('')
  }

  async function handleSwitchToPersonal() {
    setSwitching(true)
    await switchToPersonal()
    setSwitching(false)
    setShowDowngradeConfirm(false)
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
        {pushSupported && (
          <Toggle
            label="Push Notifications"
            desc="Task updates, streak alerts, and timer end — even when the tab is in the background"
            value={pushEnabled}
            onChange={() => togglePush()}
          />
        )}
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

      {/* Account type */}
      <section className="card p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Account</p>
        {profile?.account_type === 'team' ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--primary)', opacity: 0.12, position: 'absolute' }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg relative" style={{ background: '#EEF2FF' }}>
                👥
              </div>
              <div>
                <p className="font-semibold text-sm">{profile.team_name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Team account</p>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              You can assign tasks to team members and see everyone on the Team Wall.
            </p>
            <button
              onClick={() => setShowDowngradeConfirm(true)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm border"
              style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
            >
              Switch to Personal
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#F3F4F6' }}>
                👤
              </div>
              <div>
                <p className="font-semibold text-sm">Personal account</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Just you — tasks and pomodoro</p>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Upgrade to a team account to assign tasks and manage your team.
            </p>
            <button
              onClick={() => setShowTeamModal(true)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Switch to Team
            </button>
          </div>
        )}
      </section>

      <button
        onClick={signOut}
        className="w-full py-3 rounded-xl font-semibold text-sm border mb-8"
        style={{ color: '#EF4444', borderColor: '#FCA5A5', background: '#FFF5F5' }}
      >
        Sign Out
      </button>

      {/* Switch to team modal */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTeamModal(false)}>
          <div className="modal slide-up">
            <h2 className="text-lg font-bold mb-1">Create your team</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Name your team — this could be your company, org, study group, or project.
            </p>
            <input
              className="input mb-4"
              placeholder="e.g. DFY Media, Design Team, CS401..."
              value={teamNameInput}
              onChange={e => setTeamNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSwitchToTeam()}
              autoFocus
            />
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 py-2.5" onClick={() => setShowTeamModal(false)}>Cancel</button>
              <button
                className="flex-1 py-2.5 rounded-xl font-semibold text-white"
                style={{ background: 'var(--primary)', opacity: !teamNameInput.trim() || switching ? 0.5 : 1 }}
                disabled={!teamNameInput.trim() || switching}
                onClick={handleSwitchToTeam}
              >
                {switching ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch to personal confirm */}
      {showDowngradeConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDowngradeConfirm(false)}>
          <div className="modal slide-up">
            <h2 className="text-lg font-bold mb-2">Switch to Personal?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              You'll lose access to the Team Wall and task assignment. Your team members and tasks won't be deleted.
            </p>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 py-2.5" onClick={() => setShowDowngradeConfirm(false)}>Cancel</button>
              <button
                className="flex-1 py-2.5 rounded-xl font-semibold text-white"
                style={{ background: '#EF4444' }}
                disabled={switching}
                onClick={handleSwitchToPersonal}
              >
                {switching ? 'Switching...' : 'Switch to Personal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
