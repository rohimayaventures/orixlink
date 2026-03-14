'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY: Record<string, { label: string; color: string; border: string; bg: string; text: string; dot: string }> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: 'Emergency Department — Now',
    color: 'red',
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  URGENT_CARE: {
    label: 'Urgent Care',
    color: 'orange',
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  CONTACT_DOCTOR_TODAY: {
    label: 'Contact Doctor Today',
    color: 'yellow',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
  },
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
    color: 'green',
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
}

const LIKELIHOOD_STYLE: Record<string, { badge: string; border: string }> = {
  HIGH: { badge: 'bg-red-100 text-red-700 border border-red-200', border: 'border-l-red-400' },
  MODERATE: { badge: 'bg-orange-100 text-orange-700 border border-orange-200', border: 'border-l-orange-400' },
  LOWER: { badge: 'bg-slate-100 text-slate-600 border border-slate-200', border: 'border-l-slate-300' },
}

const STATUS_STYLE: Record<string, { icon: string; color: string }> = {
  PRESENT: { icon: '+', color: 'text-red-600 bg-red-50 border-red-200' },
  ABSENT: { icon: '−', color: 'text-green-600 bg-green-50 border-green-200' },
  UNKNOWN: { icon: '?', color: 'text-slate-500 bg-slate-100 border-slate-200' },
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseAssessment(text: string): ParsedAssessment {
  const get = (key: string) => {
    const regex = new RegExp(`\\*{0,2}${key}\\*{0,2}[:\\s]+([\\s\\S]*?)(?=\\n\\*{0,2}[A-Z_]+\\*{0,2}:|$)`)
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  // Urgency
  const urgencyLevel = (() => {
    if (text.includes('EMERGENCY_DEPARTMENT_NOW')) return 'EMERGENCY_DEPARTMENT_NOW'
    if (text.includes('URGENT_CARE')) return 'URGENT_CARE'
    if (text.includes('CONTACT_DOCTOR_TODAY')) return 'CONTACT_DOCTOR_TODAY'
    if (text.includes('MONITOR_AT_HOME')) return 'MONITOR_AT_HOME'
    return 'CONTACT_DOCTOR_TODAY'
  })()

  const urgencyExplanation = get('URGENCY_EXPLANATION')

  // Differential
  const diffSection = get('DIFFERENTIAL')
  const differential = diffSection
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')
      const likelihoodMatch = cleaned.match(/^(HIGH|MODERATE|LOWER)[:\s-]+(.+?)[-–:]\s*(.+)$/i)
      if (likelihoodMatch) {
        return {
          likelihood: likelihoodMatch[1].toUpperCase(),
          name: likelihoodMatch[2].trim(),
          reason: likelihoodMatch[3].trim(),
        }
      }
      const altMatch = cleaned.match(/^(HIGH|MODERATE|LOWER)[:\s]+(.+)$/i)
      if (altMatch) {
        const parts = altMatch[2].split(/[-–:]/)
        return {
          likelihood: altMatch[1].toUpperCase(),
          name: parts[0]?.trim() || altMatch[2],
          reason: parts.slice(1).join(' ').trim() || '',
        }
      }
      return null
    })
    .filter(Boolean) as { likelihood: string; name: string; reason: string }[]

  // Red flags
  const flagSection = get('RED_FLAGS')
  const redFlags = flagSection
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const cleaned = line.replace(/^[-•]\s*/, '').replace(/\*\*/g, '')
      const match = cleaned.match(/^(.+?):\s*(PRESENT|ABSENT|UNKNOWN)/)
      if (match) return { flag: match[1].trim(), status: match[2] }
      if (cleaned.includes('PRESENT')) return { flag: cleaned.replace('PRESENT', '').replace(/[-:]/g, '').trim(), status: 'PRESENT' }
      if (cleaned.includes('ABSENT')) return { flag: cleaned.replace('ABSENT', '').replace(/[-:]/g, '').trim(), status: 'ABSENT' }
      if (cleaned.includes('UNKNOWN')) return { flag: cleaned.replace('UNKNOWN', '').replace(/[-:]/g, '').trim(), status: 'UNKNOWN' }
      return null
    })
    .filter(Boolean) as { flag: string; status: string }[]

  // Next steps
  const nextSteps = get('NEXT_STEPS').replace(/\*\*/g, '')

  // Follow-up prompts
  const followSection = get('FOLLOW_UP_PROMPTS')
  const followUpPrompts = followSection
    .split('\n')
    .filter(l => l.trim().match(/^\d+\.|^[-•]/))
    .slice(0, 3)
    .map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, '').replace(/"/g, '').trim())
    .filter(Boolean)

  // Disclaimer
  const disclaimerMatch = text.match(/OrixLink AI provides[\s\S]*?call 911\./)
  const disclaimer = disclaimerMatch ? disclaimerMatch[0] : 'OrixLink AI provides clinical support only. Not a diagnosis. If this is an emergency call 911.'

  return { urgencyLevel, urgencyExplanation, differential, redFlags, nextSteps, followUpPrompts, disclaimer }
}

