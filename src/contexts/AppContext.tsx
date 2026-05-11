'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Task, Project, Session, UserSettings, TimerMode } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/types'
import type { User, RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  user_id: string
  name: string
  avatar_url: string | null
  task_id: string | null
  mode: TimerMode
  is_running: boolean
}

export interface AppNotification {
  id: string
  message: string
}

interface AppState {
  user: User | null
  profile: Profile | null
  tasks: Task[]
  projects: Project[]
  sessions: Session[]
  settings: UserSettings
  presence: Record<string, PresenceUser>
  notifications: AppNotification[]
  // timer
  mode: TimerMode
  timeLeft: number
  isRunning: boolean
  pomosToday: number
  cycleCount: number
  pinnedTaskId: string | null
  // ui
  activeTab: 'timer' | 'projects' | 'reports' | 'settings' | 'inbox'
  // methods
  setMode: (m: TimerMode) => void
  startStop: () => void
  reset: () => void
  skip: () => void
  setActiveTab: (t: AppState['activeTab']) => void
  addTask: (t: Partial<Task>) => Promise<void>
  updateTask: (id: string, t: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  pinTask: (id: string | null) => void
  addProject: (name: string, color: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addProjectMember: (projectId: string, query: string) => Promise<string>
  removeProjectMember: (projectId: string, userId: string) => Promise<void>
  updateSettings: (s: Partial<UserSettings>) => Promise<void>
  updateProfile: (p: Partial<Profile>) => Promise<void>
  refreshSessions: () => Promise<void>
  acceptTask: (taskId: string) => Promise<void>
  declineTask: (taskId: string) => Promise<void>
  logSession: () => Promise<void>
  dismissNotification: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

function getDurationForMode(mode: TimerMode, settings: UserSettings): number {
  if (mode === 'pomodoro') return settings.pomo_duration * 60
  if (mode === 'short_break') return settings.short_break * 60
  return settings.long_break * 60
}

function playNotificationRing() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.14)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.14)
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.14 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.14 + 0.5)
      osc.start(ctx.currentTime + i * 0.14)
      osc.stop(ctx.currentTime + i * 0.14 + 0.5)
    })
  } catch {}
}

function playAlarm() {
  try {
    const ctx = new AudioContext()
    // Three loud beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.4)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.4)
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + i * 0.4 + 0.01)
      gain.gain.setValueAtTime(0.8, ctx.currentTime + i * 0.4 + 0.25)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.35)
      osc.start(ctx.currentTime + i * 0.4)
      osc.stop(ctx.currentTime + i * 0.4 + 0.35)
    }
  } catch {}
}

