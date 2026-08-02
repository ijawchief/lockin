'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Pencil } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { PROJECT_COLORS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import AddTaskModal from './AddTaskModal'
import TeamWall from './TeamWall'
import type { Project, Task } from '@/lib/types'

function ProjectFormModal({
  project,
  onClose,
}: {
  project?: Project
  onClose: () => void
}) {
  const { addProject } = useApp()
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    if (project) {
      await supabase.from('projects').update({ name: name.trim(), color }).eq('id', project.id)
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

export default function ProjectsView() {
  const { projects, tasks, deleteProject, user, profile } = useApp()
  const isTeam = profile?.account_type === 'team'

  const [view, setView] = useState<'wall' | 'projects'>(isTeam ? 'wall' : 'projects')
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="scroll-area pt-4">
      {/* Header with optional Wall/Projects toggle */}
      <div className="flex items-center justify-between mb-4 px-4">
        {isTeam ? (
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            <button
              onClick={() => setView('wall')}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: view === 'wall' ? 'var(--primary)' : 'transparent',
                color: view === 'wall' ? 'white' : 'var(--muted)',
              }}
            >
              Team Wall
            </button>
            <button
              onClick={() => setView('projects')}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: view === 'projects' ? 'var(--primary)' : 'transparent',
                color: view === 'projects' ? 'white' : 'var(--muted)',
              }}
            >
              Projects
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">Projects</h1>
        )}
        {view === 'projects' && (
          <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
            <Plus size={16} /> New
          </button>
        )}
      </div>

      {/* Team Wall */}
      {isTeam && view === 'wall' && <TeamWall />}

      {/* Projects list */}
      {view === 'projects' && (
        <div className="px-4">
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
                        {project.user_id === user?.id && (
                          <>
                            <button
                              onClick={() => setEditProject(project)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg"
                              style={{ color: 'var(--muted)' }}
                              title="Edit project"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(project.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg"
                              style={{ color: '#EF4444' }}
                              title="Delete project"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
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

                    {projectTasks.length > 0 && (() => {
                      const isExpanded = expandedProjects.has(project.id)
                      const visible = isExpanded ? projectTasks : projectTasks.slice(0, 5)
                      const hidden = projectTasks.length - 5
                      return (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {visible.map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-sm group">
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: t.done ? project.color : 'var(--border)', background: t.done ? project.color : 'transparent' }}>
                                {t.done && <span style={{ color: 'white', fontSize: 8 }}>✓</span>}
                              </div>
                              <span className="flex-1 truncate" style={{ color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>
                                {t.title}
                              </span>
                              <button
                                onClick={() => setEditTask(t)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
                                style={{ color: 'var(--muted)', opacity: 0.5 }}
                              >
                                <Pencil size={11} />
                              </button>
                            </div>
                          ))}
                          {!isExpanded && hidden > 0 && (
                            <button
                              onClick={() => toggleExpand(project.id)}
                              className="text-xs font-medium mt-0.5 text-left px-0 py-1 flex items-center gap-1"
                              style={{ color: project.color }}
                            >
                              <span>+{hidden} more</span>
                              <span style={{ fontSize: 10 }}>▼</span>
                            </button>
                          )}
                          {isExpanded && (
                            <button
                              onClick={() => toggleExpand(project.id)}
                              className="text-xs font-medium mt-0.5 text-left py-1 flex items-center gap-1"
                              style={{ color: 'var(--muted)' }}
                            >
                              <span>Show less</span>
                              <span style={{ fontSize: 10 }}>▲</span>
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showAdd && <ProjectFormModal onClose={() => setShowAdd(false)} />}
      {editProject && <ProjectFormModal project={editProject} onClose={() => setEditProject(null)} />}
      {editTask && <AddTaskModal task={editTask} onClose={() => setEditTask(null)} />}

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
