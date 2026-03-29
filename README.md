# OrixLink AI
### Universal Triage + Diagnosis Intelligence | Rohimaya Health AI

[![Live](https://img.shields.io/badge/Live-orixlink.vercel.app-teal?style=flat-square)](https://orixlink.vercel.app)
[![Built on Claude](https://img.shields.io/badge/Built%20on-Claude%20API-7c3aed?style=flat-square)](https://anthropic.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20Supabase-0d6e6e?style=flat-square)](https://nextjs.org)
[![Status](https://img.shields.io/badge/Status-Live%20March%202026-16a34a?style=flat-square)](https://orixlink.vercel.app)

> **"Where every symptom finds its answer."**
> Any symptom. Any person. Any moment. No prior diagnosis required.

**Live:** https://orixlink.vercel.app

---

## What OrixLink AI Does

OrixLink AI is a universal clinical triage and differential diagnosis intelligence system built on the Claude API. It works for anyone — a nurse assessing a post-op complication, a family member at 2am with a sick child, a patient who doesn't know if what they're feeling is normal or an emergency.

No prior procedure. No prior diagnosis. No exclusions.

OrixLink reads who is asking — patient, family member, or medical professional — and delivers a complete clinical assessment calibrated entirely to that user's role, language, and needs. The assessment is never static — it updates dynamically as the conversation continues.

---

## Core Features

- **Role-adaptive output** — clinical mode for providers, plain language for patients and families
- **4-tier urgency system** — Monitor / Doctor Today / Urgent Care / Emergency Department Now
- **Ranked differential diagnoses** — HIGH / MODERATE / LOWER with supporting evidence
- **Red flag tracker** — per-symptom Present / Absent / Unknown, updates in real time
- **Living conversation** — new symptoms update the full assessment dynamically
- **Patient refusal protocol** — hours-to-harm timeline, irreversible outcome framing, 911 language
- **Multi-language support (12)** — Response language dropdown for all roles (patient, family, clinician): English, Spanish, French, Portuguese, Mandarin, Arabic, Hindi, Vietnamese, Tagalog, Haitian Creole, Somali, Amharic; tiered in-product notices and English emergency duplicate for moderate/low tiers when urgency is ED-now
- **Universal intake** — 8 situation categories, no prior diagnosis required

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
| Deployment | Vercel |
| Health interop | FHIR / SMART on FHIR (architecture) |

---

## Product Suite — Rohimaya Health AI

> **EclipseLink AI** — Handoff intelligence. Inside the hospital. Clinician to clinician.
> **OrixLink AI** — Diagnosis intelligence. For everyone. Any symptom, any moment.

Both built on Claude. Both validated. Both live.

---

## Running Locally

```bash
git clone https://github.com/rohimayaventures/orixlink
cd orixlink
npm install
```

Create `.env.local` (and mirror on Vercel):

```
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://triage.rohimaya.ai
STRIPE_SECRET_KEY=optional_for_billing_portal
```

Enable in the Supabase dashboard: **Email/password**, **Google** OAuth (redirect URL includes `/auth/callback`). Apple OAuth can be added later.

```bash
npm run dev
```

Open http://localhost:3000

---

## Medical Disclaimer

OrixLink AI provides AI-generated clinical support information only. It is not a licensed medical provider and does not constitute a diagnosis, medical advice, or a substitute for professional medical evaluation. In any emergency, call 911 immediately.

---

*OrixLink AI | Rohimaya Health AI | Pagade Ventures | Westminster, CO*
*Built by Hannah Kraulik Pagade — clinical operator, AI founder, MS AI/ML candidate, CU Boulder*