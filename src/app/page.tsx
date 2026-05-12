'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lock, Timer, CheckSquare, Users, BarChart2,
  Zap, Target, Eye, ArrowRight, Check, X, Menu, ChevronRight
} from 'lucide-react'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
        <Lock size={16} color="white" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>LockIn</span>
    </Link>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: '#fff', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Use Cases', 'Pricing', 'FAQs'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--muted)', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}>
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{ color: 'var(--text)', textDecoration: 'none', background: '#F3F4F6' }}>
              Login
            </Link>
            <Link href="/login" className="text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{ background: 'var(--primary)', color: 'white', textDecoration: 'none' }}>
              Start Free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={22} color="var(--text)" />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '16px 24px 24px' }}>
            {['Features', 'Use Cases', 'Pricing', 'FAQs'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '10px 0', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
                {item}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12, background: '#F3F4F6', color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>
                Login
              </Link>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12, background: 'var(--primary)', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, textAlign: 'center', background: 'linear-gradient(180deg, #FFF7F5 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF0EC', border: '1px solid #FCDDD6', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Now in beta — free for small teams</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24, color: 'var(--text)' }}>
            A focus workspace for{' '}
            <span style={{ color: 'var(--primary)' }}>small teams</span>{' '}
            that actually do deep work.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#6B7280', lineHeight: 1.6, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Assign tasks, run focus sessions, and see what your team is working on — without meetings, Slack chasing, or productivity chaos.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--primary)', color: 'white', textDecoration: 'none',
              padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 16,
            }}>
              Start Free <ArrowRight size={18} />
            </Link>
            <a href="mailto:hello@lockinhq.co" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#F3F4F6', color: 'var(--text)', textDecoration: 'none',
              padding: '14px 28px', borderRadius: 14, fontWeight: 600, fontSize: 16,
            }}>
              Book a Demo
            </a>
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Built for indie founders, creators, freelancers, and async teams.
          </p>

          {/* App mockup */}
          <div style={{ marginTop: 64, position: 'relative' }}>
            <div style={{
              background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)',
              borderRadius: 24, padding: 24, maxWidth: 380, margin: '0 auto',
              boxShadow: '0 40px 80px rgba(232,101,74,0.15), 0 20px 40px rgba(0,0,0,0.15)',
            }}>
              {/* Timer ring mockup */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <svg width={160} height={160} style={{ filter: 'drop-shadow(0 0 20px rgba(232,101,74,0.5))' }}>
                    <circle cx={80} cy={80} r={68} fill="none" stroke="#2A2A4A" strokeWidth={10} />
                    <circle cx={80} cy={80} r={68} fill="none" stroke="var(--primary)" strokeWidth={10}
                      strokeDasharray={427} strokeDashoffset={107} strokeLinecap="round"
                      transform="rotate(-90 80 80)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>18:45</span>
                    <span style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>POMODORO</span>
                  </div>
                </div>
              </div>
              {/* Tasks mockup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { title: 'Design landing page', done: true, color: '#E8654A' },
                  { title: 'Review pitch deck', done: false, color: '#3B82F6', active: true },
                  { title: 'Write weekly update', done: false, color: '#10B981' },
                ].map((task, i) => (
                  <div key={i} style={{
                    background: task.active ? 'rgba(232,101,74,0.15)' : 'rgba(255,255,255,0.06)',
                    border: task.active ? '1px solid rgba(232,101,74,0.4)' : '1px solid transparent',
                    borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: task.done ? 'var(--primary)' : 'transparent',
                      border: task.done ? 'none' : '2px solid #4B5563',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {task.done && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 13, color: task.done ? '#6B7280' : 'white', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>
                      {task.title}
                    </span>
                    {task.active && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>▶ LIVE</span>}
                  </div>
                ))}
              </div>
              {/* Presence bar */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>3 teammates locked in now</span>
                <div style={{ display: 'flex', marginLeft: 'auto' }}>
                  {['T', 'M', 'B'].map((l, i) => (
                    <div key={i} style={{
                      width: 24, height: 24, borderRadius: '50%', background: ['#E8654A','#3B82F6','#10B981'][i],
                      border: '2px solid #1A1A2E', marginLeft: i > 0 ? -8 : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: 'white'
                    }}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <section style={{ background: 'var(--primary)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 32 }}>
            Replace constant check-ins with visible execution.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 48px' }}>
            {[
              'Know who\'s focused',
              'See tasks moving in real time',
              'Track work without micromanaging',
              'Keep async teams aligned',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={13} color="white" strokeWidth={3} />
                </div>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="features" style={{ background: '#1A1A2E', padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Remote work was supposed to mean freedom.
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: 18, marginBottom: 48 }}>Instead, it became:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
            {[
              'endless Slack pings',
              'scattered task tools',
              'fake "online" presence',
              'meetings that could\'ve been messages',
              'no visibility into actual work',
            ].map(pain => (
              <div key={pain} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left'
              }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={13} color="#EF4444" strokeWidth={2.5} />
                </div>
                <span style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 500 }}>{pain}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(232,101,74,0.1)', border: '1px solid rgba(232,101,74,0.2)', borderRadius: 16, padding: '24px 32px' }}>
            <p style={{ color: '#E5E7EB', fontSize: 17, lineHeight: 1.6, margin: 0 }}>
              Small teams don't need enterprise project management.<br />
              <strong style={{ color: 'var(--primary)' }}>They need momentum.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section style={{ background: '#F8F9FA', padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            LockIn gives your team<br />one place to execute.
          </h2>
          <p style={{ color: '#6B7280', fontSize: 18, marginBottom: 48 }}>
            Your tasks, focus sessions, and team activity — all in one lightweight workspace.
          </p>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>No switching between:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 48 }}>
            {['timers', 'task apps', 'spreadsheets', 'Slack', 'accountability groups'].map(tool => (
              <span key={tool} style={{
                background: 'white', border: '1.5px solid var(--border)',
                borderRadius: 100, padding: '8px 18px', fontSize: 14, fontWeight: 600, color: '#6B7280'
              }}>❌ {tool}</span>
            ))}
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #C8452A 100%)', borderRadius: 16, padding: '24px 32px' }}>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
              Everything happens in one flow. ✦
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Built for how great teams work.
            </h2>
            <p style={{ color: '#6B7280', fontSize: 18 }}>Everything you need. Nothing you don't.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

              {/* Shared Focus Sessions */}
              <div style={{ background: '#FFF7F5', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(232,101,74,0.1)' }}>
                <div style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)', padding: '28px 28px 0', margin: '0' }}>
                  {/* Timer + presence mockup */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg width={80} height={80}>
                        <circle cx={40} cy={40} r={33} fill="none" stroke="#2A2A4A" strokeWidth={6} />
                        <circle cx={40} cy={40} r={33} fill="none" stroke="#E8654A" strokeWidth={6}
                          strokeDasharray={207} strokeDashoffset={52} strokeLinecap="round"
                          transform="rotate(-90 40 40)" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>18:45</span>
                        <span style={{ fontSize: 8, color: '#6B7280' }}>FOCUS</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>4 teammates locked in</span>
                      </div>
                      {[
                        { name: 'Marcus', task: 'Writing proposal', color: '#E8654A' },
                        { name: 'Bisi', task: 'Editing video', color: '#3B82F6' },
                        { name: 'Tolu', task: 'Client review', color: '#10B981' },
                      ].map(m => (
                        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                            {m.name[0]}
                          </div>
                          <span style={{ fontSize: 11, color: '#D1D5DB', flex: 1 }}>{m.name}</span>
                          <span style={{ fontSize: 10, color: '#6B7280' }}>{m.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <Users size={18} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Shared Focus Sessions</h3>
                  </div>
                  <p style={{ color: '#6B7280', lineHeight: 1.6, fontSize: 14, margin: 0 }}>See who's currently locked in and working. Run solo or collaborative focus sessions with your team.</p>
                </div>
              </div>

              {/* Lightweight Task Management */}
              <div style={{ background: '#EFF6FF', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)', padding: '24px 24px 0' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>TODAY'S TASKS</span>
                      <span style={{ fontSize: 10, color: '#E8654A', fontWeight: 600 }}>3 / 5 done</span>
                    </div>
                    {[
                      { title: 'Design landing page', done: true, color: '#E8654A', assignee: 'T' },
                      { title: 'Review pitch deck', done: true, color: '#3B82F6', assignee: 'M' },
                      { title: 'Write weekly update', done: false, color: '#10B981', assignee: 'B', active: true },
                      { title: 'Send client invoice', done: false, color: '#8B5CF6', assignee: 'T' },
                    ].map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: t.active ? 'rgba(232,101,74,0.12)' : 'rgba(255,255,255,0.04)',
                        border: t.active ? '1px solid rgba(232,101,74,0.3)' : '1px solid transparent',
                        borderRadius: 10, padding: '8px 12px', marginBottom: 6,
                      }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.done ? t.color : 'transparent', border: t.done ? 'none' : `2px solid ${t.color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {t.done && <Check size={8} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 12, color: t.done ? '#6B7280' : '#E5E7EB', textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white' }}>{t.assignee}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <CheckSquare size={18} color="#3B82F6" />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Lightweight Task Management</h3>
                  </div>
                  <p style={{ color: '#6B7280', lineHeight: 1.6, fontSize: 14, margin: 0 }}>Assign tasks, track progress, and keep work moving without bloated project software.</p>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

              {/* Async Accountability */}
              <div style={{ background: '#F0FDF4', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)', padding: '24px 24px 0' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>INBOX</span>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8654A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>3</div>
                    </div>
                    {[
                      { icon: '📋', text: 'Marcus assigned you "Review docs"', time: '2m ago', unread: true },
                      { icon: '✅', text: 'Bisi completed "Design mockup"', time: '14m ago', unread: true },
                      { icon: '👥', text: 'You\'ve been added to "Q2 Campaign"', time: '1h ago', unread: true },
                      { icon: '🔔', text: 'Tolu picked up "Write copy"', time: '2h ago', unread: false },
                    ].map((n, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: n.unread ? 'rgba(255,255,255,0.06)' : 'transparent',
                        borderRadius: 10, padding: '8px 10px', marginBottom: 4,
                        borderLeft: n.unread ? '2px solid #E8654A' : '2px solid transparent',
                      }}>
                        <span style={{ fontSize: 13 }}>{n.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 11, color: n.unread ? '#E5E7EB' : '#6B7280', margin: 0, lineHeight: 1.4 }}>{n.text}</p>
                          <span style={{ fontSize: 10, color: '#4B5563' }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <Eye size={18} color="#10B981" />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Async Accountability</h3>
                  </div>
                  <p style={{ color: '#6B7280', lineHeight: 1.6, fontSize: 14, margin: 0 }}>Know when teammates pick up tasks, enter focus mode, or complete work. Without meetings. Without micromanaging.</p>
                </div>
              </div>

              {/* Project-Based Time Tracking */}
              <div style={{ background: '#F5F3FF', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)', padding: '24px 24px 0' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>THIS WEEK</span>
                      <span style={{ fontSize: 11, color: '#E8654A', fontWeight: 600 }}>18.5 hrs total</span>
                    </div>
                    {[
                      { name: 'Client Website', hours: 7.5, max: 10, color: '#E8654A' },
                      { name: 'Mobile App', hours: 5, max: 10, color: '#3B82F6' },
                      { name: 'Internal Tools', hours: 4, max: 10, color: '#10B981' },
                      { name: 'Research', hours: 2, max: 10, color: '#8B5CF6' },
                    ].map(p => (
                      <div key={p.name} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#D1D5DB' }}>📁 {p.name}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{p.hours}h</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${(p.hours / p.max) * 100}%`, background: p.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <BarChart2 size={18} color="#8B5CF6" />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Project-Based Time Tracking</h3>
                  </div>
                  <p style={{ color: '#6B7280', lineHeight: 1.6, fontSize: 14, margin: 0 }}>Track focused work per project or client. Perfect for freelancers, agencies, and contractor teams.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="use-cases" style={{ padding: '96px 24px', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Built for modern small teams.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { emoji: '🚀', title: 'Indie Founders', desc: 'Manage rotating contractors without chasing updates all day.' },
              { emoji: '🎬', title: 'Creators', desc: 'Keep editors, designers, and researchers aligned in one workspace.' },
              { emoji: '💼', title: 'Freelancers', desc: 'Track focus time across projects and bill clients accurately.' },
              { emoji: '🏢', title: 'Small Agencies', desc: 'Know what got done before the client asks.' },
              { emoji: '📚', title: 'Study Groups', desc: 'Stay accountable with synchronized focus sessions.' },
            ].map(u => (
              <div key={u.title} style={{ background: 'white', borderRadius: 18, padding: '24px 20px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{u.emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{u.title}</h3>
                <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#FFF0EC', borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Our philosophy</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 20 }}>
            Not another productivity app.
          </h2>
          <p style={{ color: '#6B7280', fontSize: 18, lineHeight: 1.7, marginBottom: 48 }}>
            Most tools optimize <em>organization</em>.<br />
            LockIn optimizes <strong style={{ color: 'var(--text)' }}>execution.</strong>
          </p>
          <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 24 }}>Because deep work happens when teams can:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto' }}>
            {['focus clearly', 'see momentum', 'stay accountable', 'work asynchronously'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8F9FA', borderRadius: 14, padding: '14px 20px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={14} color="white" strokeWidth={3} />
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Your team already knows<br />what to do.
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: 20, marginBottom: 40 }}>
            Now they need a place to lock in.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--primary)', color: 'white', textDecoration: 'none',
            padding: '16px 36px', borderRadius: 16, fontWeight: 700, fontSize: 18,
            boxShadow: '0 8px 32px rgba(232,101,74,0.4)',
          }}>
            Start Free <ArrowRight size={20} />
          </Link>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 20 }}>
            Small teams. Deep work. Zero chaos.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111827', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Lock size={14} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>LockIn</span>
          </div>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
            Built for teams that actually want to get work done.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Features', 'Login', 'Start Free'].map(item => (
              <Link key={item} href={item === 'Start Free' || item === 'Login' ? '/login' : '#features'}
                style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                {item}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1120, margin: '24px auto 0', borderTop: '1px solid #1F2937', paddingTop: 24, textAlign: 'center' }}>
          <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>© 2026 LockIn. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .hidden { display: none !important; }
        }
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
          .md\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
