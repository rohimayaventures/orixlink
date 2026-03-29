# OrixLink AI
### Universal symptom triage & clinical guidance | Rohimaya Health AI

[![Live](https://img.shields.io/badge/Live-triage.rohimaya.ai-teal?style=flat-square)](https://triage.rohimaya.ai)
[![Built on Claude](https://img.shields.io/badge/Built%20on-Claude%20API-7c3aed?style=flat-square)](https://anthropic.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20Supabase-0d6e6e?style=flat-square)](https://nextjs.org)
[![Status](https://img.shields.io/badge/Status-Live%20March%202026-16a34a?style=flat-square)](https://triage.rohimaya.ai)

> **"Where every symptom finds its answer."**
> Any symptom. Any person. Any moment. No prior diagnosis required.

**Production:** https://triage.rohimaya.ai  
**Preview:** https://orixlink.vercel.app (when deployed)

---

## What OrixLink AI Does

OrixLink AI is a universal clinical triage and structured assessment product built on the Claude API. It works for anyone — a nurse assessing a post-op complication, a family member at 2am with a sick child, a patient who doesn't know if what they're feeling is normal or an emergency.

No prior procedure. No prior diagnosis. No exclusions.

OrixLink reads who is asking — patient, family member, or medical professional — and delivers a structured assessment calibrated to that user's role, language, and needs. The assessment updates as the conversation continues.

---

## Core Features

- **Role-adaptive output** — clinical mode for providers, plain language for patients and families
- **4-tier urgency system** — Monitor / Doctor Today / Urgent Care / Emergency Department Now
- **Ranked differentials** — HIGH / MODERATE / LOWER with supporting evidence (informational; not a formal diagnosis)
- **Red flag tracker** — per-symptom Present / Absent / Unknown, updates in real time
- **Living conversation** — new symptoms update the full assessment dynamically
- **Scheduled follow-up reminders** — Pro, Family, and Lifetime subscribers can opt in on the results screen to a single check-in email at 24, 48, or 72 hours (delivered via Resend; cron hits `/api/reminders/send` with `CRON_SECRET`)
- **Patient refusal protocol** — hours-to-harm timeline, irreversible outcome framing, 911 language
- **Multi-language support (12)** — Response language dropdown for all roles (patient, family, clinician): English, Spanish, French, Portuguese, Mandarin, Arabic, Hindi, Vietnamese, Tagalog, Haitian Creole, Somali, Amharic; tiered in-product notices and English emergency duplicate for moderate/low tiers when urgency is ED-now
- **Universal intake** — 8 situation categories, no prior diagnosis required
- **Billing** — Stripe Checkout, billing portal, webhooks (`/api/webhooks/stripe`), credit packs and subscription tiers
- **PWA** — Web app manifest and icons in `public/` for installable experience
- **Startup checks** — `instrumentation.ts` runs `validateEnv()` from `lib/env.ts` on the Node runtime; the process fails fast if required variables are missing

---

## Validated Scenario — March 2026

| Field | Value |
|---|---|
| Patient | 38-year-old male |
| Context | Day 7 post radial artery cardiac catheterization + stent |
| Presenting symptoms | Forearm swelling, hard/woody texture, pain returned after improvement, waking from sleep, difficulty gripping, finger numbness |
| Top differential | Forearm Compartment Syndrome — HIGH |
| Red flags confirmed | 6 of 6 |
| Urgency assigned | Emergency Department — Now |
| Refusal protocol | Activated and validated |
| Plain language mode | Validated — zero jargon, exact ER language provided |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Claude API (claude-sonnet-4-20250514) |
| Database | Supabase (Postgres + Auth + RLS) |
| Email | Resend |
| Payments | Stripe |
| Deployment | Vercel |
| Health interop | FHIR / SMART on FHIR (architecture) |

---

## Product Suite — Rohimaya Health AI

> **EclipseLink AI** — Handoff intelligence. Inside the hospital. Clinician to clinician.
> **OrixLink AI** — Symptom triage and clinical guidance. For everyone. Any symptom, any moment.

Both built on Claude. Both validated. Both live.

---

## Running Locally

```bash
git clone https://github.com/rohimayaventures/orixlink
cd orixlink
npm install
```

Create `.env.local` (and mirror on Vercel). The authoritative list is in **`lib/env.ts`**. Required variables include:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **AI:** `ANTHROPIC_API_KEY`
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and all price IDs: `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_FAMILY_MONTHLY`, `STRIPE_PRICE_FAMILY_ANNUAL`, `STRIPE_PRICE_LIFETIME`, `STRIPE_PRICE_CREDITS_STARTER`, `STRIPE_PRICE_CREDITS_STANDARD`, `STRIPE_PRICE_CREDITS_VALUE`, `STRIPE_PRICE_CREDITS_POWER`
- **Ops:** `CRON_SECRET` (reminders cron), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

Optional (warned if unset): `NEXT_PUBLIC_APP_URL` (defaults to `https://triage.rohimaya.ai`), `LOOPS_API_KEY`, `STRIPE_PRICE_CLINICAL_MONTHLY`, `STRIPE_PRICE_CLINICAL_ANNUAL`, `STRIPE_PRICE_CREDITS_CLINIC_BOOST`.

Enable in the Supabase dashboard: **Email/password**, **Google** OAuth (redirect URL includes `/auth/callback`). Apple OAuth can be added later.

```bash
npm run dev
```

Open http://localhost:3000

---

## Admin dashboard

Apply Supabase migrations in order under **`supabase/migrations/`** (001 onward through the latest numbered file) so schema, RLS, RPCs, reminders, webhook idempotency, and rate limits stay in sync with the app. Set `is_admin = true` on your user in `public.profiles`. Admins can open `/admin` (middleware requires sign-in; the page checks `is_admin` and redirects others to `/`).

---

## Medical Disclaimer

OrixLink AI provides AI-generated clinical support information only. It is not a licensed medical provider and does not constitute a diagnosis, medical advice, or a substitute for professional medical evaluation. In any emergency, call 911 immediately.

---

*OrixLink AI | Rohimaya Health AI | Westminster, CO*  
*Built by Hannah Kraulik Pagade — clinical operator, AI founder, MS AI/ML candidate, CU Boulder*
