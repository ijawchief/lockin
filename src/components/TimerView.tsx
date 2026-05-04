'use client'

import { RotateCcw, SkipForward } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import type { TimerMode } from '@/lib/types'

const MODES: { id: TimerMode; label: string }[] = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'short_break', label: 'Short Break' },
  { id: 'long_break', label: 'Long Break' },
]

const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Focus Time',
  short_break: 'Short Break',
  long_break: 'Long Break',
}

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getDuration(mode: TimerMode, settings: { pomo_duration: number; short_break: number; long_break: number }) {
  if (mode === 'pomodoro') return settings.pomo_duration * 60
  if (mode === 'short_break') return settings.short_break * 60
  return settings.long_break * 60
}

export default function TimerView() {
  const { mode, setMode, timeLeft, isRunning, startStop, reset, skip, pomosToday, cycleCount, settings, pinnedTaskId, tasks } = useApp()
  const pinnedTask = pinnedTaskId ? tasks.find(t => t.id === pinnedTaskId) : null

  const totalDuration = getDuration(mode, settings)
  const progress = timeLeft / totalDuration
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  // Pomo cycle dots (4 marks)
  const interval = settings.long_break_interval
  const cyclePos = cycleCount % interval

  return (
    <div className="card p-5 mx-4 mt-3">
      {/* Mode selector */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-6">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === m.id ? 'white' : 'transparent',
              color: mode === m.id ? 'var(--primary)' : 'var(--muted)',
              fontWeight: mode === m.id ? 600 : 400,
              boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="flex justify-center mb-5">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <svg width="220" height="220" className={isRunning ? 'timer-glow' : ''}>
            {/* Background circle */}
            <circle
              cx="110" cy="110" r={RADIUS}
              fill="none"
              stroke="#F0F2F5"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="110" cy="110" r={RADIUS}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {mins}:{secs}
            </span>
            <span className="text-sm font-semibold mt-1" style={{ color: 'var(--primary)' }}>
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>
      </div>

      {/* Pomo cycle dots */}
      <div className="flex items-center gap-1.5 px-8 mb-1">
        {Array.from({ length: interval }).map((_, i) => (
          <div key={i} className={`pomo-dot ${i < cyclePos ? 'filled' : ''}`} />
        ))}
      </div>
      <p className="text-center text-sm mb-5" style={{ color: 'var(--muted)' }}>
        {pomosToday} pomo{pomosToday !== 1 ? 's' : ''} today
      </p>

      {/* Active task name */}
      {pinnedTask ? (
        <div className="flex items-center justify-center gap-2 mb-4 px-4">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isRunning ? 'var(--primary)' : 'var(--muted)' }} />
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
            {pinnedTask.title}
          </p>
        </div>
      ) : (
        <div className="mb-4" />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="btn-ghost w-12 h-12 flex items-center justify-center"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={startStop}
          className="btn-primary flex-1 h-14 text-lg"
          style={{ maxWidth: 200 }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={skip}
          className="btn-ghost w-12 h-12 flex items-center justify-center"
          title="Skip"
        >
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  )
}
