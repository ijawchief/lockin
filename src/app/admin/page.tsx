'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Users, Zap, CheckSquare, Clock, TrendingUp, LogOut, Shield } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminStats {
  total_users: number
  new_users_7d: number
  new_users_30d: number
  active_7d: number
  active_30d: number
  total_pomos: number
  pomos_7d: number
  total_tasks: number
  tasks_done: number
  tasks_done_7d: number
  total_focus_hours: number
}

interface TopUser {
  user_id: string
  name: string
  avatar_url: string | null
  username: string
  total_pomos: number
  pomos_7d: number
  tasks_done: number
  joined_at: string
}

interface DailyStat {
  day: string
  new_users: number
  pomos: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, prefix = '', suffix = '',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  prefix?: string
  suffix?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        {sub && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{sub}</p>}
      </div>
    </div>
  )
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: '#2D2D3F', fontSize: size * 0.4 }}
    >
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#9CA3AF' }}>{name?.[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0F0F14' }}>
      <div className="flex flex-col items-center gap-4">
        <Shield size={32} color="#E8654A" />
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#E8654A' }} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState<'loading' | 'unauthorized' | 'ready'>('loading')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'users' | 'growth'>('overview')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      setAuthState('unauthorized')
      return
    }

    setAuthState('ready')
    loadData()
  }

  async function loadData() {
    setDataLoading(true)
    const [statsRes, usersRes, dailyRes] = await Promise.all([
      supabase.rpc('get_admin_stats'),
      supabase.rpc('get_admin_top_users'),
      supabase.rpc('get_admin_daily_stats'),
    ])
    if (statsRes.data) setStats(statsRes.data)
    if (usersRes.data) setTopUsers(usersRes.data)
    if (dailyRes.data) {
      setDailyStats(dailyRes.data.map((d: DailyStat) => ({
        ...d,
        day: new Date(d.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })))
    }
    setDataLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authState === 'loading') return <Spinner />

  if (authState === 'unauthorized') {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0F0F14' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#F1F5F9' }}>Access Denied</h1>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>You don't have admin access to LockIn.</p>
          <button
            onClick={() => router.push('/app')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#E8654A', color: 'white' }}
          >
            Go to App
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: '#0F0F14', color: '#F1F5F9' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: '#0F0F14', borderBottom: '1px solid #2D2D3F' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E8654A22' }}>
            <Shield size={18} color="#E8654A" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight" style={{ color: '#F1F5F9' }}>LockIn Admin</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Super admin dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#1A1A2E', color: '#9CA3AF', border: '1px solid #2D2D3F' }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: '#2D2D3F', color: '#9CA3AF' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#E8654A' }} />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: '#1A1A2E' }}>
              {(['overview', 'users', 'growth'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                  style={{
                    background: tab === t ? '#E8654A' : 'transparent',
                    color: tab === t ? 'white' : '#6B7280',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {tab === 'overview' && stats && (
              <>
                {/* Primary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="Total Users"
                    value={stats.total_users}
                    sub={`+${stats.new_users_7d} this week · +${stats.new_users_30d} this month`}
                    icon={Users}
                    color="#E8654A"
                  />
                  <StatCard
                    label="Active (7 days)"
                    value={stats.active_7d}
                    sub={`${stats.total_users > 0 ? Math.round((stats.active_7d / stats.total_users) * 100) : 0}% of total users`}
                    icon={TrendingUp}
                    color="#10B981"
                  />
                  <StatCard
                    label="Total Pomos"
                    value={stats.total_pomos}
                    sub={`${stats.pomos_7d.toLocaleString()} this week`}
                    icon={Zap}
                    color="#F59E0B"
                  />
                  <StatCard
                    label="Focus Hours"
                    value={stats.total_focus_hours}
                    suffix="h"
                    sub="All-time logged focus"
                    icon={Clock}
                    color="#3B82F6"
                  />
                </div>

                {/* Secondary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    label="Active (30 days)"
                    value={stats.active_30d}
                    sub={`${stats.total_users > 0 ? Math.round((stats.active_30d / stats.total_users) * 100) : 0}% retention`}
                    icon={Users}
                    color="#8B5CF6"
                  />
                  <StatCard
                    label="New Users (7d)"
                    value={stats.new_users_7d}
                    sub={`${stats.new_users_30d} in last 30 days`}
                    icon={TrendingUp}
                    color="#EC4899"
                  />
                  <StatCard
                    label="Tasks Done"
                    value={stats.tasks_done}
                    sub={`${stats.tasks_done_7d} completed this week`}
                    icon={CheckSquare}
                    color="#06B6D4"
                  />
                  <StatCard
                    label="Total Tasks"
                    value={stats.total_tasks}
                    sub={`${stats.total_tasks > 0 ? Math.round((stats.tasks_done / stats.total_tasks) * 100) : 0}% completion rate`}
                    icon={CheckSquare}
                    color="#84CC16"
                  />
                </div>

                {/* Mini growth chart */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#6B7280' }}>
                    Daily Activity — Last 30 Days
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#252538',
                          border: '1px solid #2D2D3F',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#F1F5F9',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="pomos" stroke="#E8654A" strokeWidth={2} dot={false} name="Pomos" />
                      <Line type="monotone" dataKey="new_users" stroke="#10B981" strokeWidth={2} dot={false} name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Users Tab ── */}
            {tab === 'users' && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
              >
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #2D2D3F' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>
                    Top Users by Total Pomos — Top {topUsers.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #2D2D3F' }}>
                        {['#', 'User', 'Total 🍅', '7d 🍅', 'Tasks Done', 'Joined'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topUsers.map((u, i) => (
                        <tr
                          key={u.user_id}
                          style={{ borderBottom: '1px solid #1A1A2E' }}
                          className="transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4">
                            <span
                              className="text-sm font-bold"
                              style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : '#4B5563' }}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} url={u.avatar_url} size={32} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{u.name || '—'}</p>
                                <p className="text-xs" style={{ color: '#6B7280' }}>@{u.username || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold" style={{ color: '#E8654A' }}>
                              {u.total_pomos > 0 ? u.total_pomos.toLocaleString() : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold" style={{ color: u.pomos_7d > 0 ? '#10B981' : '#4B5563' }}>
                              {u.pomos_7d > 0 ? `+${u.pomos_7d}` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm" style={{ color: '#9CA3AF' }}>
                              {u.tasks_done > 0 ? u.tasks_done.toLocaleString() : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs" style={{ color: '#6B7280' }}>
                              {new Date(u.joined_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Growth Tab ── */}
            {tab === 'growth' && (
              <div className="flex flex-col gap-6">
                {/* Daily pomos chart */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#6B7280' }}>
                    Daily Pomos — Last 30 Days
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyStats} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#252538',
                          border: '1px solid #2D2D3F',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#F1F5F9',
                        }}
                      />
                      <Bar dataKey="pomos" fill="#E8654A" radius={[3, 3, 0, 0]} name="Pomos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Daily new users chart */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#6B7280' }}>
                    New Signups — Last 30 Days
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyStats} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#252538',
                          border: '1px solid #2D2D3F',
                          borderRadius: 10,
                          fontSize: 12,
                          color: '#F1F5F9',
                        }}
                      />
                      <Bar dataKey="new_users" fill="#10B981" radius={[3, 3, 0, 0]} name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Retention summary */}
                {stats && (
                  <div
                    className="rounded-2xl p-6"
                    style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#6B7280' }}>
                      Retention Snapshot
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: '7-day active',
                          pct: stats.total_users > 0 ? Math.round((stats.active_7d / stats.total_users) * 100) : 0,
                          color: '#10B981',
                        },
                        {
                          label: '30-day active',
                          pct: stats.total_users > 0 ? Math.round((stats.active_30d / stats.total_users) * 100) : 0,
                          color: '#E8654A',
                        },
                        {
                          label: 'Task completion',
                          pct: stats.total_tasks > 0 ? Math.round((stats.tasks_done / stats.total_tasks) * 100) : 0,
                          color: '#3B82F6',
                        },
                      ].map(({ label, pct, color }) => (
                        <div key={label} className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</span>
                            <span className="text-sm font-black" style={{ color }}>{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2D2D3F' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
