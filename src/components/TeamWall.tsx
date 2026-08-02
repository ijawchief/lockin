'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, X, Search } from 'lucide-react'
import { useApp, isOccurrenceRecurrence, isScheduledToday } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import type { Profile, Task } from '@/lib/types'
import AddTaskModal from './AddTaskModal'
import TaskDetailPanel from './TaskDetailPanel'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const COLORS = ['#E8654A', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
function avatarColor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(h) % COLORS.length]
}

interface TeamMember { profile: Profile; role: 'member' | 'manager' }

function ManageTeamModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const { user } = useApp()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addRole, setAddRole] = useState<'member' | 'manager'>('member')

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('team_members')
      .select('member_id, role')
      .eq('owner_id', user?.id)
    const rows = data ?? []
    const memberIds = rows.map((r: any) => r.member_id as string)
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', memberIds)
      const profileMap = Object.fromEntries((profiles ?? []).map((p: Profile) => [p.id, p]))
      setMembers(rows.map((r: any) => ({ profile: profileMap[r.member_id], role: r.role ?? 'member' })).filter((m: TeamMember) => m.profile))
    } else {
      setMembers([])
    }
    setLoading(false)
  }

  async function searchUsers(q: string) {
    setSearch(q)
    if (q.trim().length < 3) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(5)
    setResults((data ?? []).filter((p: Profile) => !members.some(m => m.profile.id === p.id)))
    setSearching(false)
  }

  async function addMember(profile: Profile) {
    await supabase.from('team_members').insert({ owner_id: user?.id, member_id: profile.id, role: addRole })
    setMembers(prev => [...prev, { profile, role: addRole }])
    setResults(prev => prev.filter(p => p.id !== profile.id))
    setSearch('')
    onChanged()
  }

  async function setRole(memberId: string, role: 'member' | 'manager') {
    await supabase.from('team_members').update({ role }).eq('owner_id', user?.id).eq('member_id', memberId)
    setMembers(prev => prev.map(m => m.profile.id === memberId ? { ...m, role } : m))
  }

  async function removeMember(memberId: string) {
    await supabase.from('team_members').delete().eq('owner_id', user?.id).eq('member_id', memberId)
    setMembers(prev => prev.filter(m => m.profile.id !== memberId))
    onChanged()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Your Team</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0">
            <X size={18} />
          </button>
        </div>

        {/* Role selector for new member */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Adding as:</span>
          {(['member', 'manager'] as const).map(r => (
            <button key={r} onClick={() => setAddRole(r)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: addRole === r ? 'var(--primary)' : 'transparent',
                color: addRole === r ? 'white' : 'var(--muted)',
                borderColor: addRole === r ? 'var(--primary)' : 'var(--border)',
              }}>
              {r === 'manager' ? 'Manager' : 'Member'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            className="input pl-8"
            placeholder="Search by name or username..."
            value={search}
            onChange={e => searchUsers(e.target.value)}
          />
          {(results.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
              style={{ background: 'white', borderColor: 'var(--border)' }}>
              {searching
                ? <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>Searching…</p>
                : results.map(p => (
                  <button key={p.id}
                    onClick={() => addMember(p)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: avatarColor(p.id) + '22', color: avatarColor(p.id) }}>
                      {initials(p.name)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>@{p.username}</p>
                    </div>
                    <span className="ml-auto text-xs font-medium" style={{ color: 'var(--primary)' }}>
                      Add as {addRole}
                    </span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* Current members */}
        {loading ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
            No team members yet — search above to add someone.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map(({ profile: m, role }) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                style={{ background: 'var(--surface)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0"
                    style={{ background: avatarColor(m.id) + '22', color: avatarColor(m.id) }}>
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials(m.name)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>@{m.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Role toggle */}
                  <button
                    onClick={() => setRole(m.id, role === 'manager' ? 'member' : 'manager')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{
                      background: role === 'manager' ? '#EEF2FF' : 'var(--border)',
                      color: role === 'manager' ? '#6366F1' : 'var(--muted)',
                    }}>
                    {role === 'manager' ? 'Manager' : 'Member'}
                  </button>
                  <button onClick={() => removeMember(m.id)}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ color: '#EF4444', background: '#FEE2E2' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeamWall() {
  const { tasks, user, profile, presence, todayCompletions, isTeamManager, managedTeamOwnerId } = useApp()
  const isOwner = profile?.account_type === 'team'
  const wallOwnerId = isOwner ? user?.id : (managedTeamOwnerId ?? user?.id)

  const [members, setMembers] = useState<Profile[]>([])
  const [showManage, setShowManage] = useState(false)
  const [assignTo, setAssignTo] = useState<Profile | null>(null)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)

  useEffect(() => { loadMembers() }, [user?.id, profile?.id, managedTeamOwnerId])

  async function loadMembers() {
    if (!user) return
    const { data } = await supabase
      .from('team_members')
      .select('member_id')
      .eq('owner_id', wallOwnerId)

    const memberIds = (data ?? []).map((r: any) => r.member_id as string)
    let teammates: Profile[] = []
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds)
      teammates = (profiles ?? []) as Profile[]
    }

    // For owners: include themselves at top. For managers: don't include self.
    const all: Profile[] = []
    if (isOwner && profile) all.push(profile)
    teammates.forEach(t => { if (!all.some(a => a.id === t.id)) all.push(t) })
    setMembers(all)
  }

  function getMemberData(member: Profile) {
    const todayStr = new Date().toISOString().split('T')[0]
    const memberTasks = tasks.filter(t => t.assigned_to === member.id)

    const doneToday = memberTasks.filter(t =>
      isOccurrenceRecurrence(t.recurrence) && todayCompletions.some(c => c.task_id === t.id)
    )

    const stillToDo = memberTasks.filter(t => {
      if (t.done) return false
      if (isOccurrenceRecurrence(t.recurrence)) {
        return !todayCompletions.some(c => c.task_id === t.id) && isScheduledToday(t)
      }
      if (t.due_date && t.due_date > todayStr) return false
      return true
    })

    const pres = Object.values(presence).find(p => p.user_id === member.id)
    const isLive = !!(pres?.is_running)
    const currentTask = pres?.task_id ? (tasks.find(t => t.id === pres.task_id) ?? null) : null
    return { doneToday, stillToDo, isLive, currentTask }
  }

  return (
    <div style={{ padding: '0 16px 24px' }}>

      {/* Manage team button — owners only */}
      {isOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => setShowManage(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'transparent' }}
          >
            <Users size={14} /> Manage team
          </button>
        </div>
      )}

      {members.length === 0 && (
        <div className="card p-8 flex flex-col items-center gap-3 text-center">
          <div style={{ fontSize: 32 }}>👥</div>
          <p className="text-sm font-medium">Your team is empty</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Add your team members to see their progress here every day.
          </p>
          {isOwner && (
            <button className="btn-primary px-5 py-2.5 text-sm" onClick={() => setShowManage(true)}>
              Add team members
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {members.map(member => {
          const { doneToday, stillToDo, isLive, currentTask } = getMemberData(member)
          const isMe = member.id === user?.id
          const color = avatarColor(member.id)
          const noTasks = doneToday.length === 0 && stillToDo.length === 0

          return (
            <div key={member.id} className="card" style={{ padding: 16 }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: noTasks ? 0 : 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: color + '18', border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color, overflow: 'hidden',
                }}>
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(member.name)
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {member.name}{isMe ? ' (you)' : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: isLive ? '#10B981' : 'var(--border)', display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 12, color: isLive ? '#10B981' : 'var(--muted)', fontWeight: isLive ? 600 : 400 }}>
                      {isLive ? `Live${currentTask ? ` — ${currentTask.title}` : ''}` : 'Offline'}
                    </span>
                  </div>
                </div>
                {!isMe && (
                  <button
                    onClick={() => setAssignTo(member)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                      padding: '5px 10px', borderRadius: 8, flexShrink: 0,
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--muted)', cursor: 'pointer',
                    }}
                  >
                    <UserPlus size={12} /> Assign
                  </button>
                )}
              </div>

              {/* Live pomo progress */}
              {isLive && currentTask && (
                <div style={{
                  background: '#F0FDF4', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid #D1FAE5', marginBottom: 12,
                }}>
                  <p style={{ margin: '0 0 5px', fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Working on
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {currentTask.title}
                  </p>
                  {currentTask.estimated_pomos > 0 && (
                    <>
                      <div style={{ background: '#D1FAE5', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                        <div style={{
                          background: '#10B981', height: '100%', borderRadius: 99, transition: 'width 0.3s',
                          width: `${Math.min(100, Math.round((currentTask.completed_pomos / currentTask.estimated_pomos) * 100))}%`,
                        }} />
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#059669' }}>
                        {currentTask.completed_pomos}/{currentTask.estimated_pomos} pomos
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Done today */}
              {doneToday.length > 0 && (
                <div style={{ marginBottom: stillToDo.length > 0 ? 10 : 0 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Done today ({doneToday.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {doneToday.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => setDetailTaskId(t.id)}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Still to do */}
              {stillToDo.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Still to do ({stillToDo.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {stillToDo.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => setDetailTaskId(t.id)}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          border: '2px solid var(--border)', background: 'transparent',
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </span>
                        {t.project && (
                          <span style={{
                            fontSize: 11, padding: '1px 6px', borderRadius: 99, flexShrink: 0,
                            background: t.project.color + '22', color: t.project.color,
                          }}>
                            {t.project.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No tasks */}
              {noTasks && (
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
                  Nothing assigned today.{' '}
                  {!isMe && (
                    <button
                      onClick={() => setAssignTo(member)}
                      style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}
                    >
                      Assign something →
                    </button>
                  )}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {showManage && (
        <ManageTeamModal onClose={() => setShowManage(false)} onChanged={loadMembers} />
      )}
      {assignTo && <AddTaskModal defaultAssignee={assignTo} onClose={() => setAssignTo(null)} />}
      {detailTaskId && <TaskDetailPanel taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
    </div>
  )
}