// ─── Components ───────────────────────────────────────────────────────────────

function UrgencyBanner({ level, explanation }: { level: string; explanation: string }) {
  const cfg = URGENCY[level] || URGENCY.CONTACT_DOCTOR_TODAY
  return (
    <div className={`${cfg.bg} ${cfg.border} border-2 rounded-xl p-5 mb-4`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-4 h-4 rounded-full ${cfg.dot} flex-shrink-0`} />
        <span className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</span>
      </div>
      {explanation && (
        <p className={`${cfg.text} text-sm leading-relaxed opacity-90 ml-7`}>{explanation}</p>
      )}
    </div>
  )
}

function NextStepsCard({ steps }: { steps: string }) {
  if (!steps) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Next Steps</h3>
      <p className="text-slate-800 text-sm leading-relaxed font-medium">{steps}</p>
    </div>
  )
}

function DifferentialCard({ items }: { items: { likelihood: string; name: string; reason: string }[] }) {
  if (!items.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Most Likely Explanations</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const style = LIKELIHOOD_STYLE[item.likelihood] || LIKELIHOOD_STYLE.LOWER
          return (
            <div key={i} className={`border-l-4 ${style.border} pl-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {item.likelihood}
                </span>
                <span className="text-slate-800 text-sm font-semibold">{item.name}</span>
              </div>
              {item.reason && (
                <p className="text-slate-500 text-xs leading-relaxed">{item.reason}</p>
              )}
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Warning Signs</h3>
      <div className="space-y-2">
        {flags.map((item, i) => {
          const style = STATUS_STYLE[item.status] || STATUS_STYLE.UNKNOWN
          return (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center flex-shrink-0 ${style.color}`}>
                {style.icon}
              </span>
              <span className="text-slate-700 text-sm">{item.flag}</span>
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
      <p className="text-slate-500 text-xs leading-relaxed mt-2 mb-4">{assessment.disclaimer}</p>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }
  const assessment = parseAssessment(msg.content)
  const isStructured = assessment.differential.length > 0 || assessment.redFlags.length > 0
  if (isStructured) {
    return (
      <div className="mb-3">
        <AssessmentView assessment={assessment} />
      </div>
    )
  }
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
        {msg.content.replace(/\*\*/g, '')}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({
          messages: next,
          role: session.role,
          context: session.context,
          language: session.language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const updated = [...next, { role: 'assistant' as const, content: data.response }]
      setMessages(updated)
      const a = parseAssessment(data.response)
      setCurrentUrgency(a.urgencyLevel)
      setFollowUps(a.followUpPrompts)
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const urgencyCfg = URGENCY[currentUrgency] || URGENCY.CONTACT_DOCTOR_TODAY

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">OrixLink AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${urgencyCfg.bg} ${urgencyCfg.text} ${urgencyCfg.border}`}>
            <div className={`w-2 h-2 rounded-full ${urgencyCfg.dot}`} />
            {urgencyCfg.label}
          </div>
          <Link href="/assessment" className="text-sm text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-md transition-colors">
            New Assessment
          </Link>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full px-4 py-6">

        {/* Scrollable messages */}
        <div className="flex-1 overflow-y-auto pb-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-500">
                Updating assessment...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Follow-up chips */}
        {followUps.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
            {followUps.map((p, i) => (
              <button
                key={i}
                onClick={() => send(p)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Add a symptom, ask a question, or say what happened next..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Send
          </button>
        </div>

        <p className="text-slate-600 text-xs text-center mt-3">
          Nothing is final — OrixLink updates its assessment as new information arrives
        </p>
      </div>
    </main>
  )
}