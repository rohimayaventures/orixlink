export type ParsedAssessment = {
  urgencyLevel: string
  urgencyExplanation: string
  differential: { likelihood: string; name: string; reason: string }[]
  redFlags: { flag: string; status: string }[]
  nextSteps: string
  followUpPrompts: string[]
  disclaimer: string
}

export function parseAssessment(text: string): ParsedAssessment {
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
