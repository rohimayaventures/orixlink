import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  sessions: {
    id: string
    user_id: string | null
    role: string
    context: string | null
    language: string
    urgency_level: string | null
    created_at: string
    updated_at: string
  }
  messages: {
    id: string
    session_id: string
    role: string
    content: string
    created_at: string
  }
  profiles: {
    id: string
    full_name: string | null
    is_admin: boolean
    created_at: string
  }
}