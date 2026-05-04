'use client'

import { useApp } from '@/contexts/AppContext'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekData(sessions: { completed_at: string; mode: string }[]) {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun
  // Get Monday of this week
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

export default function ReportsView() {
  const { sessions } = useApp()
  const pomSessions = sessions.filter(s => s.mode === 'pomodoro')

  const today = new Date().toDateString()
  const todayCount = pomSessions.filter(s => new Date(s.completed_at).toDateString() === today).length

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekCount = pomSessions.filter(s => new Date(s.completed_at) >= weekStart).length

  const totalHours = (pomSessions.reduce((acc, s) => acc + (s.duration ?? 1500), 0) / 3600).toFixed(1)
  const allTime = pomSessions.length

  const weekData = getWeekData(sessions)
  const maxCount = Math.max(...weekData.map(d => d.count), 1)

  return (
    <div className="scroll-area px-4 pt-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Last 30 days</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="All Time" value={allTime} emoji="🔒" color="var(--primary)" />
        <StatCard label="Today" value={todayCount} emoji="⏰" color="#8B5CF6" />
        <StatCard label="This Week" value={weekCount} emoji="📅" color="#10B981" />
        <StatCard label="Focus Hours" value={`${totalHours}h`} emoji="🎯" color="#3B82F6" />
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
    </div>
  )
}
