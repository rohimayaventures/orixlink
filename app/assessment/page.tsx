'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import HeaderAuth from '@/components/HeaderAuth'
import {
  ModelBadge,
  ModelBadgeFreeUpgradeLink,
} from '@/components/ModelBadge'
import { useSubscriptionUsage } from '@/components/SubscriptionUsageProvider'
import CapReachedPrompt, {
  type CapReachedPayload,
} from '@/components/CapReachedPrompt'
import {
  hasUsedAnonAssessment,
  markAnonAssessmentUsed,
} from '@/lib/anonSession'
import {
  ActivityLogIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Cross2Icon,
  PersonIcon,
} from '@radix-ui/react-icons'
import {
  LANGUAGES,
  TIER_COPY,
  DEFAULT_LANGUAGE_CODE,
  getClinicalTier,
  LANGUAGE_PROMPT_NAMES,
} from '@/lib/outputLanguages'

const ROLES = [
  { id: 'clinician', label: 'Medical Professional', desc: 'Nurse, PA, NP, MD' },
  { id: 'family', label: 'Family or Caregiver', desc: 'Helping someone else' },
  { id: 'patient', label: 'Patient', desc: 'My own symptoms' },
]

const CONTEXTS = [
  { id: 'recent_procedure', label: 'Recent procedure', sub: 'Post-surgery or hospitalization' },
  { id: 'chronic_condition', label: 'Chronic condition', sub: 'Known diagnosis flaring' },
  { id: 'new_symptoms', label: 'New symptoms', sub: 'No known cause' },
  { id: 'injury', label: 'Injury or accident', sub: 'Trauma or fall' },
  { id: 'pregnancy', label: 'Pregnancy', sub: 'Currently pregnant' },
  { id: 'pediatric', label: "Child's symptoms", sub: 'Under 18 years old' },
  { id: 'mental_health', label: 'Mental health', sub: 'Emotional or medication concern' },
  { id: 'other', label: 'Other', sub: 'Something else entirely' },
]

const ASSESSMENT_DRAFT_KEY = 'orixlink_assessment_draft'

