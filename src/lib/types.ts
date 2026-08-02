export type TimerMode = 'pomodoro' | 'short_break' | 'long_break'

export interface TaskCompletion {
  id: string
  task_id: string
  completed_by: string
  date: string
  created_at: string
}

export interface Profile {
  id: string
  username: string
  name: string
  bio: string
  avatar_url: string | null
  twitter: string
  instagram: string
  website: string
  streak: number
  last_session_date: string | null
  created_at: string
  account_type: 'personal' | 'team'
  team_name: string | null
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string
  estimated_pomos: number
  completed_pomos: number
  done: boolean
  pinned: boolean
  assigned_to: string | null
  assigned_by: string | null
  assignment_status: 'pending' | 'accepted' | 'declined' | null
  due_date: string | null
  recurrence: 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null
  created_at: string
  completed_at: string | null
  // joined
  project?: Project | null
  assignee_profile?: Profile | null
}

export interface Project {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  // joined
  members?: Profile[]
}

export interface Session {
  id: string
  user_id: string
  project_id: string | null
  task_id: string | null
  duration: number
  mode: TimerMode
  completed_at: string
}

export interface UserSettings {
  user_id: string
  pomo_duration: number
  short_break: number
  long_break: number
  long_break_interval: number
  auto_start_break: boolean
  auto_start_pomo: boolean
  sound_enabled: boolean
}

export const DEFAULT_SETTINGS: UserSettings = {
  user_id: '',
  pomo_duration: 25,
  short_break: 5,
  long_break: 15,
  long_break_interval: 4,
  auto_start_break: false,
  auto_start_pomo: false,
  sound_enabled: true,
}

export const LEVEL_CONFIG = [
  { name: 'SEEDLING', emoji: '🌱', min: 0, max: 10 },
  { name: 'SPARKED', emoji: '⚡', min: 10, max: 50 },
  { name: 'ON FIRE', emoji: '🔥', min: 50, max: 100 },
  { name: 'DIAMOND', emoji: '💎', min: 100, max: 250 },
  { name: 'LEGEND', emoji: '👑', min: 250, max: 500 },
  { name: 'IMMORTAL', emoji: '🏆', min: 500, max: Infinity },
]

export function getLevel(sessions: number) {
  return LEVEL_CONFIG.find(l => sessions >= l.min && sessions < l.max) ?? LEVEL_CONFIG[0]
}

export const ACHIEVEMENTS = [
  { id: 'first_lock', name: 'First Lock', emoji: '🎯', desc: 'Complete your first session', condition: (s: number) => s >= 1 },
  { id: 'double_digits', name: 'Double Digits', emoji: '🔟', desc: 'Complete 10 sessions', condition: (s: number) => s >= 10 },
  { id: 'fifty_club', name: '50 Club', emoji: '⭐', desc: 'Complete 50 sessions', condition: (s: number) => s >= 50 },
  { id: 'century', name: 'Century', emoji: '💯', desc: 'Complete 100 sessions', condition: (s: number) => s >= 100 },
  { id: 'on_a_roll', name: 'On a Roll', emoji: '🔥', desc: '3-day streak', condition: (_s: number, streak: number) => streak >= 3 },
  { id: 'unstoppable', name: 'Unstoppable', emoji: '⚡', desc: '7-day streak', condition: (_s: number, streak: number) => streak >= 7 },
  { id: 'early_bird', name: 'Early Bird', emoji: '🌅', desc: 'Session before 8am', condition: () => false },
  { id: 'night_owl', name: 'Night Owl', emoji: '🦉', desc: 'Session after 10pm', condition: () => false },
  { id: 'team_player', name: 'Team Player', emoji: '👥', desc: 'Assign a task', condition: () => false },
  { id: 'sprint', name: 'Sprint', emoji: '🏃', desc: '4 sessions in a day', condition: () => false },
]

export const PROJECT_COLORS = [
  '#E8654A', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  '#14B8A6', '#F97316', '#84CC16', '#A855F7',
]
