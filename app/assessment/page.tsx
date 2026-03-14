'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ROLES = [
  { id: 'clinician', label: 'Medical Professional', desc: 'Nurse, PA, NP, MD' },
  { id: 'family', label: 'Family or Caregiver', desc: 'Helping someone else' },
  { id: 'patient', label: 'Patient', desc: 'My own symptoms' },
]

const CONTEXTS = [
  { id: 'recent_procedure', label: 'Recent procedure or hospitalization' },
  { id: 'chronic_condition', label: 'Known condition or chronic diagnosis' },
  { id: 'new_symptoms', label: 'New symptoms — no known cause' },
  { id: 'injury', label: 'Injury or accident' },
  { id: 'pregnancy', label: 'Pregnancy-related' },
  { id: 'pediatric', label: "Child's symptoms" },
  { id: 'mental_health', label: 'Mental health or medication concern' },
  { id: 'other', label: 'Other' },
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
          role,
          context,
          language,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Assessment failed')

      sessionStorage.setItem('orixlink_response', data.response)
      sessionStorage.setItem('orixlink_session', JSON.stringify({
        role, context, language, patientAge, symptoms
      }))

      router.push('/assessment/results')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">OrixLink AI</span>
        </Link>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className={step >= 1 ? 'text-teal-400 font-medium' : ''}>Who</span>
          <span>—</span>
          <span className={step >= 2 ? 'text-teal-400 font-medium' : ''}>Situation</span>
          <span>—</span>
          <span className={step >= 3 ? 'text-teal-400 font-medium' : ''}>Symptoms</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* STEP 1 — Role */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Who is asking?</h1>
            <p className="text-slate-400 mb-8">OrixLink adapts its language and depth to you.</p>
            <div className="space-y-3 mb-8">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    role === r.id
                      ? 'border-teal-500 bg-teal-950'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <div className="font-medium">{r.label}</div>
                  <div className="text-slate-400 text-sm mt-1">{r.desc}</div>
                </button>
              ))}
            </div>
            {(role === 'patient' || role === 'family') && (
              <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Output Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                        language === lang
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
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
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — Context */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">What best describes the situation?</h1>
            <p className="text-slate-400 mb-8">Choose the closest match. Nothing is excluded.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CONTEXTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContext(c.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    context === c.id
                      ? 'border-teal-500 bg-teal-950'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <div className="text-sm font-medium">{c.label}</div>
                </button>
              ))}
            </div>

            {(context === 'recent_procedure') && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Procedure name and days since
                </label>
                <input
                  type="text"
                  value={contextDetail}
                  onChange={(e) => setContextDetail(e.target.value)}
                  placeholder="e.g. Cardiac catheterization, Day 7"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {(context === 'chronic_condition') && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Condition name
                </label>
                <input
                  type="text"
                  value={contextDetail}
                  onChange={(e) => setContextDetail(e.target.value)}
                  placeholder="e.g. Heart failure, Type 2 diabetes"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {(context === 'injury') && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  What happened and when
                </label>
                <input
                  type="text"
                  value={contextDetail}
                  onChange={(e) => setContextDetail(e.target.value)}
                  placeholder="e.g. Fall onto right knee, 2 hours ago"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {(context === 'pregnancy') && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  How many weeks pregnant
                </label>
                <input
                  type="text"
                  value={contextDetail}
                  onChange={(e) => setContextDetail(e.target.value)}
                  placeholder="e.g. 34 weeks"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-slate-700 rounded-md text-slate-300 hover:border-slate-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Symptoms */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Describe what is happening</h1>
            <p className="text-slate-400 mb-8">Use your own words. No medical knowledge required.</p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Patient age and sex <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g. 38-year-old male"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Symptoms <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe what you are seeing or feeling. The more detail the better."
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  How long have symptoms been present
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, worsening since yesterday"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Anything making it better or worse <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={modifiers}
                  onChange={(e) => setModifiers(e.target.value)}
                  placeholder="e.g. Worse when hanging down, better when elevated"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Current medications <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="e.g. Aspirin, Plavix, metoprolol"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-slate-700 rounded-md text-slate-300 hover:border-slate-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium transition-colors"
              >
                {loading ? 'Running assessment...' : 'Run OrixLink Assessment'}
              </button>
            </div>

            <p className="text-slate-600 text-xs text-center mt-4">
              OrixLink AI provides clinical support information only. Not a diagnosis. If this is an emergency call 911.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}