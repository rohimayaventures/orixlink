'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const URGENCY_CONFIG: Record<string, { label: string; border: string; bg: string; text: string; badge: string }> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: 'Emergency Department — Now',
    border: 'border-red-500',
    bg: 'bg-red-950',
    text: 'text-red-200',
    badge: 'bg-red-500',
  },
  URGENT_CARE: {
    label: 'Urgent Care',
    border: 'border-orange-500',
    bg: 'bg-orange-950',
    text: 'text-orange-200',
    badge: 'bg-orange-500',
  },
  CONTACT_DOCTOR_TODAY: {
    label: 'Contact Doctor Today',
    border: 'border-yellow-500',
    bg: 'bg-yellow-950',
    text: 'text-yellow-200',
    badge: 'bg-yellow-500',
  },
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
    border: 'border-green-500',
    bg: 'bg-green-950',
    text: 'text-green-200',
    badge: 'bg-green-500',
  },
}

function parseUrgency(text: string): string {
  if (text.includes('EMERGENCY_DEPARTMENT_NOW')) return 'EMERGENCY_DEPARTMENT_NOW'
  if (text.includes('URGENT_CARE')) return 'URGENT_CARE'
  if (text.includes('CONTACT_DOCTOR_TODAY')) return 'CONTACT_DOCTOR_TODAY'
  if (text.includes('MONITOR_AT_HOME')) return 'MONITOR_AT_HOME'
  return 'CONTACT_DOCTOR_TODAY'
}

function parseFollowUps(text: string): string[] {
  const match = text.match(/FOLLOW_UP_PROMPTS[\s\S]*?(?:\n)([\s\S]*?)(?:\n\*|$)/)
  if (!match) return []
  const lines = match[1].split('\n').filter(l => l.trim().match(/^\d+\.|^-/))
  return lines.slice(0, 3).map(l => l.replace(/^\d+\.\s*|^-\s*/, '').replace(/"/g, '').trim())
}

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [session, setSession] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [urgency, setUrgency] = useState('')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedResponse = sessionStorage.getItem('orixlink_response')
    const savedSession = sessionStorage.getItem('orixlink_session')

    if (!savedResponse) {
      router.push('/assessment')
      return
    }

    const parsed = savedSession ? JSON.parse(savedSession) : {}
    setSession(parsed)
    setResponse(savedResponse)
    setUrgency(parseUrgency(savedResponse))
    setFollowUps(parseFollowUps(savedResponse))
    setMessages([
      { role: 'user', content: `${parsed.symptoms || 'Initial assessment'}` },
      { role: 'assistant', content: savedResponse },
    ])
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendFollowUp(text: string) {
    if (!text.trim() || loading) return
    setLoading(true)
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          role: session.role,
          context: session.context,
          language: session.language,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMessage: Message = { role: 'assistant', content: data.response }
      const updated = [...newMessages, assistantMessage]
      setMessages(updated)
      setUrgency(parseUrgency(data.response))
      setFollowUps(parseFollowUps(data.response))
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const urgencyConfig = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.CONTACT_DOCTOR_TODAY

  if (!response) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading assessment...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">OrixLink AI</span>
        </Link>
        <Link
          href="/assessment"
          className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 px-3 py-1.5 rounded-md"
        >
          New Assessment
        </Link>
      </nav>

      <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6 py-6 gap-6">

        {/* Left — conversation */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Urgency banner */}
          <div className={`border ${urgencyConfig.border} ${urgencyConfig.bg} rounded-lg p-4 mb-4 flex items-center gap-4 flex-shrink-0`}>
            <div className={`w-3 h-3 rounded-full ${urgencyConfig.badge} flex-shrink-0`} />
            <div>
              <div className={`font-bold text-lg ${urgencyConfig.text}`}>{urgencyConfig.label}</div>
              <div className="text-slate-400 text-sm">Updates as conversation continues</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-400">
                  Updating assessment...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Follow-up suggestions */}
          {followUps.length > 0 && !loading && (
            <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
              {followUps.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendFollowUp(prompt)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt}
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
              onKeyDown={(e) => e.key === 'Enter' && sendFollowUp(input)}
              placeholder="Add a symptom, ask a question, or say what happened next..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
            />
            <button
              onClick={() => sendFollowUp(input)}
              disabled={!input.trim() || loading}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-5 py-3 rounded-md font-medium transition-colors text-sm"
            >
              Send
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center mt-3">
            OrixLink AI provides clinical support only. Not a diagnosis. If this is an emergency call 911.
          </p>
        </div>

        {/* Right — live sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">

          {/* Current urgency */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current Urgency</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${urgencyConfig.bg} ${urgencyConfig.text} border ${urgencyConfig.border}`}>
              <div className={`w-2 h-2 rounded-full ${urgencyConfig.badge}`} />
              {urgencyConfig.label}
            </div>
          </div>

          {/* Session info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Session</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="text-slate-200 capitalize">{session.role || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Language</span>
                <span className="text-slate-200">{session.language || 'English'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Messages</span>
                <span className="text-slate-200">{messages.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
                  navigator.clipboard.writeText(text)
                }}
                className="w-full text-left text-sm text-slate-300 hover:text-white py-2 px-3 rounded-md hover:bg-slate-800 transition-colors"
              >
                Copy conversation
              </button>
              <Link
                href="/assessment"
                className="block text-sm text-slate-300 hover:text-white py-2 px-3 rounded-md hover:bg-slate-800 transition-colors"
              >
                Start new assessment
              </Link>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Nothing is final. OrixLink updates its assessment as new information arrives.
          </div>
        </div>
      </div>
    </main>
  )
}