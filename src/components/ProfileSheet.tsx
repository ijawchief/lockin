'use client'

import { useState, useRef } from 'react'
import { X, Link2 } from 'lucide-react'

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
import { useApp } from '@/contexts/AppContext'
import { getLevel, LEVEL_CONFIG, ACHIEVEMENTS } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface Props { onClose: () => void }

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useApp()
  const [name, setName] = useState(profile?.name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [twitter, setTwitter] = useState(profile?.twitter ?? '')
  const [instagram, setInstagram] = useState(profile?.instagram ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    await updateProfile({ name, username, bio, twitter, instagram, website })
    setSaving(false)
    onClose()
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: data.publicUrl })
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0">
            <X size={18} />
          </button>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 cursor-pointer flex items-center justify-center"
            onClick={() => fileRef.current?.click()}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: 'var(--muted)' }}>
                {profile?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <button className="btn-ghost px-3 py-2 text-sm" onClick={() => fileRef.current?.click()}>
            Change photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="flex flex-col gap-3">
          <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <textarea className="input resize-none" placeholder="Bio" rows={2} value={bio} onChange={e => setBio(e.target.value)} />
          <input className="input" placeholder="Twitter / X handle" value={twitter} onChange={e => setTwitter(e.target.value)} />
          <input className="input" placeholder="Instagram handle" value={instagram} onChange={e => setInstagram(e.target.value)} />
          <input className="input" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
          <button className="btn-primary py-3" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfileSheet({ onClose }: Props) {
  const { profile, sessions } = useApp()
  const [showEdit, setShowEdit] = useState(false)

  const pomSessions = sessions.filter(s => s.mode === 'pomodoro')
  const totalSessions = pomSessions.length
  const totalHours = (pomSessions.reduce((acc, s) => acc + (s.duration ?? 1500), 0) / 3600).toFixed(1)
  const level = getLevel(totalSessions)
  const currentLevelConfig = LEVEL_CONFIG.find(l => l.name === level.name) ?? LEVEL_CONFIG[0]
  const nextLevelConfig = LEVEL_CONFIG[LEVEL_CONFIG.indexOf(currentLevelConfig) + 1]
  const levelProgress = nextLevelConfig
    ? ((totalSessions - currentLevelConfig.min) / (nextLevelConfig.min - currentLevelConfig.min)) * 100
    : 100

  const streak = profile?.streak ?? 0
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(totalSessions, streak))
  const badgeCount = unlockedAchievements.length

  function shareStats() {
    const text = `I've completed ${totalSessions} focus sessions (${totalHours}h) on LockIn! 🔒\n\n#LockIn #Productivity #Pomodoro`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  function copyLink() {
    if (profile?.username) {
      navigator.clipboard.writeText(`${location.origin}/u/${profile.username}`)
    }
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: 'var(--muted)' }}>
                    {profile?.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{profile?.name ?? 'User'}</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>@{profile?.username ?? 'user'}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl">{level.emoji}</span>
                  <p className="text-xs font-bold" style={{ color: '#10B981' }}>{level.name}</p>
                </div>
              </div>
              {profile?.bio && (
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Level progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Level progress</span>
              <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
                {totalSessions} / {nextLevelConfig?.min ?? '∞'} sessions
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${levelProgress}%`, background: '#10B981', transition: 'width 0.5s' }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 border rounded-xl overflow-hidden mb-5" style={{ borderColor: 'var(--border)' }}>
            {[
              { emoji: '🔥', value: streak || '—', label: 'Streak' },
              { emoji: '🔒', value: totalSessions, label: 'Sessions', color: 'var(--primary)' },
              { emoji: '⏰', value: `${totalHours}h`, label: 'Hours', color: '#8B5CF6' },
              { emoji: '🏅', value: `${badgeCount}/10`, label: 'Badges', color: '#F59E0B' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center py-3 border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
                <span className="text-lg">{stat.emoji}</span>
                <span className="text-sm font-bold mt-0.5" style={{ color: stat.color ?? 'var(--text)' }}>{stat.value}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div className="mb-5">
            <p className="font-bold mb-3">Achievements</p>
            <div className="grid grid-cols-5 gap-3">
              {ACHIEVEMENTS.map(a => {
                const unlocked = a.condition(totalSessions, streak)
                return (
                  <div key={a.id} className="flex flex-col items-center gap-1" title={a.desc}>
                    <div className={`text-2xl ${unlocked ? '' : 'badge-locked'}`}>{a.emoji}</div>
                    <span className="text-xs text-center leading-tight" style={{ color: unlocked ? 'var(--text)' : 'var(--muted)', fontSize: 9 }}>
                      {a.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Social links */}
          {(profile?.twitter || profile?.instagram || profile?.website) && (
            <div className="mb-5">
              <p className="font-bold mb-3">Links</p>
              <div className="flex flex-wrap gap-2">
                {profile?.twitter && (
                  <a
                    href={`https://x.com/${profile.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
                  >
                    <XIcon size={14} /> x.com/{profile.twitter}
                  </a>
                )}
                {profile?.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
                  >
                    📸 instagram.com/{profile.instagram}
                  </a>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
                  >
                    <Link2 size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 py-3 text-sm font-semibold" onClick={() => setShowEdit(true)}>
              Edit profile
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: '#000' }}
              onClick={shareStats}
            >
              <XIcon size={15} /> Share stats
            </button>
            <button className="btn-ghost w-12 flex items-center justify-center" onClick={copyLink} title="Copy profile link">
              <Link2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </>
  )
}
