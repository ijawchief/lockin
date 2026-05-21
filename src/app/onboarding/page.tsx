'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Data ────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'killer',
    emoji: '😤',
    question: "What's killing your focus right now?",
    sub: "Be honest — we've all been there.",
    options: [
      { id: 'phone',    emoji: '📱', label: 'My phone keeps pulling me in',         score: { deep: 3, sprint: 1 } },
      { id: 'notifs',   emoji: '💬', label: 'Slack, emails, endless notifications',  score: { deep: 2, team: 1 } },
      { id: 'overwhelm',emoji: '😵', label: "Too much to do, don't know where to start", score: { sprint: 3, momentum: 1 } },
      { id: 'drift',    emoji: '🌀', label: 'I start strong then drift off',         score: { momentum: 3, deep: 1 } },
    ],
  },
  {
    id: 'workstyle',
    emoji: '🧑‍💻',
    question: 'How do you mostly work?',
    sub: 'This helps us show you the right features.',
    options: [
      { id: 'solo',   emoji: '🎧', label: 'Solo — just me and my tasks',        score: { deep: 2, sprint: 2 } },
      { id: 'small',  emoji: '👥', label: 'Small team — we work closely together', score: { team: 3, sprint: 1 } },
      { id: 'big',    emoji: '🏢', label: 'Big org — lots of people, lots of noise', score: { team: 2, deep: 2 } },
      { id: 'mixed',  emoji: '🔄', label: 'Depends — switching between both',    score: { team: 1, sprint: 2 } },
    ],
  },
  {
    id: 'win',
    emoji: '🏆',
    question: 'What would a perfect day look like?',
    sub: "Pick what hits hardest for you.",
    options: [
      { id: 'tasks',    emoji: '✅', label: 'I crushed my task list, nothing left',  score: { sprint: 3 } },
      { id: 'streak',   emoji: '🔥', label: "I kept my streak — didn't break the chain", score: { momentum: 3 } },
      { id: 'hours',    emoji: '⏱',  label: 'I logged solid focused hours',          score: { deep: 3 } },
      { id: 'visible',  emoji: '👀', label: 'My team could see I showed up and delivered', score: { team: 3 } },
    ],
  },
  {
    id: 'missing',
    emoji: '🔍',
    question: "What's been missing from your workflow?",
    sub: 'This is the gap we\'re here to fill.',
    options: [
      { id: 'accountability', emoji: '🎯', label: 'Something to hold me accountable daily',  score: { momentum: 2, sprint: 1 } },
      { id: 'tracking',       emoji: '📊', label: 'A real way to track my actual progress',  score: { sprint: 2, deep: 1 } },
      { id: 'teamvis',        emoji: '🤝', label: "Visibility into what my team is doing",   score: { team: 3 } },
      { id: 'distraction',    emoji: '🔕', label: 'A way to actually stay off distractions', score: { deep: 3 } },
    ],
  },
]

type ArchetypeKey = 'deep' | 'momentum' | 'team' | 'sprint'

