import { createBrowserClient } from "@supabase/ssr";

/* JWT expiry: set to 8 hours in the Supabase Dashboard (Auth → JWT expiry).
   createBrowserClient defaults: autoRefreshToken, persistSession, detectSessionInUrl — leave as default. */

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzUyODAwMDAsImV4cCI6MTk1MDg1NjAwMH0.placeholder";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_KEY
  );
}
