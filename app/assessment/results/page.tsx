'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ActivityLogIcon,
  ArrowRightIcon,
  PaperPlaneIcon,
} from '@radix-ui/react-icons'

type Message = { role: 'user' | 'assistant'; content: string }

type ParsedAssessment = {
  urgencyLevel: string
  urgencyExplanation: string
  differential: { likelihood: string; name: string; reason: string }[]
  redFlags: { flag: string; status: string }[]
  nextSteps: string
  followUpPrompts: string[]
  disclaimer: string
}

const URGENCY: Record<string, { label: string; cssClass: string; dotColor: string }> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: 'Emergency Department — Now',
    cssClass: 'urgency-critical',
    dotColor: 'var(--urgent-critical)',
  },
  URGENT_CARE: {
    label: 'Urgent Care',
    cssClass: 'urgency-high',
    dotColor: 'var(--urgent-high)',
  },
  CONTACT_DOCTOR_TODAY: {
    label: 'Contact Doctor Today',
    cssClass: 'urgency-moderate',
    dotColor: 'var(--urgent-moderate)',
  },
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
    cssClass: 'urgency-low',
    dotColor: 'var(--urgent-low)',
  },
}

const LIKELIHOOD_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  HIGH:     { bg: 'var(--urgent-critical-bg)', text: 'var(--urgent-critical)', border: 'var(--urgent-critical)' },
  MODERATE: { bg: 'var(--urgent-high-bg)',     text: 'var(--urgent-high)',     border: 'var(--urgent-high)' },
  LOWER:    { bg: 'var(--cream-border)',        text: 'var(--text-muted-light)', border: 'var(--cream-border)' },
}

const STATUS_STYLE: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  PRESENT: { icon: '+', bg: 'var(--urgent-critical-bg)', text: 'var(--urgent-critical)', border: 'var(--urgent-critical)' },
  ABSENT:  { icon: '−', bg: 'var(--urgent-low-bg)',      text: 'var(--urgent-low)',      border: 'var(--urgent-low)' },
  UNKNOWN: { icon: '?', bg: 'var(--cream-border)',        text: 'var(--text-muted-light)', border: 'var(--cream-border)' },
}

function parseAssessment(text: string): ParsedAssessment {
  const urgencyLevel = (() => {
    if (text.includes('EMERGENCY_DEPARTMENT_NOW')) return 'EMERGENCY_DEPARTMENT_NOW'
    if (text.includes('URGENT_CARE')) return 'URGENT_CARE'
    if (text.includes('CONTACT_DOCTOR_TODAY')) return 'CONTACT_DOCTOR_TODAY'
    if (text.includes('MONITOR_AT_HOME')) return 'MONITOR_AT_HOME'
    return 'CONTACT_DOCTOR_TODAY'
  })()

  const getSection = (key: string): string => {
    const patterns = [
      new RegExp(`\\*{0,2}${key}\\*{0,2}[:\\s*]+([\\s\\S]*?)(?=\\n\\*{0,2}(?:URGENCY|DIFFERENTIAL|RED_FLAGS|NEXT_STEPS|FOLLOW_UP|$))`, 'i'),
      new RegExp(`${key}[:\\s]+([\\s\\S]*?)(?=\\n[A-Z_]{3,}[:\\s]|$)`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[1]?.trim()) return match[1].trim()
    }
    return ''
  }

  const urgencyExplanation = getSection('URGENCY_EXPLANATION').replace(/\*\*/g, '').replace(/^\*+|\*+$/g, '').trim()

  const diffSection = getSection('DIFFERENTIAL')
  const differential = diffSection
    .split('\n').filter(l => l.trim())
    .map(line => {
      const clean = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
      const m = clean.match(/^(HIGH|MODERATE|LOWER)[:\s*-]+(.+?)(?:\s*[-–:]\s*(.+))?$/i)
      if (m) return { likelihood: m[1].toUpperCase(), name: m[2].trim(), reason: m[3]?.trim() || '' }
      return null
    }).filter(Boolean) as { likelihood: string; name: string; reason: string }[]

  const flagSection = getSection('RED_FLAGS')
  const redFlags = flagSection
    .split('\n').filter(l => l.trim())
    .map(line => {
      const clean = line.replace(/^[-•]\s*/, '').replace(/\*\*/g, '').trim()
      const m = clean.match(/^(.+?):\s*(PRESENT|ABSENT|UNKNOWN)\s*$/i)
      if (m) return { flag: m[1].trim(), status: m[2].toUpperCase() }
      if (clean.match(/PRESENT/i)) return { flag: clean.replace(/PRESENT/i, '').replace(/[-:]/g, '').trim(), status: 'PRESENT' }
      if (clean.match(/ABSENT/i))  return { flag: clean.replace(/ABSENT/i, '').replace(/[-:]/g, '').trim(),  status: 'ABSENT' }
      if (clean.match(/UNKNOWN/i)) return { flag: clean.replace(/UNKNOWN/i, '').replace(/[-:]/g, '').trim(), status: 'UNKNOWN' }
      return null
    }).filter(f => f && f.flag.length > 2) as { flag: string; status: string }[]

  const nextSteps = getSection('NEXT_STEPS').replace(/\*\*/g, '').trim()

  const followUpPrompts = (() => {
    const section = getSection('FOLLOW_UP_PROMPTS')
    if (!section) {
      const directMatch = text.match(/FOLLOW_UP_PROMPTS[:\s*]+\n?([\s\S]*?)(?=\n\*{0,2}[A-Z]|OrixLink AI provides|$)/i)
      if (!directMatch) return []
      return directMatch[1].split('\n').filter(l => l.trim())
        .map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, '').replace(/"/g, '').replace(/\*\*/g, '').trim())
        .filter(l => l.length > 5).slice(0, 3)
    }
    return section.split('\n').filter(l => l.trim())
      .map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, '').replace(/"/g, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 5).slice(0, 3)
  })()

  const disclaimerMatch = text.match(/OrixLink AI provides[\s\S]*?call 911\./)
  const disclaimer = disclaimerMatch?.[0] || 'OrixLink AI provides clinical support only. Not a diagnosis. If this is an emergency call 911.'

  return { urgencyLevel, urgencyExplanation, differential, redFlags, nextSteps, followUpPrompts, disclaimer }
}

