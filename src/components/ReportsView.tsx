'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekData(sessions: { completed_at: string; mode: string }[]) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  return DAY_LABELS.map((label, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const count = sessions.filter(s =>
      s.mode === 'pomodoro' &&
      new Date(s.completed_at) >= day &&
      new Date(s.completed_at) < next
    ).length
    return { label, count, isToday: day.toDateString() === now.toDateString() }
  })
}

function StatCard({ label, value, emoji, color }: { label: string; value: string | number; emoji: string; color: string }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="text-lg">{emoji}</span>
      </div>
      <span className="text-3xl font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

interface TeamMember {
  user_id: string
  name: string
  avatar_url: string | null
  pomo_count: number
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: '#E5E7EB', fontSize: size * 0.4 }}
    >
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#6B7280' }}>{name?.[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

function TeamTab() {
  const { presence, user, profile, sessions } = useApp()
  const [teamData, setTeamData] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const myWeekPomos = sessions.filter(s =>
    s.mode === 'pomodoro' && new Date(s.completed_at) >= weekStart
  ).length

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_team_week_stats')
    if (!error && data) setTeamData(data)
    setLoading(false)
  }

  // Online teammates from presence (exclude self)
  const onlineTeam = Object.values(presence).filter(p => p.user_id !== user?.id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Online now */}
      {onlineTeam.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Online Now</p>
          <div className="flex flex-col gap-3">
            {onlineTeam.map(p => (
              <div key={p.user_id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={p.name} url={p.avatar_url} size={36} />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: p.is_running ? '#22C55E' : '#9CA3AF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {p.is_running
                      ? `🍅 ${p.mode === 'pomodoro' ? 'Focusing' : p.mode === 'short_break' ? 'Short break' : 'Long break'}`
                      : 'Idle'}
                  </p>
                </div>
                {p.is_running && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly leaderboard */}
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>This Week — Focus Pomos</p>
        {teamData.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No teammates yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Add members to your projects to see team stats</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Include self */}
            {[
              { user_id: user?.id ?? '', name: profile?.name ?? 'You', avatar_url: profile?.avatar_url ?? null, pomo_count: myWeekPomos, isSelf: true },
              ...teamData.map(m => ({ ...m, isSelf: false })),
            ]
              .sort((a, b) => b.pomo_count - a.pomo_count)
              .map((member, i) => {
                const maxCount = Math.max(...teamData.map(m => m.pomo_count), myWeekPomos, 1)
                const pct = member.pomo_count <= 0 ? 0 : Math.round((member.pomo_count / maxCount) * 100)
                return (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4 text-center" style={{ color: 'var(--muted)' }}>
                      {i + 1}
                    </span>
                    <Avatar name={member.name} url={member.avatar_url} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {member.name}{member.isSelf ? ' (you)' : ''}
                        </p>
                        <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: 'var(--primary)' }}>
                          {member.pomo_count <= 0 ? '—' : `${member.pomo_count} 🍅`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: member.isSelf ? 'var(--primary)' : '#F0B8AC' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {onlineTeam.length === 0 && teamData.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
          Add teammates to projects to see team activity here
        </p>
      )}
    </div>
  )
}

export default function ReportsView() {
  const { sessions, tasks } = useApp()
  const [tab, setTab] = useState<'me' | 'team'>('me')
  const pomSessions = sessions.filter(s => s.mode === 'pomodoro')

  const today = new Date().toDateString()
  const todayPomos = pomSessions.filter(s => new Date(s.completed_at).toDateString() === today).length
  const todayTasks = tasks.filter(t => t.done && t.completed_at && new Date(t.completed_at).toDateString() === today).length

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekCount = pomSessions.filter(s => new Date(s.completed_at) >= weekStart).length

  const totalHours = (pomSessions.reduce((acc, s) => acc + (s.duration ?? 1500), 0) / 3600).toFixed(1)
  const allTime = pomSessions.length

  // Personal best tasks in a day
  const tasksByDay: Record<string, number> = {}
  tasks.filter(t => t.done && t.completed_at).forEach(t => {
    const d = new Date(t.completed_at!).toDateString()
    tasksByDay[d] = (tasksByDay[d] ?? 0) + 1
  })
  const bestTaskDay = Math.max(...Object.values(tasksByDay), 0)
  const isTaskPB = todayTasks > 0 && todayTasks >= bestTaskDay

  const weekData = getWeekData(sessions)

  return (
    <div className="scroll-area px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--border)' }}>
        {(['me', 'team'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t === 'me' ? 'My Stats' : 'Team'}
          </button>
        ))}
      </div>

      {tab === 'me' ? (
        <>
          {/* Today hero card */}
          <div className="card p-4 mb-3" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', border: 'none' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Today</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-black" style={{ color: 'white', lineHeight: 1 }}>{todayTasks}</span>
                  <span className="text-sm font-semibold mb-1" style={{ color: '#9CA3AF' }}>task{todayTasks !== 1 ? 's' : ''} done</span>
                </div>
                {isTaskPB && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,101,74,0.2)', color: 'var(--primary)' }}>
                    🏆 Personal best!
                  </span>
                )}
                {!isTaskPB && bestTaskDay > 0 && (
                  <span className="text-xs" style={{ color: '#6B7280' }}>Best: {bestTaskDay} tasks</span>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-end gap-1 justify-end mb-1">
                  <span className="text-3xl font-black" style={{ color: 'var(--primary)', lineHeight: 1 }}>{todayPomos}</span>
                  <span className="text-sm font-semibold mb-0.5" style={{ color: '#9CA3AF' }}>🍅</span>
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>pomos</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard label="All Time Pomos" value={allTime} emoji="🔒" color="var(--primary)" />
            <StatCard label="This Week" value={weekCount} emoji="📅" color="#10B981" />
            <StatCard label="Focus Hours" value={`${totalHours}h`} emoji="🎯" color="#3B82F6" />
            <StatCard label="Tasks Done" value={tasks.filter(t => t.done).length} emoji="✅" color="#8B5CF6" />
          </div>

          {/* Weekly chart */}
          <div className="card p-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--muted)' }}>THIS WEEK</p>
            {weekCount === 0 ? (
              <div className="h-32 flex items-end justify-around">
                {DAY_LABELS.map(l => (
                  <div key={l} className="flex flex-col items-center gap-2">
                    <div className="w-8 h-1 rounded" style={{ background: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekData} barSize={24}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} pomo${v !== 1 ? 's' : ''}`, '']}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
                    cursor={{ fill: '#F0F2F5' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {weekData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isToday ? 'var(--primary)' : entry.count > 0 ? '#F0B8AC' : 'var(--border)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Best day */}
          {allTime > 0 && (() => {
            const byDay: Record<string, number> = {}
            pomSessions.forEach(s => {
              const d = new Date(s.completed_at).toDateString()
              byDay[d] = (byDay[d] ?? 0) + 1
            })
            const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
            if (!bestDay) return null
            return (
              <div className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Best Day</p>
                  <p className="font-bold mt-0.5">{new Date(bestDay[0]).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{bestDay[1]} 🍅</span>
              </div>
            )
          })()}
        </>
      ) : (
        <TeamTab />
      )}
    </div>
  )
}