export function AppProvider({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [presence, setPresence] = useState<Record<string, PresenceUser>>({})
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [mode, setModeState] = useState<TimerMode>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [pomosToday, setPomosToday] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AppState['activeTab']>('timer')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const notifChannelRef = useRef<RealtimeChannel | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const profileRef = useRef(profile)
  profileRef.current = profile
  const pinnedRef = useRef(pinnedTaskId)
  pinnedRef.current = pinnedTaskId
  const modeRef = useRef(mode)
  modeRef.current = mode
  const isRunningRef = useRef(isRunning)
  isRunningRef.current = isRunning

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data when user changes
  useEffect(() => {
    if (!user) return
    loadProfile()
    loadTasks()
    loadProjects()
    loadSettings()
    refreshSessions()
    setupPresence()

    // Request browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to task assignments + project membership in real-time
    notifChannelRef.current?.unsubscribe()
    const notifCh = supabase
      .channel(`task-notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_members',
        filter: `user_id=eq.${user.id}`,
      }, async payload => {
        const pm = payload.new as { project_id?: string }
        let projectName = 'a project'
        if (pm.project_id) {
          const { data } = await supabase.from('projects').select('name').eq('id', pm.project_id).single()
          if (data?.name) projectName = `"${data.name}"`
        }
        const msg = `You've been added to ${projectName}`
        const id = crypto.randomUUID()
        setNotifications(prev => [...prev, { id, message: msg }])
        playNotificationRing()
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('LockIn', { body: msg, icon: '/favicon.svg' })
        }
        loadProjects()
        loadTasks()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `assigned_to=eq.${user.id}`,
      }, payload => {
        const task = payload.new as { title?: string }
        const msg = `New task assigned to you: "${task.title ?? 'Untitled'}"`
        const id = crypto.randomUUID()
        setNotifications(prev => [...prev, { id, message: msg }])
        playNotificationRing()
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('LockIn', { body: msg, icon: '/favicon.svg' })
        }
        loadTasks()
      })
      .subscribe()
    notifChannelRef.current = notifCh

    return () => {
      channelRef.current?.unsubscribe()
      notifChannelRef.current?.unsubscribe()
    }
  }, [user?.id])

  // Broadcast presence when timer state changes
  useEffect(() => {
    broadcastPresence()
  }, [pinnedTaskId, mode, isRunning])

  function broadcastPresence() {
    const p = profileRef.current
    if (!user || !p || !channelRef.current) return
    channelRef.current.track({
      user_id: user.id,
      name: p.name,
      avatar_url: p.avatar_url ?? null,
      task_id: pinnedRef.current,
      mode: modeRef.current,
      is_running: isRunningRef.current,
    })
  }

  function setupPresence() {
    if (!user) return
    channelRef.current?.unsubscribe()
    const channel = supabase.channel('lockin-presence', {
      config: { presence: { key: user.id } },
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        const flat: Record<string, PresenceUser> = {}
        Object.entries(state).forEach(([key, arr]) => {
          if (arr[0]) flat[key] = arr[0] as PresenceUser
        })
        setPresence(flat)
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') broadcastPresence()
      })
    channelRef.current = channel
  }

  async function loadProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      profileRef.current = data
      broadcastPresence()
    }
  }

  async function loadTasks() {
    if (!user) return
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(*), assignee_profile:profiles!tasks_assigned_to_fkey(*)')
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function loadProjects() {
    if (!user) return
    const { data: owned } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
    const memberIds = (memberships ?? []).map(m => m.project_id)
    let memberProjects: typeof owned = []
    if (memberIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', memberIds)
        .order('created_at')
      memberProjects = data ?? []
    }
    const all = [...(owned ?? []), ...memberProjects]
    const seen = new Set<string>()
    setProjects(all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true }))
  }

  async function loadSettings() {
    if (!user) return
    const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).single()
    if (data) {
      setSettings(data)
      settingsRef.current = data
      setTimeLeft(data.pomo_duration * 60)
    }
  }

  const refreshSessions = useCallback(async () => {
    if (!user) return
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
    if (data) {
      setSessions(data)
      const today = new Date().toDateString()
      setPomosToday(data.filter(s => new Date(s.completed_at).toDateString() === today && s.mode === 'pomodoro').length)
    }
  }, [user?.id])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            if (settingsRef.current.sound_enabled) playAlarm()
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  function handleTimerComplete() {
    const s = settingsRef.current
    setModeState(prev => {
      let next: TimerMode
      let nextCycle = cycleCount
      if (prev === 'pomodoro') {
        logSession()
        nextCycle = cycleCount + 1
        setCycleCount(nextCycle)
        next = nextCycle % s.long_break_interval === 0 ? 'long_break' : 'short_break'
      } else {
        next = 'pomodoro'
      }
      const duration = getDurationForMode(next, s)
      setTimeLeft(duration)
      if (s.auto_start_break && next !== 'pomodoro') setIsRunning(true)
      else if (s.auto_start_pomo && next === 'pomodoro') setIsRunning(true)
      else setIsRunning(false)
      return next
    })
  }

  const logSession = useCallback(async () => {
    if (!user) return
    const s = settingsRef.current
    await supabase.from('sessions').insert({
      user_id: user.id,
      task_id: pinnedRef.current,
      duration: s.pomo_duration * 60,
      mode: 'pomodoro',
    })
    if (pinnedRef.current) {
      setTasks(prev => prev.map(t =>
        t.id === pinnedRef.current ? { ...t, completed_pomos: t.completed_pomos + 1 } : t
      ))
      await supabase.from('tasks')
        .update({ completed_pomos: tasks.find(t => t.id === pinnedRef.current)!.completed_pomos + 1 })
        .eq('id', pinnedRef.current)
    }
    const today = new Date().toDateString()
    const p = profileRef.current
    if (p && p.last_session_date !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const newStreak = p.last_session_date === yesterday.toDateString() ? p.streak + 1 : 1
      await supabase.from('profiles').update({ streak: newStreak, last_session_date: today }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, streak: newStreak, last_session_date: today } : prev)
    }
    refreshSessions()
  }, [user, tasks, refreshSessions])

  function setMode(m: TimerMode) {
    setIsRunning(false)
    setModeState(m)
    modeRef.current = m
    setTimeLeft(getDurationForMode(m, settings))
  }

  function startStop() { setIsRunning(r => !r) }
  function reset() { setIsRunning(false); setTimeLeft(getDurationForMode(mode, settings)) }
  function skip() { setIsRunning(false); handleTimerComplete() }

  function pinTask(id: string | null) {
    setPinnedTaskId(id)
    pinnedRef.current = id
  }

  function dismissNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function addTask(taskData: Partial<Task>) {
    if (!user) return
    const temp: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      project_id: taskData.project_id ?? null,
      title: taskData.title ?? '',
      notes: taskData.notes ?? '',
      estimated_pomos: taskData.estimated_pomos ?? 1,
      completed_pomos: 0,
      done: false,
      pinned: false,
      assigned_to: taskData.assigned_to ?? null,
      assigned_by: taskData.assigned_by ?? null,
      assignment_status: taskData.assigned_to ? 'pending' : null,
      due_date: taskData.due_date ?? null,
      created_at: new Date().toISOString(),
      project: projects.find(p => p.id === taskData.project_id) ?? null,
      assignee_profile: null,
    }
    setTasks(prev => [temp, ...prev])
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: temp.project_id,
      title: temp.title,
      notes: temp.notes,
      estimated_pomos: temp.estimated_pomos,
      assigned_to: temp.assigned_to,
      assigned_by: temp.assigned_by,
      assignment_status: temp.assignment_status,
      due_date: temp.due_date,
    }).select('*, project:projects(*), assignee_profile:profiles!tasks_assigned_to_fkey(*)').single()
    if (error) {
  console.error('[addTask]', error)
  setTasks(prev => prev.filter(t => t.id !== temp.id)) // only roll back on hard error
  return
}
console.log('[addTask] error:', error)   // ← add this
console.log('[addTask] data:', data)
if (data) {
  setTasks(prev => prev.map(t => t.id === temp.id ? data : t)) // swap temp for real record
}
  }


  async function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await supabase.from('tasks').update(updates).eq('id', id)
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
    if (pinnedTaskId === id) pinTask(null)
  }

  async function addProject(name: string, color: string) {
  if (!user) return
  // Optimistic update
  const temp = {
    id: crypto.randomUUID(),
    user_id: user.id,
    name,
    color,
    created_at: new Date().toISOString(),
  }
  setProjects(prev => [...prev, temp])

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name, color })
    .select('*')
    .single()

  if (error || !data) {
    // Roll back on failure
    setProjects(prev => prev.filter(p => p.id !== temp.id))
    return
  }
  // Replace temp with real record (gets the real DB-generated id)
  setProjects(prev => prev.map(p => p.id === temp.id ? data : p))
}

  async function deleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setTasks(prev => prev.map(t => t.project_id === id ? { ...t, project_id: null, project: null } : t))
    await supabase.from('projects').delete().eq('id', id)
  }

  async function addProjectMember(projectId: string, query: string): Promise<string> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .or(`username.eq.${query},name.ilike.${query}`)
      .maybeSingle()
    if (!data) return 'User not found — search by their username or exact name'
    const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: data.id })
    if (error) return error.message
    await loadProjects()
    return ''
  }

  async function removeProjectMember(projectId: string, userId: string) {
    await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    await loadProjects()
  }

  async function updateSettings(updates: Partial<UserSettings>) {
    if (!user) return
    const next = { ...settings, ...updates }
    setSettings(next)
    settingsRef.current = next
    setTimeLeft(getDurationForMode(mode, next))
    await supabase.from('settings').upsert({ ...next, user_id: user.id })
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return
    setProfile(p => p ? { ...p, ...updates } : p)
    await supabase.from('profiles').update(updates).eq('id', user.id)
  }

  async function acceptTask(taskId: string) { await updateTask(taskId, { assignment_status: 'accepted' }) }
  async function declineTask(taskId: string) { await updateTask(taskId, { assignment_status: 'declined' }) }

  return (
    <AppContext.Provider value={{
      user, profile, tasks, projects, sessions, settings, presence, notifications,
      mode, timeLeft, isRunning, pomosToday, cycleCount, pinnedTaskId,
      activeTab, setActiveTab,
      setMode, startStop, reset, skip, pinTask,
      addTask, updateTask, deleteTask,
      addProject, deleteProject, addProjectMember, removeProjectMember,
      updateSettings, updateProfile, refreshSessions,
      acceptTask, declineTask, logSession,
      dismissNotification,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx;
}