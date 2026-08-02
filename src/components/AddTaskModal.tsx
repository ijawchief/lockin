'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import type { Task, Profile } from '@/lib/types'

interface Props {
  onClose: () => void
  task?: Task
  defaultProjectId?: string | null
  defaultAssignee?: Profile | null
}

export default function AddTaskModal({ onClose, task, defaultProjectId, defaultAssignee }: Props) {
  const { addTask, updateTask, projects, user, profile } = useApp()
  const isEditing = !!task
  const isTeam = profile?.account_type === 'team'

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [estimatedPomos, setEstimatedPomos] = useState(task?.estimated_pomos ?? 1)
  const [projectId, setProjectId] = useState<string | null>(task?.project_id ?? defaultProjectId ?? null)
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [recurrence, setRecurrence] = useState<string | null>(task?.recurrence ?? null)
  const [assignee, setAssignee] = useState<Profile | null>(task?.assignee_profile ?? defaultAssignee ?? null)
  const [assignSearch, setAssignSearch] = useState('')
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isTeam || !user) return
    async function loadTeamMembers() {
      const { data: members } = await supabase
        .from('team_members')
        .select('member_id')
        .eq('owner_id', user!.id)
      if (!members || members.length === 0) return
      const ids = members.map(m => m.member_id)
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
      setTeamMembers(profiles ?? [])
    }
    loadTeamMembers()
  }, [isTeam, user?.id])

  const filteredMembers = assignSearch.trim().length >= 2
    ? teamMembers.filter(m =>
        m.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
        m.username?.toLowerCase().includes(assignSearch.toLowerCase())
      )
    : teamMembers

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    if (isEditing) {
      await updateTask(task.id, {
        title: title.trim(),
        notes,
        estimated_pomos: estimatedPomos,
        project_id: projectId,
        due_date: dueDate || null,
        recurrence: (recurrence as Task['recurrence']) ?? null,
        ...(assignee ? {
          assigned_to: assignee.id,
          assigned_by: user?.id,
          assignment_status: 'pending' as const,
        } : {}),
      })
    } else {
      await addTask({
        title: title.trim(),
        notes,
        estimated_pomos: estimatedPomos,
        project_id: projectId,
        due_date: dueDate || null,
        recurrence: (recurrence as Task['recurrence']) ?? null,
        ...(assignee ? {
          assigned_to: assignee.id,
          assigned_by: user?.id,
          assignment_status: 'pending' as const,
        } : {}),
      })
    }
    setSaving(false)
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="input resize-none"
            placeholder="Notes (optional)"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Due date + Pomos row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Due Date</span>
              <input
                type="date"
                className="input text-sm"
                value={dueDate}
                min={today}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Pomos</span>
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
                  onClick={() => setEstimatedPomos(p => Math.max(1, p - 1))}
                >
                  <ChevronDown size={16} />
                </button>
                <span className="w-6 text-center font-semibold">{estimatedPomos}</span>
                <button
                  className="btn-ghost w-8 h-8 flex items-center justify-center p-0"
                  onClick={() => setEstimatedPomos(p => Math.min(20, p + 1))}
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Repeat</span>
            <div className="flex flex-wrap gap-1.5">
              {([null, 'daily', 'weekdays', 'weekly', 'monthly'] as const).map(opt => (
                <button
                  key={String(opt)}
                  onClick={() => setRecurrence(opt)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: recurrence === opt ? 'var(--primary)' : 'transparent',
                    color: recurrence === opt ? 'white' : 'var(--muted)',
                    borderColor: recurrence === opt ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {opt === null ? 'None' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map(day => (
                <button
                  key={day}
                  onClick={() => setRecurrence(recurrence === day ? null : day)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: recurrence === day ? 'var(--primary)' : 'transparent',
                    color: recurrence === day ? 'white' : 'var(--muted)',
                    borderColor: recurrence === day ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Project</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProjectId(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: projectId === null ? 'var(--text)' : 'transparent',
                    color: projectId === null ? 'white' : 'var(--muted)',
                    borderColor: projectId === null ? 'var(--text)' : 'var(--border)',
                  }}
                >
                  None
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProjectId(p.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5"
                    style={{
                      background: projectId === p.id ? p.color : 'transparent',
                      color: projectId === p.id ? 'white' : 'var(--text)',
                      borderColor: projectId === p.id ? p.color : 'var(--border)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: projectId === p.id ? 'white' : p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assign to — team accounts only */}
          {isTeam && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                <UserPlus size={14} /> Assign to
              </span>

              {assignee ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--primary)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                      {assignee.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{assignee.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>@{assignee.username}</span>
                  </div>
                  <button onClick={() => setAssignee(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-xs px-1" style={{ color: 'var(--muted)' }}>
                  No team members yet — add people from the Team Wall.
                </p>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                  <input
                    className="input pl-8"
                    placeholder="Search team members..."
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                  />
                  {filteredMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
                      style={{ background: 'white', borderColor: 'var(--border)' }}>
                      {filteredMembers.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setAssignee(p); setAssignSearch('') }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {p.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>@{p.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className="btn-primary py-3 mt-1"
            onClick={handleSave}
            disabled={!title.trim() || saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