function UrgencyBanner({ level, explanation }: { level: string; explanation: string }) {
  const cfg = URGENCY[level] || URGENCY.CONTACT_DOCTOR_TODAY
  return (
    <div className={cfg.cssClass} style={{ padding: '16px 20px', borderRadius: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: explanation ? 8 : 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dotColor, flexShrink: 0 }} />
        <span className="font-display" style={{ fontSize: '1.125rem', fontWeight: 500 }}>{cfg.label}</span>
      </div>
      {explanation && (
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginLeft: 20, opacity: 0.9 }}>{explanation}</p>
      )}
    </div>
  )
}

function NextStepsCard({ steps }: { steps: string }) {
  if (!steps) return null
  return (
    <div className="card-clinical" style={{ padding: '20px', marginBottom: 12 }}>
      <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--gold-muted)', marginBottom: 10 }}>
        Next Steps
      </p>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-on-light)', lineHeight: 1.65 }}>{steps}</p>
    </div>
  )
}

function DifferentialCard({ items }: { items: { likelihood: string; name: string; reason: string }[] }) {
  if (!items.length) return null
  return (
    <div className="card-clinical" style={{ padding: '20px', marginBottom: 12 }}>
      <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--gold-muted)', marginBottom: 12 }}>
        Most Likely Explanations
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => {
          const s = LIKELIHOOD_COLOR[item.likelihood] || LIKELIHOOD_COLOR.LOWER
          return (
            <div key={i} style={{ borderLeft: `3px solid ${s.border}`, paddingLeft: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 100,
                  background: s.bg, color: s.text,
                  letterSpacing: '0.06em',
                }}>
                  {item.likelihood}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-on-light)' }}>{item.name}</span>
              </div>
              {item.reason && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted-light)', lineHeight: 1.55 }}>{item.reason}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RedFlagCard({ flags }: { flags: { flag: string; status: string }[] }) {
  if (!flags.length) return null
  return (
    <div className="card-clinical" style={{ padding: '20px', marginBottom: 12 }}>
      <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--gold-muted)', marginBottom: 12 }}>
        Warning Signs
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {flags.map((item, i) => {
          const s = STATUS_STYLE[item.status] || STATUS_STYLE.UNKNOWN
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                border: `1px solid ${s.border}`,
                background: s.bg, color: s.text,
                fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-on-light)' }}>{item.flag}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssessmentView({ assessment }: { assessment: ParsedAssessment }) {
  return (
    <div>
      <UrgencyBanner level={assessment.urgencyLevel} explanation={assessment.urgencyExplanation} />
      <NextStepsCard steps={assessment.nextSteps} />
      <DifferentialCard items={assessment.differential} />
      <RedFlagCard flags={assessment.redFlags} />
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-light)', fontFamily: 'var(--font-mono)', lineHeight: 1.6, marginTop: 8, marginBottom: 16 }}>
        {assessment.disclaimer}
      </p>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          background: 'var(--obsidian)', color: 'var(--text-on-dark)',
          borderRadius: '16px 16px 4px 16px',
          padding: '12px 16px', maxWidth: '80%',
          fontSize: '0.9375rem', lineHeight: 1.6,
          border: '1px solid var(--obsidian-muted)',
        }}>
          {msg.content}
        </div>
      </div>
    )
  }
  const assessment = parseAssessment(msg.content)
  const isStructured = assessment.differential.length > 0 || assessment.redFlags.length > 0
  if (isStructured) {
    return <div style={{ marginBottom: 16 }}><AssessmentView assessment={assessment} /></div>
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
      <div className="card-clinical" style={{
        padding: '12px 16px', maxWidth: '85%',
        fontSize: '0.9375rem', lineHeight: 1.65,
        color: 'var(--text-on-light)', whiteSpace: 'pre-wrap',
        borderRadius: '4px 16px 16px 16px',
      }}>
        {msg.content.replace(/\*\*/g, '')}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [session, setSession] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUrgency, setCurrentUrgency] = useState('CONTACT_DOCTOR_TODAY')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedResponse = sessionStorage.getItem('orixlink_response')
    const savedSession = sessionStorage.getItem('orixlink_session')
    if (!savedResponse) { router.push('/assessment'); return }
    const parsed = savedSession ? JSON.parse(savedSession) : {}
    setSession(parsed)
    const assessment = parseAssessment(savedResponse)
    setCurrentUrgency(assessment.urgencyLevel)
    setFollowUps(assessment.followUpPrompts)
    setMessages([
      { role: 'user', content: parsed.symptoms || 'Initial assessment' },
      { role: 'assistant', content: savedResponse },
    ])
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setLoading(true)
    setInput('')
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, role: session.role, context: session.context, language: session.language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const updated: Message[] = [...next, { role: 'assistant', content: data.response }]
      setMessages(updated)
      const a = parseAssessment(data.response)
      setCurrentUrgency(a.urgencyLevel)
      setFollowUps(a.followUpPrompts)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const urgencyCfg = URGENCY[currentUrgency] || URGENCY.CONTACT_DOCTOR_TODAY

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', flexShrink: 0,
        borderBottom: '1px solid var(--cream-border)',
        background: 'var(--clinical-white)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1.5px solid var(--gold-muted)', background: 'var(--gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ActivityLogIcon style={{ color: 'var(--gold)', width: 13, height: 13 }} />
          </div>
          <span className="font-display" style={{ fontSize: '1.0625rem', fontWeight: 500, color: 'var(--text-on-light)' }}>
            OrixLink <span style={{ color: 'var(--gold)' }}>AI</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live urgency pill */}
          <div className={urgencyCfg.cssClass} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: urgencyCfg.dotColor, flexShrink: 0 }} />
            {urgencyCfg.label}
          </div>
          <Link href="/assessment">
            <button className="btn-ghost-gold" style={{ padding: '7px 16px', fontSize: '0.8125rem' }}>
              New Assessment <ArrowRightIcon style={{ width: 12, height: 12 }} />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Chat area ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: 720, width: '100%', margin: '0 auto',
        padding: '24px 16px 0',
        overflow: 'hidden',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div className="card-clinical" style={{
                padding: '12px 20px', borderRadius: '4px 16px 16px 16px',
                fontSize: '0.875rem', color: 'var(--text-muted-light)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div className="skeleton" style={{ width: 120, height: 14 }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Follow-up chips */}
        {followUps.length > 0 && !loading && (
          <div style={{ paddingBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted-light)', letterSpacing: '0.08em', marginBottom: 8 }}>
              TAP TO ADD TO ASSESSMENT
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {followUps.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  style={{
                    padding: '7px 14px', borderRadius: 100, fontSize: '0.8125rem',
                    border: '1px solid var(--cream-border)',
                    background: 'var(--clinical-white)',
                    color: 'var(--text-on-light)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--gold)'
                    ;(e.target as HTMLButtonElement).style.color = 'var(--gold)'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--cream-border)'
                    ;(e.target as HTMLButtonElement).style.color = 'var(--text-on-light)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          display: 'flex', gap: 10, paddingBottom: 16, paddingTop: 8, flexShrink: 0,
          borderTop: '1px solid var(--cream-border)',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Add a symptom, ask a question, or say what happened next..."
            className="input-clinical"
            style={{ flex: 1, borderRadius: 10 }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="btn-gold"
            style={{
              padding: '12px 18px', borderRadius: 10, flexShrink: 0,
              opacity: input.trim() && !loading ? 1 : 0.4,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            <PaperPlaneIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <p style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted-light)', textAlign: 'center', paddingBottom: 16, lineHeight: 1.5 }}>
          Nothing is final — OrixLink updates its assessment as new information arrives
        </p>
      </div>
    </main>
  )
}
