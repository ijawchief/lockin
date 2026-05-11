'use client'

import { useState } from 'react'
import { Plus, Trash2, Users, X, Search, UserMinus, Pencil } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { PROJECT_COLORS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { Project, Profile } from '@/lib/types'

function ProjectFormModal({
  project,
  onClose,
}: {
  project?: Project
  onClose: () => void
}) {
  const { addProject, updateTask, projects, tasks } = useApp()
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    if (project) {
      // Edit existing — update in DB and reflect in local state via supabase
      await supabase.from('projects').update({ name: name.trim(), color }).eq('id', project.id)
      // Trigger a page refresh of projects via a small trick — update tasks referencing this project
      window.location.reload()
    } else {
      await addProject(name.trim(), color)
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <input
            className="input"
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Color</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <button className="btn-primary py-3" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MembersModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const { addProjectMember, removeProjectMember, user } = useApp()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    supabase
      .from('project_members')
      .select('user_id, profiles(*)')
      .eq('project_id', project.id)
      .then(({ data }) => {
        if (data) setMembers(data.map((r: any) => r.profiles).filter(Boolean))
      })
  }

  async function searchUsers(query: string) {
    setSearch(query)
    setError('')
    // Require at least 3 chars — prevents enumerating all users
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

  async function handleAdd(profile: Profile) {
    setAdding(true)
    setError('')
    const err = await addProjectMember(project.id, profile.username)
    if (err) { setError(err); setAdding(false); return }
    setMembers(prev => [...prev.filter(m => m.id !== profile.id), profile])
    setSearch('')
    setSearchResults([])
    setAdding(false)
    setSuccess(profile.name + ' added successfully')
    setTimeout(() => setSuccess(''), 5000)
  }

  async function handleRemove(memberId: string) {
    await removeProjectMember(project.id, memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Members — {project.name}</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center p-0">
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            className="input pl-8"
            placeholder="Type 3+ characters to search..."
            value={search}
            onChange={e => searchUsers(e.target.value)}
          />
          {(searchResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
              style={{ background: 'white', borderColor: 'var(--border)' }}>
              {searching ? (
                <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-center py-3" style={{ color: 'var(--muted)' }}>No users found</p>
              ) : searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAdd(p)}
                  disabled={adding || members.some(m => m.id === p.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : p.name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>@{p.username}</p>
                    </div>
                  </div>
                  {members.some(m => m.id === p.id)
                    ? <span className="text-xs" style={{ color: 'var(--muted)' }}>Added</span>
                    : <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Add</span>
                  }
                </button>
              ))}
            </div>
          )}
        </div>
        {search.length > 0 && search.length < 3 && (
          <p className="text-xs mb-3 px-1" style={{ color: 'var(--muted)' }}>Keep typing…</p>
        )}

        {error && <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>}
        {success && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: '#DCFCE7' }}>
            <span style={{ color: '#16A34A', fontSize: 16 }}>✓</span>
            <p className="text-sm font-medium" style={{ color: '#16A34A' }}>{success}</p>
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wide mb-2 mt-3" style={{ color: 'var(--muted)' }}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
        <div className="flex flex-col gap-2">
          {members.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
              No members yet — search to add someone
            </p>
          ) : members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: '#F9FAFB' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-sm font-bold">
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    : m.name?.[0]?.toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>@{m.username}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: '#EF4444' }}
              >
                <UserMinus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProjectsView() {
  const { projects, tasks, deleteProject } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [membersProject, setMembersProject] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="scroll-area px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
          <Plus size={16} /> New
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-8 flex flex-col items-center gap-3">
          <div className="text-4xl">📁</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No projects yet</p>
          <button className="btn-primary px-5 py-2.5 text-sm" onClick={() => setShowAdd(true)}>
            Create your first project
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id)
            const doneTasks = projectTasks.filter(t => t.done)
            return (
              <div key={project.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
                    <span className="font-semibold truncate">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditProject(project)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: 'var(--muted)' }}
                      title="Edit project"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setMembersProject(project)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: 'var(--muted)' }}
                      title="Manage members"
                    >
                      <Users size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(project.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: '#EF4444' }}
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                  <span>{projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}</span>
                  {projectTasks.length > 0 && <span>{doneTasks.length} done</span>}
                </div>

                {projectTasks.length > 0 && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(doneTasks.length / projectTasks.length) * 100}%`,
                      background: project.color,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                )}

                {projectTasks.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {projectTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: t.done ? project.color : 'var(--border)', background: t.done ? project.color : 'transparent' }}>
                          {t.done && <span style={{ color: 'white', fontSize: 8 }}>✓</span>}
                        </div>
                        <span style={{ color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                    {projectTasks.length > 3 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>+{projectTasks.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <ProjectFormModal onClose={() => setShowAdd(false)} />}
      {editProject && <ProjectFormModal project={editProject} onClose={() => setEditProject(null)} />}
      {membersProject && <MembersModal project={membersProject} onClose={() => setMembersProject(null)} />}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal slide-up">
            <h3 className="font-bold mb-2">Delete project?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Tasks in this project will become unassigned.
            </p>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 py-2.5" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: '#EF4444' }}
                onClick={() => { deleteProject(confirmDelete); setConfirmDelete(null) }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
