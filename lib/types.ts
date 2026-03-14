export type Role = 'patient' | 'family' | 'clinician'

export type UrgencyLevel =
  | 'MONITOR_AT_HOME'
  | 'CONTACT_DOCTOR_TODAY'
  | 'URGENT_CARE'
  | 'EMERGENCY_DEPARTMENT_NOW'

export type ContextType =
  | 'recent_procedure'
  | 'chronic_condition'
  | 'new_symptoms'
  | 'injury'
  | 'pregnancy'
  | 'pediatric'
  | 'mental_health'
  | 'other'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type AssessmentSession = {
  id: string
  role: Role
  context: ContextType
  language: string
  urgency_level: UrgencyLevel | null
  messages: Message[]
  created_at: string
}

export const URGENCY_CONFIG = {
  MONITOR_AT_HOME: {
    label: 'Monitor at Home',
    color: 'green',
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  CONTACT_DOCTOR_TODAY: {
    label: 'Contact Doctor Today',
    color: 'yellow',
    border: 'border-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
  },
  URGENT_CARE: {
    label: 'Urgent Care',
    color: 'orange',
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
  },
  EMERGENCY_DEPARTMENT_NOW: {
    label: 'Emergency Department — Now',
    color: 'red',
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
}

export const CONTEXT_LABELS: Record<ContextType, string> = {
  recent_procedure: 'Recent procedure or hospitalization',
  chronic_condition: 'Known condition or chronic diagnosis',
  new_symptoms: 'New symptoms — no known cause',
  injury: 'Injury or accident',
  pregnancy: 'Pregnancy-related',
  pediatric: "Child's symptoms",
  mental_health: 'Mental health or medication concern',
  other: 'Other',
}