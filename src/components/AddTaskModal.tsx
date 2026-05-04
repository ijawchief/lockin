'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import type { Task, Profile } from '@/lib/types'

interface Props {
  onClose: () => void
  task?: Task  // if provided, we're editing
}

export default function AddTaskModal({ onClose, task }: Props) {
  const { addTask, updateTask, projects, user } = useApp()
  const isEditing = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [estimatedPomos, setEstimatedPomos] = useState(task?.estimated_pomos ?? 1)
  const [projectId, setProjectId] = useState<string | null>(task?.project_id ?? null)
  const [assignee, setAssignee] = useState<Profile | null>(null)
  const [assignSearch, setAssignSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  async function searchUsers(query: string) {
    setAssignSearch(query)
    if (query.trim().length < 3) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(5)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    if (isEditing) {
      await updateTask(task.id, {
        title: title.trim(),
        notes,
        estimated_pomos: estimatedPomos,
        project_id: projectId,
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

          {/* Estimated pomos */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Estimated Pomos</span>
            <div className="flex items-center gap-2">
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

          {/* Assign to user */}
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
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                  <input
                    className="input pl-8"
                    placeholder="Search by name or username..."
                    value={assignSearch}
                    onChange={e => searchUsers(e.target.value)}
                  />
                </div>
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
                    style={{ background: 'white', borderColor: 'var(--border)' }}>
                    {searching ? (
                      <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>Searching...</p>
                    ) : searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setAssignee(p); setAssignSearch(''); setSearchResults([]) }}
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