const ARCHETYPES: Record<ArchetypeKey, {
  emoji: string
  title: string
  tagline: string
  body: string
  features: { emoji: string; title: string; desc: string }[]
  color: string
}> = {
  deep: {
    emoji: '🎧',
    title: 'The Deep Worker',
    tagline: "You do your best work when the world shuts up.",
    body: "Distractions aren't your fault — your environment is. LockIn gives you a timer that trains your brain to enter flow, a streak that makes you want to protect your sessions, and a daily record that proves to yourself you showed up.",
    features: [
      { emoji: '🍅', title: 'Pomodoro Timer', desc: 'Train your brain to work in focused sprints' },
      { emoji: '🔥', title: 'Streak Tracker', desc: 'Build a chain you\'re scared to break' },
      { emoji: '📊', title: 'Daily Stats', desc: 'See your real hours, no fluff' },
    ],
    color: '#3B82F6',
  },
  momentum: {
    emoji: '🔥',
    title: 'The Momentum Machine',
    tagline: "One good day leads to another — you just need the system.",
    body: "You're not lazy. You lose momentum when you can't see your progress. LockIn tracks every session, every streak, every task done — and shows it back to you. Once you see the streak, you'll protect it like it owes you money.",
    features: [
      { emoji: '🔥', title: 'Daily Streaks', desc: 'See your consistency build day by day' },
      { emoji: '🏆', title: 'Personal Bests', desc: 'Beat your own records — that\'s the game' },
      { emoji: '📅', title: 'Weekly Reports', desc: 'Proof you showed up this week' },
    ],
    color: '#F59E0B',
  },
  team: {
    emoji: '👥',
    title: 'The Visible Leader',
    tagline: "You want your team to see you. And you want to see them.",
    body: "Too many meetings, not enough actual work. LockIn gives your team real-time visibility into who's in focus mode — no check-ins needed. Assign tasks, see who's working on what, and build a culture where doing the work speaks louder than talking about it.",
    features: [
      { emoji: '👀', title: 'Live Presence', desc: 'See who\'s in focus mode right now' },
      { emoji: '📋', title: 'Task Assignment', desc: 'Assign work and get notified when it\'s done' },
      { emoji: '🏅', title: 'Team Leaderboard', desc: 'Healthy competition keeps everyone sharp' },
    ],
    color: '#10B981',
  },
  sprint: {
    emoji: '⚡',
    title: 'The Sprint Master',
    tagline: "You thrive when you know exactly what to do next.",
    body: "Vague to-do lists kill your drive. LockIn turns your work into concrete sprints — each task has a pomo estimate, a timer, and a satisfying checkmark. By the end of the day, you'll have a record of exactly what you built.",
    features: [
      { emoji: '✅', title: 'Task Tracking', desc: 'Turn goals into a list you actually complete' },
      { emoji: '🍅', title: 'Pomo Estimates', desc: 'Know how long things will take before you start' },
      { emoji: '🎯', title: 'Daily Wins', desc: 'End every day knowing what you accomplished' },
    ],
    color: '#8B5CF6',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [step, setStep] = useState<'welcome' | number | 'result'>('welcome')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [archetype, setArchetype] = useState<ArchetypeKey>('deep')
  const [animating, setAnimating] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      supabase.from('profiles').select('name').eq('id', data.user.id).single()
        .then(({ data: p }) => setUserName(p?.name?.split(' ')[0] ?? 'you'))
    })
  }, [])

  function transition(next: typeof step) {
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
      setAnimating(false)
    }, 280)
  }

  function selectAnswer(questionId: string, optionId: string) {
    const newAnswers = { ...answers, [questionId]: optionId }
    setAnswers(newAnswers)

    const currentIdx = QUESTIONS.findIndex(q => q.id === questionId)
    const isLast = currentIdx === QUESTIONS.length - 1

    setTimeout(() => {
      if (isLast) {
        // Score to find archetype
        const scores: Record<ArchetypeKey, number> = { deep: 0, momentum: 0, team: 0, sprint: 0 }
        QUESTIONS.forEach(q => {
          const answerId = newAnswers[q.id]
          const opt = q.options.find(o => o.id === answerId)
          if (opt?.score) {
            Object.entries(opt.score).forEach(([k, v]) => {
              scores[k as ArchetypeKey] += v
            })
          }
        })
        const best = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as ArchetypeKey
        setArchetype(best)
        transition('result')
      } else {
        transition(currentIdx + 1)
      }
    }, 180)
  }

  function finish() {
    localStorage.setItem('lockin_onboarded', '1')
    router.push('/app')
  }

  const currentQuestion = typeof step === 'number' ? QUESTIONS[step] : null
  const arc = ARCHETYPES[archetype]
  const progress = typeof step === 'number' ? (step + 1) / QUESTIONS.length : step === 'result' ? 1 : 0

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#0F0F14' }}
    >
      {/* Progress bar */}
      {step !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 h-0.5" style={{ background: '#1A1A2E' }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, background: '#E8654A' }}
          />
        </div>
      )}

      <div
        className="w-full max-w-sm flex flex-col"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: '#E8654A22', border: '1px solid #E8654A44' }}>
              🔒
            </div>
            <div>
              <h1 className="text-3xl font-black mb-2" style={{ color: '#F1F5F9' }}>
                Hey {userName} 👋
              </h1>
              <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                Most people lose 3+ hours a day to things that don't matter.
              </p>
              <p className="text-base leading-relaxed mt-2" style={{ color: '#9CA3AF' }}>
                Tell us what's in your way — and we'll show you exactly how to get it out.
              </p>
            </div>
            <button
              onClick={() => transition(0)}
              className="w-full py-4 rounded-2xl text-base font-black transition-all active:scale-95"
              style={{ background: '#E8654A', color: 'white' }}
            >
              Let's go →
            </button>
          </div>
        )}

        {/* ── Questions ── */}
        {currentQuestion && (
          <div className="flex flex-col gap-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i <= (step as number) ? '#E8654A' : '#2D2D3F' }}
                />
              ))}
            </div>

            {/* Question */}
            <div className="mt-2">
              <span className="text-3xl mb-3 block">{currentQuestion.emoji}</span>
              <h2 className="text-2xl font-black leading-tight mb-2" style={{ color: '#F1F5F9' }}>
                {currentQuestion.question}
              </h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>{currentQuestion.sub}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map(opt => {
                const selected = answers[currentQuestion.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-98"
                    style={{
                      background: selected ? '#E8654A18' : '#1A1A2E',
                      border: `1.5px solid ${selected ? '#E8654A' : '#2D2D3F'}`,
                      transform: selected ? 'scale(0.99)' : 'scale(1)',
                    }}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                    <span
                      className="text-sm font-semibold leading-snug"
                      style={{ color: selected ? '#F1F5F9' : '#9CA3AF' }}
                    >
                      {opt.label}
                    </span>
                    {selected && (
                      <div
                        className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#E8654A' }}
                      >
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {step === 'result' && (
          <div className="flex flex-col gap-5">
            {/* Archetype card */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: arc.color + '15', border: `1.5px solid ${arc.color}44` }}
            >
              <div className="text-5xl mb-3">{arc.emoji}</div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: arc.color }}>
                Your focus type
              </p>
              <h2 className="text-2xl font-black mb-2" style={{ color: '#F1F5F9' }}>
                {arc.title}
              </h2>
              <p className="text-base font-semibold italic mb-3" style={{ color: arc.color }}>
                "{arc.tagline}"
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                {arc.body}
              </p>
            </div>

            {/* Features */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>
                Built for you
              </p>
              <div className="flex flex-col gap-2.5">
                {arc.features.map(f => (
                  <div
                    key={f.title}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: '#1A1A2E', border: '1px solid #2D2D3F' }}
                  >
                    <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#F1F5F9' }}>{f.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={finish}
              className="w-full py-4 rounded-2xl text-base font-black transition-all active:scale-95 mt-1"
              style={{ background: '#E8654A', color: 'white' }}
            >
              I'm ready. Let's lock in 🔒
            </button>

            <p className="text-xs text-center" style={{ color: '#4B5563' }}>
              You can always change your settings later
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
