'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActivityLogIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Cross2Icon,
  PersonIcon,
} from '@radix-ui/react-icons'

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

const LANGUAGES = ['English', 'Español', '中文', 'Français', 'Português', 'العربية']

export default function AssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [context, setContext] = useState('')
  const [contextDetail, setContextDetail] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [modifiers, setModifiers] = useState('')
  const [medications, setMedications] = useState('')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canProceedStep1 = role !== ''
  const canProceedStep2 = context !== ''
  const canSubmit = symptoms.trim().length > 10 && patientAge.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    const contextInfo = contextDetail ? `${context}: ${contextDetail}` : context
    const userMessage = `
Role: ${role}
Situation: ${contextInfo}
Patient: ${patientAge}
Symptoms: ${symptoms}
${duration ? `Duration: ${duration}` : ''}
${modifiers ? `Better or worse with: ${modifiers}` : ''}
${medications ? `Current medications: ${medications}` : ''}
Language preference: ${language}
    `.trim()

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          role, context, language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Assessment failed')
      sessionStorage.setItem('orixlink_response', data.response)
      sessionStorage.setItem('orixlink_session', JSON.stringify({
        role, context, language, patientAge, symptoms
      }))
      router.push('/assessment/results')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--cream-warm)',
    border: '1.5px solid var(--cream-border)',
    borderRadius: 8,
    fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem',
    color: 'var(--text-on-light)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.6875rem',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted-light)',
    marginBottom: '0.5rem',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--cream-border)',
        background: 'var(--clinical-white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted-light)', fontSize: '0.8125rem',
            padding: '6px 10px', borderRadius: 6,
          }}
        >
          <Cross2Icon style={{ width: 12, height: 12 }} />
          Exit
        </button>
      </nav>

      {/* ── Gold progress bar ── */}
      <div style={{ height: 3, background: 'var(--cream-border)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${(step / 3) * 100}%`,
          background: 'var(--gold)',
          transition: 'width 0.5s cubic-bezier(0.23,1,0.32,1)',
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px 80px',
      }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'complete' : ''}`} />
            ))}
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted-light)', letterSpacing: '0.08em', marginLeft: 4 }}>
              Step {step} of 3
            </span>
          </div>

          {/* ── STEP 1 — Role ── */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--text-on-light)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                Who is asking?
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted-light)', marginBottom: '2rem', fontWeight: 300 }}>
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
                      border: `1.5px solid ${role === r.id ? 'var(--gold)' : 'var(--cream-border)'}`,
                      background: role === r.id ? 'var(--gold-dim)' : 'var(--clinical-white)',
                      cursor: 'pointer',
                      boxShadow: role === r.id ? 'var(--shadow-gold)' : 'none',
                      transition: 'all 0.2s var(--ease-smooth)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${role === r.id ? 'var(--gold)' : 'var(--cream-border)'}`,
                      background: role === r.id ? 'rgba(200,169,110,0.15)' : 'var(--clinical-grey)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PersonIcon style={{ width: 15, height: 15, color: role === r.id ? 'var(--gold)' : 'var(--text-muted-light)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-on-light)', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted-light)', fontWeight: 300 }}>{r.desc}</div>
                    </div>
                    {role === r.id && (
                      <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>

              {(role === 'patient' || role === 'family') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Output Language</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        style={{
                          padding: '7px 14px', borderRadius: 6, fontSize: '0.875rem',
                          border: `1.5px solid ${language === lang ? 'var(--gold)' : 'var(--cream-border)'}`,
                          background: language === lang ? 'var(--gold-dim)' : 'var(--clinical-white)',
                          color: language === lang ? 'var(--gold)' : 'var(--text-muted-light)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="btn-gold"
                style={{ width: '100%', opacity: canProceedStep1 ? 1 : 0.4, cursor: canProceedStep1 ? 'pointer' : 'not-allowed' }}
              >
                Continue <ArrowRightIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          {/* ── STEP 2 — Context ── */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--text-on-light)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                What best describes the situation?
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted-light)', marginBottom: '2rem', fontWeight: 300 }}>
                Choose the closest match. Nothing is excluded.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
                {CONTEXTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContext(c.id)}
                    style={{
                      padding: '16px 18px', borderRadius: 10, textAlign: 'left',
                      border: `1.5px solid ${context === c.id ? 'var(--gold)' : 'var(--cream-border)'}`,
                      background: context === c.id ? 'var(--gold-dim)' : 'var(--clinical-white)',
                      cursor: 'pointer',
                      boxShadow: context === c.id ? 'var(--shadow-gold)' : 'none',
                      transition: 'all 0.2s var(--ease-smooth)',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-on-light)', marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted-light)', fontWeight: 300 }}>{c.sub}</div>
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
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(1)}
                  className="btn-ghost-gold"
                  style={{ flexShrink: 0 }}
                >
                  <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="btn-gold"
                  style={{ flex: 1, opacity: canProceedStep2 ? 1 : 0.4, cursor: canProceedStep2 ? 'pointer' : 'not-allowed' }}
                >
                  Continue <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Symptoms ── */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--text-on-light)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                Describe what is happening.
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted-light)', marginBottom: '2rem', fontWeight: 300 }}>
                Use your own words. No medical knowledge required.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: '1.5rem' }}>

                <div>
                  <label style={labelStyle}>Patient age and sex <span style={{ color: 'var(--urgent-high)' }}>*</span></label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 38-year-old male"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Symptoms <span style={{ color: 'var(--urgent-high)' }}>*</span></label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe what you are seeing or feeling. Location, severity, onset. The more detail the better."
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted-light)', fontFamily: 'var(--font-mono)' }}>
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
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Anything making it better or worse <span style={{ color: 'var(--text-muted-light)', fontStyle: 'italic' }}>(optional)</span></label>
                  <input
                    type="text"
                    value={modifiers}
                    onChange={(e) => setModifiers(e.target.value)}
                    placeholder="e.g. Worse when hanging down, better when elevated"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Current medications <span style={{ color: 'var(--text-muted-light)', fontStyle: 'italic' }}>(optional)</span></label>
                  <input
                    type="text"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="e.g. Aspirin, Plavix, metoprolol"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.12)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              {/* Emergency notice */}
              <div className="urgency-critical" style={{ padding: '12px 16px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.5rem' }}>
                <strong>Life-threatening emergency?</strong> Chest pain, difficulty breathing, stroke symptoms — call 911 immediately.
              </div>

              {error && (
                <div style={{ background: 'var(--urgent-critical-bg)', border: '1px solid var(--urgent-critical)', color: 'var(--urgent-critical)', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(2)}
                  className="btn-ghost-gold"
                  style={{ flexShrink: 0 }}
                >
                  <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="btn-gold"
                  style={{ flex: 1, opacity: canSubmit && !loading ? 1 : 0.4, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed' }}
                >
                  {loading ? 'Running assessment...' : 'Run OrixLink Assessment'}
                  {!loading && <ArrowRightIcon style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted-light)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
                OrixLink provides clinical support only. Not a diagnosis. Emergency? Call 911.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