function buildAssessFingerprint(): string {
  return btoa(
    [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|'),
  ).slice(0, 32)
}

export default function AssessmentPage() {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const { tier: subscriptionTier } = useSubscriptionUsage()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [context, setContext] = useState('')
  const [contextDetail, setContextDetail] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [modifiers, setModifiers] = useState('')
  const [medications, setMedications] = useState('')
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE_CODE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [capPayload, setCapPayload] = useState<CapReachedPayload | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [draftHydrated, setDraftHydrated] = useState(false)

  useEffect(() => {
    sessionStorage.removeItem('orixlink_session_id')
    setSessionId(null)
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ASSESSMENT_DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>
        if (typeof d.step === 'number' && d.step >= 1 && d.step <= 3) {
          setStep(d.step)
        }
        if (typeof d.role === 'string') setRole(d.role)
        if (typeof d.context === 'string') setContext(d.context)
        if (typeof d.contextDetail === 'string') setContextDetail(d.contextDetail)
        if (typeof d.patientAge === 'string') setPatientAge(d.patientAge)
        if (typeof d.symptoms === 'string') setSymptoms(d.symptoms)
        if (typeof d.duration === 'string') setDuration(d.duration)
        if (typeof d.modifiers === 'string') setModifiers(d.modifiers)
        if (typeof d.medications === 'string') setMedications(d.medications)
        if (typeof d.language === 'string') setLanguage(d.language)
      }
    } catch {
      /* ignore corrupt draft */
    }
    setDraftHydrated(true)
  }, [])

  useEffect(() => {
    if (!draftHydrated) return
    try {
      sessionStorage.setItem(
        ASSESSMENT_DRAFT_KEY,
        JSON.stringify({
          step,
          role,
          context,
          contextDetail,
          patientAge,
          symptoms,
          duration,
          modifiers,
          medications,
          language,
        })
      )
    } catch {
      /* ignore quota */
    }
  }, [
    step,
    role,
    context,
    contextDetail,
    patientAge,
    symptoms,
    duration,
    modifiers,
    medications,
    language,
    draftHydrated,
  ])

  function clearAssessmentDraft() {
    try {
      sessionStorage.removeItem(ASSESSMENT_DRAFT_KEY)
    } catch {
      /* ignore */
    }
  }

  function handleStartOver() {
    setStep(1)
    setRole('')
    setContext('')
    setContextDetail('')
    setPatientAge('')
    setSymptoms('')
    setDuration('')
    setModifiers('')
    setMedications('')
    setLanguage(DEFAULT_LANGUAGE_CODE)
    clearAssessmentDraft()
  }

  const canProceedStep1 = role !== ''
  const canProceedStep2 = context !== ''
  const canSubmit = symptoms.trim().length > 10 && patientAge.trim().length > 0

  const anonGate = !user && hasUsedAnonAssessment()

  useEffect(() => {
    if (anonGate) openAuthModal()
  }, [anonGate, openAuthModal])

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setCapPayload(null)
    const contextInfo = contextDetail ? `${context}: ${contextDetail}` : context
    const userMessage = `
Role: ${role}
Situation: ${contextInfo}
Patient: ${patientAge}
Symptoms: ${symptoms}
${duration ? `Duration: ${duration}` : ''}
${modifiers ? `Better or worse with: ${modifiers}` : ''}
${medications ? `Current medications: ${medications}` : ''}
Response language code: ${language} (${LANGUAGE_PROMPT_NAMES[language] ?? language})
    `.trim()

    try {
      const fingerprint = buildAssessFingerprint()
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          role, context, language,
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
      })
      const data = await res.json()
      if (
        res.status === 402 &&
        data?.error === 'cap_reached'
      ) {
        setCapPayload(data as CapReachedPayload)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Assessment failed')
      if (!user) markAnonAssessmentUsed()
      if (typeof data.session_id === 'string' && data.session_id) {
        setSessionId(data.session_id)
        sessionStorage.setItem('orixlink_session_id', data.session_id)
      }
      if (data.historyWarning === true) {
        sessionStorage.setItem('orixlink_history_warning', '1')
      } else {
        sessionStorage.removeItem('orixlink_history_warning')
      }
      sessionStorage.setItem('orixlink_response', data.response)
      sessionStorage.setItem('orixlink_session', JSON.stringify({
        role, context, language, patientAge, symptoms
      }))
      clearAssessmentDraft()
      router.push('/assessment/results')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const BG_PAGE = '#080C14'
  const BG_FORM = '#0D1220'
  const BORDER_FORM = '1px solid rgba(255,255,255,0.07)'
  const TEXT = '#F4EFE6'
  const MUTED = 'rgba(244,239,230,0.5)'
  const GOLD = '#C8A96E'

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#141824',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem',
    color: TEXT,
    transition: 'border-color 0.2s',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: '0.6875rem',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: MUTED,
    marginBottom: '0.5rem',
  }

  if (anonGate) {
    return (
      <main style={{ minHeight: '100vh', background: BG_PAGE, display: 'flex', flexDirection: 'column' }}>
        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6 sm:py-4"
          style={{ background: BG_PAGE }}
        >
          <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2 sm:gap-2.5">
            <ActivityLogIcon style={{ color: GOLD, width: 20, height: 20, flexShrink: 0 }} />
            <span className="font-display max-[380px]:hidden truncate text-[1.0625rem] font-medium" style={{ color: TEXT }}>
              OrixLink <span style={{ color: GOLD }}>AI</span>
            </span>
          </div>
          <div className="flex min-w-0 flex-[1_1_auto] flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:flex-none sm:gap-x-4">
            <HeaderAuth variant="dark" omitPricing />
            <button
              type="button"
              onClick={handleStartOver}
              className="min-h-[40px] px-2 sm:min-h-0"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: GOLD,
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-body), sans-serif',
                textDecoration: 'underline',
              }}
            >
              Start over
            </button>
            <button
              type="button"
              onClick={() => {
                clearAssessmentDraft()
                router.push('/')
              }}
              className="inline-flex min-h-[40px] items-center gap-1.5 px-2 sm:min-h-0"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: MUTED, fontSize: '0.8125rem',
                borderRadius: 6,
              }}
            >
              <Cross2Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
              Exit
            </button>
          </div>
        </nav>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center', maxWidth: 440, margin: '0 auto',
        }}>
          <div style={{ background: BG_FORM, border: BORDER_FORM, borderRadius: 12, padding: '2rem', width: '100%' }}>
            <h1 className="font-display" style={{ fontSize: '1.75rem', marginBottom: '1rem', color: TEXT }}>
              Sign in to run another assessment
            </h1>
            <p style={{ color: MUTED, marginBottom: '1.5rem', lineHeight: 1.6 }}>
              You have used your free anonymous assessment. Sign in to save results and continue with your included assessments.
            </p>
            <button type="button" onClick={openAuthModal} className="orix-btn-gold" style={{ marginBottom: 12, width: '100%', padding: '14px 20px', borderRadius: 8 }}>
              Sign in or create account
            </button>
            <button
              type="button"
              onClick={() => {
                clearAssessmentDraft()
                router.push('/')
              }}
              className="orix-btn-outline"
              style={{ width: '100%', padding: '12px 20px', borderRadius: 8, fontWeight: 600 }}
            >
              Back to home
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: BG_PAGE, display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav
        className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6 sm:py-4"
        style={{ background: BG_PAGE }}
      >
        <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2 sm:gap-2.5">
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1.5px solid rgba(200,169,110,0.35)', background: 'rgba(200,169,110,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ActivityLogIcon style={{ color: GOLD, width: 13, height: 13 }} />
          </div>
          <span className="font-display max-[380px]:hidden truncate text-[1.0625rem] font-medium" style={{ color: TEXT }}>
            OrixLink <span style={{ color: GOLD }}>AI</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_auto] flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:flex-none sm:gap-x-4">
          <HeaderAuth variant="dark" omitPricing />
          <button
            type="button"
            onClick={handleStartOver}
            className="min-h-[40px] px-2 sm:min-h-0"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: GOLD,
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body), sans-serif',
              textDecoration: 'underline',
            }}
          >
            Start over
          </button>
          <button
            type="button"
            onClick={() => {
              clearAssessmentDraft()
              router.push('/')
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 px-2 sm:min-h-0"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: MUTED, fontSize: '0.8125rem',
              borderRadius: 6,
            }}
          >
            <Cross2Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
            Exit
          </button>
        </div>
      </nav>

      {/* ── Gold progress bar ── */}
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${(step / 3) * 100}%`,
          background: GOLD,
          borderRadius: 4,
          transition: 'width 0.5s cubic-bezier(0.23,1,0.32,1)',
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px 80px',
      }}>
        <div style={{ width: '100%', maxWidth: 600, background: BG_FORM, border: BORDER_FORM, borderRadius: 12, padding: '28px 24px 32px' }}>

          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'complete' : ''}`} />
            ))}
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.08em', marginLeft: 4 }}>
              Step {step} of 3
            </span>
          </div>

          {/* ── STEP 1 — Role ── */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: '#F4EFE6', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                Who is asking?
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(244,239,230,0.5)', marginBottom: '2rem', fontWeight: 300 }}>
                OrixLink adapts its language and depth to you.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '18px 20px', borderRadius: 10, textAlign: 'left',
                      border: `1px solid ${role === r.id ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      background: role === r.id ? 'rgba(200,169,110,0.1)' : '#141824',
                      cursor: 'pointer',
                      transition: 'all 0.2s var(--ease-smooth)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${role === r.id ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      background: role === r.id ? 'rgba(200,169,110,0.12)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PersonIcon style={{ width: 15, height: 15, color: role === r.id ? GOLD : 'rgba(244,239,230,0.5)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#F4EFE6', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(244,239,230,0.5)', fontWeight: 300 }}>{r.desc}</div>
                    </div>
                    {role === r.id && (
                      <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="orixlink-output-language" style={labelStyle}>
                  Response language ({LANGUAGES.length} languages)
                </label>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(244,239,230,0.5)', marginBottom: '0.5rem', fontWeight: 300, lineHeight: 1.5 }}>
                  Same list for every role — patient, family or caregiver, or medical professional. OrixLink writes the assessment in the language you pick (clinical depth and terminology still follow the role you selected). App screens stay in English. Some languages show an extra accuracy notice; emergency-level results also show a fixed English line when the response language is moderate or low confidence.
                </p>
                <select
                  id="orixlink-output-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    appearance: 'auto',
                    WebkitAppearance: 'menulist',
                  }}
                >
                  {LANGUAGES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {getClinicalTier(language) === 'moderate' && (
                  <p style={{
                    marginTop: '0.75rem', fontSize: '0.8125rem', lineHeight: 1.55, color: '#D4882A',
                    padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(212,136,42,0.35)', background: 'rgba(212,136,42,0.08)',
                  }}>
                    {TIER_COPY.moderate}
                  </p>
                )}
                {getClinicalTier(language) === 'low' && (
                  <p style={{
                    marginTop: '0.75rem', fontSize: '0.8125rem', lineHeight: 1.55, color: '#C0392B',
                    padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(192,57,43,0.35)', background: 'rgba(192,57,43,0.08)',
                  }}>
                    {TIER_COPY.low}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="orix-btn-gold"
                style={{
                  width: '100%', opacity: canProceedStep1 ? 1 : 0.4, cursor: canProceedStep1 ? 'pointer' : 'not-allowed',
                  padding: '14px 20px', borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Continue <ArrowRightIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          {/* ── STEP 2 — Context ── */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: '#F4EFE6', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                What best describes the situation?
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(244,239,230,0.5)', marginBottom: '2rem', fontWeight: 300 }}>
                Choose the closest match. Nothing is excluded.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
                {CONTEXTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContext(c.id)}
                    style={{
                      padding: '16px 18px', borderRadius: 10, textAlign: 'left',
                      border: `1px solid ${context === c.id ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      background: context === c.id ? 'rgba(200,169,110,0.1)' : '#141824',
                      cursor: 'pointer',
                      transition: 'all 0.2s var(--ease-smooth)',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F4EFE6', marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(244,239,230,0.5)', fontWeight: 300 }}>{c.sub}</div>
                  </button>
                ))}
              </div>

              {['recent_procedure', 'chronic_condition', 'injury', 'pregnancy'].includes(context) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>
                    {context === 'recent_procedure' && 'Procedure name and days since'}
                    {context === 'chronic_condition' && 'Condition name'}
                    {context === 'injury' && 'What happened and when'}
                    {context === 'pregnancy' && 'How many weeks pregnant'}
                  </label>
                  <input
                    type="text"
                    value={contextDetail}
                    onChange={(e) => setContextDetail(e.target.value)}
                    placeholder={
                      context === 'recent_procedure' ? 'e.g. Cardiac catheterization, Day 7' :
                      context === 'chronic_condition' ? 'e.g. Heart failure, Type 2 diabetes' :
                      context === 'injury' ? 'e.g. Fall onto right knee, 2 hours ago' :
                      'e.g. 34 weeks'
                    }
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="orix-btn-outline"
                  style={{
                    flexShrink: 0, padding: '12px 18px', borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  }}
                >
                  <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="orix-btn-gold"
                  style={{
                    flex: 1, opacity: canProceedStep2 ? 1 : 0.4, cursor: canProceedStep2 ? 'pointer' : 'not-allowed',
                    padding: '14px 20px', borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  Continue <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Symptoms ── */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: '#F4EFE6', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                Describe what is happening.
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(244,239,230,0.5)', marginBottom: '2rem', fontWeight: 300 }}>
                Use your own words. No medical knowledge required.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: '1.5rem' }}>

                <div>
                  <label style={labelStyle}>Patient age and sex <span style={{ color: '#F87171' }}>*</span></label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 38-year-old male"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Symptoms <span style={{ color: '#F87171' }}>*</span></label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe what you are seeing or feeling. Location, severity, onset. The more detail the better."
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(244,239,230,0.5)', fontFamily: 'var(--font-mono)' }}>
                    {symptoms.length} characters
                  </span>
                </div>

                <div>
                  <label style={labelStyle}>How long have symptoms been present</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 days, worsening since yesterday"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Anything making it better or worse <span style={{ color: 'rgba(244,239,230,0.5)', fontStyle: 'italic' }}>(optional)</span></label>
                  <input
                    type="text"
                    value={modifiers}
                    onChange={(e) => setModifiers(e.target.value)}
                    placeholder="e.g. Worse when hanging down, better when elevated"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Current medications <span style={{ color: 'rgba(244,239,230,0.5)', fontStyle: 'italic' }}>(optional)</span></label>
                  <input
                    type="text"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="e.g. Aspirin, Plavix, metoprolol"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Emergency notice */}
              <div style={{
                padding: '12px 16px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.5rem',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5',
              }}>
                <strong>Life-threatening emergency?</strong> Chest pain, difficulty breathing, stroke symptoms — call 911 immediately.
              </div>

              {capPayload && (
                <CapReachedPrompt
                  payload={capPayload}
                  onDismiss={() => setCapPayload(null)}
                  isAnonymous={!user}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                <ModelBadge tier={user ? subscriptionTier : 'free'} />
                {(!user || (subscriptionTier || 'free').toLowerCase() === 'free') && (
                  <ModelBadgeFreeUpgradeLink />
                )}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.45)', color: '#FCA5A5', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="orix-btn-outline"
                  style={{
                    flexShrink: 0, padding: '12px 18px', borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  }}
                >
                  <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="orix-btn-gold"
                  style={{
                    flex: 1, opacity: canSubmit && !loading ? 1 : 0.4, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                    padding: '14px 20px', borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? 'Running assessment...' : 'Run OrixLink Assessment'}
                  {!loading && <ArrowRightIcon style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'rgba(244,239,230,0.5)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
                OrixLink provides clinical support only. Not a diagnosis. Emergency? Call 911.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
