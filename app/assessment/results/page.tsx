'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const URGENCY: Record<string, { label: string; border: string; bg: string; text: string; dot: string }> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: 'Emergency Department — Now',
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  URGENT_CARE: {
    label: 'Urgent Care',
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  CONTACT_DOCTOR_TODAY: {
    label: 'Contact Doctor Today',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
  },
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
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

function parseAssessment(text: string): ParsedAssessment {
  // Urgency level
  const urgencyLevel = (() => {
    if (text.includes('EMERGENCY_DEPARTMENT_NOW')) return 'EMERGENCY_DEPARTMENT_NOW'
    if (text.includes('URGENT_CARE')) return 'URGENT_CARE'
    if (text.includes('CONTACT_DOCTOR_TODAY')) return 'CONTACT_DOCTOR_TODAY'
    if (text.includes('MONITOR_AT_HOME')) return 'MONITOR_AT_HOME'
    return 'CONTACT_DOCTOR_TODAY'
  })()

  // Helper to extract section content
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

  // Differential
  const diffSection = getSection('DIFFERENTIAL')
  const differential = diffSection
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const clean = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
      const m = clean.match(/^(HIGH|MODERATE|LOWER)[:\s*-]+(.+?)(?:\s*[-–:]\s*(.+))?$/i)
      if (m) {
        const nameParts = m[2].trim()
        const reason = m[3]?.trim() || ''
        return { likelihood: m[1].toUpperCase(), name: nameParts, reason }
      }
      return null
    })
    .filter(Boolean) as { likelihood: string; name: string; reason: string }[]

  // Red flags
  const flagSection = getSection('RED_FLAGS')
  const redFlags = flagSection
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const clean = line.replace(/^[-•]\s*/, '').replace(/\*\*/g, '').trim()
      const m = clean.match(/^(.+?):\s*(PRESENT|ABSENT|UNKNOWN)\s*$/i)
      if (m) return { flag: m[1].trim(), status: m[2].toUpperCase() }
      if (clean.match(/PRESENT/i)) return { flag: clean.replace(/PRESENT/i, '').replace(/[-:]/g, '').trim(), status: 'PRESENT' }
      if (clean.match(/ABSENT/i)) return { flag: clean.replace(/ABSENT/i, '').replace(/[-:]/g, '').trim(), status: 'ABSENT' }
      if (clean.match(/UNKNOWN/i)) return { flag: clean.replace(/UNKNOWN/i, '').replace(/[-:]/g, '').trim(), status: 'UNKNOWN' }
      return null
    })
    .filter(f => f && f.flag.length > 2) as { flag: string; status: string }[]

  // Next steps
  const nextSteps = getSection('NEXT_STEPS').replace(/\*\*/g, '').trim()

  // Follow-up prompts — multiple parsing strategies
  const followUpPrompts = (() => {
    const section = getSection('FOLLOW_UP_PROMPTS')
    if (!section) {
      // Try direct regex on full text
      const directMatch = text.match(/FOLLOW_UP_PROMPTS[:\s*]+\n?([\s\S]*?)(?=\n\*{0,2}[A-Z]|OrixLink AI provides|$)/i)
      if (!directMatch) return []
      const lines = directMatch[1].split('\n').filter(l => l.trim())
      return lines
        .map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, '').replace(/"/g, '').replace(/\*\*/g, '').trim())
        .filter(l => l.length > 5)
        .slice(0, 3)
    }
    return section
      .split('\n')
      .filter(l => l.trim())
      .map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, '').replace(/"/g, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 5)
      .slice(0, 3)
  })()

  // Disclaimer
  const disclaimerMatch = text.match(/OrixLink AI provides[\s\S]*?call 911\./)
  const disclaimer = disclaimerMatch?.[0] || 'OrixLink AI provides clinical support only. Not a diagnosis. If this is an emergency call 911.'

  return { urgencyLevel, urgencyExplanation, differential, redFlags, nextSteps, followUpPrompts, disclaimer }
}

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
      <p className="text-slate-800 text-sm leading-relaxed">{steps}</p>
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{item.likelihood}</span>
                <span className="text-slate-800 text-sm font-semibold">{item.name}</span>
              </div>
              {item.reason && <p className="text-slate-500 text-xs leading-relaxed">{item.reason}</p>}
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
      <div className="flex justify-end mb-4">
        <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }
  const assessment = parseAssessment(msg.content)
  const isStructured = assessment.differential.length > 0 || assessment.redFlags.length > 0
  if (isStructured) {
    return <div className="mb-4"><AssessmentView assessment={assessment} /></div>
  }
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
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
        body: JSON.stringify({
          messages: next,
          role: session.role,
          context: session.context,
          language: session.language,
        }),
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
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
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

      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex-1 overflow-y-auto pb-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-500">
                Updating assessment...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {followUps.length > 0 && !loading && (
          <div className="mb-3 flex-shrink-0">
            <p className="text-xs text-slate-500 mb-2">Tap to add to the assessment:</p>
            <div className="flex flex-wrap gap-2">
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
          </div>
        )}

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