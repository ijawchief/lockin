import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { LEVEL_CONFIG } from '@/lib/types'
import ShareButton from './ShareButton'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A plain anon-key client — no cookies needed for public pages
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = { params: Promise<{ username: string }> }

interface WeekDay { day: string; count: number }
interface PublicProfileData {
  profile: {
    id: string
    name: string
    username: string
    bio: string
    avatar_url: string | null
    streak: number
    twitter: string
    instagram: string
    website: string
    created_at: string
  }
  total_pomos: number
  total_focus_hours: number
  tasks_done: number
  weekly_data: WeekDay[]
}

async function fetchProfile(username: string): Promise<PublicProfileData | null> {
  const { data, error } = await db.rpc('get_public_profile', { p_username: username })
  if (error || !data) return null
  return data as PublicProfileData
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const data = await fetchProfile(username)
  if (!data) return { title: 'User not found — LockIn' }

  const { profile, total_pomos } = data
  const level = LEVEL_CONFIG.find(l => total_pomos >= l.min && total_pomos < l.max) ?? LEVEL_CONFIG[0]
  const desc = `${level.emoji} ${level.name} · ${total_pomos} pomos completed · ${profile.streak} day streak · Focusing with LockIn`

  return {
    title: `${profile.name} (@${username}) — LockIn`,
    description: desc,
    openGraph: {
      title: `${profile.name}'s Focus Profile`,
      description: desc,
      url: `https://lockinhq.co/u/${username}`,
      siteName: 'LockIn',
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${profile.name}'s LockIn Profile`,
      description: desc,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const data = await fetchProfile(username)
  if (!data) notFound()

  const { profile, total_pomos, total_focus_hours, tasks_done, weekly_data } = data
  const level = LEVEL_CONFIG.find(l => total_pomos >= l.min && total_pomos < l.max) ?? LEVEL_CONFIG[0]
  const maxCount = Math.max(...(weekly_data ?? []).map(d => d.count), 1)
  const profileUrl = `https://lockinhq.co/u/${username}`

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start py-12 px-4"
      style={{ background: '#0F0F14' }}>

      {/* Card */}
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* Header: avatar + name + level */}
        <div className="rounded-2xl p-6 flex flex-col items-center text-center"
          style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}>

          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-black text-3xl"
              style={{ background: '#2D2D3F', border: `3px solid #E8654A` }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                : <span style={{ color: '#9CA3AF' }}>{profile.name?.[0]?.toUpperCase()}</span>
              }
            </div>
          </div>

          {/* Name + username */}
          <h1 className="text-2xl font-black mb-0.5" style={{ color: '#F1F5F9' }}>{profile.name}</h1>
          <p className="text-sm mb-3" style={{ color: '#6B7280' }}>@{profile.username}</p>

          {/* Level badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ background: '#E8654A22', color: '#E8654A', border: '1px solid #E8654A44' }}
          >
            <span className="text-sm">{level.emoji}</span>
            <span className="tracking-widest uppercase">{level.name}</span>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{profile.bio}</p>
          )}

          {/* Social links */}
          {(profile.twitter || profile.instagram || profile.website) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: '#1DA1F222', color: '#1DA1F2', border: '1px solid #1DA1F244' }}
                >
                  𝕏 @{profile.twitter.replace('@', '')}
                </a>
              )}
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: '#E114741A', color: '#E11474', border: '1px solid #E1147433' }}
                >
                  IG @{profile.instagram.replace('@', '')}
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: '#2D2D3F', color: '#9CA3AF', border: '1px solid #3D3D4F' }}
                >
                  🔗 {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Pomos', value: total_pomos.toLocaleString(), emoji: '🍅', color: '#E8654A' },
            { label: 'Focus Hours', value: `${total_focus_hours}h`, emoji: '⏱', color: '#3B82F6' },
            { label: 'Current Streak', value: `${profile.streak}d`, emoji: '🔥', color: '#F59E0B' },
            { label: 'Tasks Done', value: tasks_done.toLocaleString(), emoji: '✅', color: '#10B981' },
          ].map(({ label, value, emoji, color }) => (
            <div key={label}
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4B5563' }}>{label}</span>
                <span className="text-base">{emoji}</span>
              </div>
              <span className="text-2xl font-black" style={{ color }}>{value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Weekly activity chart */}
        <div className="rounded-2xl p-5" style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
            This Week
          </p>
          <div className="flex items-end justify-between gap-1.5 h-20">
            {(weekly_data ?? []).map((d, i) => {
              const pct = d.count === 0 ? 0 : Math.max(8, Math.round((d.count / maxCount) * 100))
              const dayLabel = DAY_ABBR[new Date(d.day + 'T12:00:00').getDay()]
              const isToday = new Date(d.day + 'T12:00:00').toDateString() === new Date().toDateString()
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${pct}%`,
                        minHeight: d.count > 0 ? 8 : 3,
                        background: isToday ? '#E8654A' : d.count > 0 ? '#F0B8AC' : '#2D2D3F',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: isToday ? '#E8654A' : '#4B5563' }}>
                    {dayLabel}
                  </span>
                  {d.count > 0 && (
                    <span className="text-xs font-bold" style={{ color: isToday ? '#E8654A' : '#6B7280' }}>
                      {d.count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Share + CTA */}
        <div className="flex flex-col items-center gap-3">
          <ShareButton url={profileUrl} name={profile.name} />
          <p className="text-xs" style={{ color: '#4B5563' }}>
            Member since {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* LockIn CTA */}
        <a
          href="/login"
          className="rounded-2xl p-5 text-center block transition-opacity hover:opacity-90"
          style={{ background: '#E8654A', textDecoration: 'none' }}
        >
          <p className="text-sm font-black text-white tracking-tight">🔒 Start focusing on LockIn</p>
          <p className="text-xs mt-0.5" style={{ color: '#FECABA' }}>lockinhq.co</p>
        </a>

      </div>
    </div>
  )
}
