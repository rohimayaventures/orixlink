# OrixLink AI — Portfolio Case Study
# Hannah Kraulik Pagade | Rohimaya Health AI
# hannahkraulikpagade.com

**Last updated:** March 2026

---

## PROJECT METADATA

| Field | Value |
|-------|-------|
| **Project name** | OrixLink AI |
| **Tagline** | Where every symptom finds its answer. |
| **Status** | Live |
| **Primary URL** | triage.rohimaya.ai |
| **Vercel URL** | orixlink.vercel.app |
| **Repo** | github.com/rohimayaventures/orixlink |
| **Design process page** | hannahkraulikpagade.com/work/orixlink-ai/process |
| **Tags** | CLINICAL-AI · CONVERSATIONAL · FULL-STACK |
| **Role** | Conversation UX Lead, Prompt Architect, Implementation |
| **Timeline** | 2025 -- Present |
| **Stack** | Next.js 16 · TypeScript · Tailwind CSS v4 · Claude API · Supabase (Auth + Postgres + RLS) · Stripe (billing portal) · Vercel |

---

## SECTION 1 — THE PROBLEM

### One-sentence framing

Diagnostic errors affect at least 12 million Americans every year. Most happen not because clinicians lack knowledge, but because the current intake process gives them no structured way to connect a patient's full symptom picture to a working differential before the encounter even begins.

### The data

Diagnostic errors are the most costly and most invisible category of medical error. The U.S. healthcare system estimates at least 12 million Americans experience a diagnostic error in outpatient settings each year. The majority occur not in hospitals but in primary care and urgent care settings -- where time is shortest and intake is least structured.

The problem compounds in two directions simultaneously. Clinicians are working from fragmented intake -- a rushed triage note, a chief complaint field, a patient who cannot describe what they are feeling in clinical terms. And patients are entering care settings with no tool to help them articulate what they are experiencing before the encounter begins.

OrixLink addresses both. Any symptom. Any person. No prior diagnosis required.

### The proof point

In March 2026, OrixLink was used in a real clinical scenario: Prasad Pagade, 38, seven days post radial artery cardiac catheterization with stent placement, presenting with forearm swelling, a hard and tight forearm to palpation, pain that had returned after initial improvement, pain waking him from sleep, and progressive grip weakness.

OrixLink flagged the symptom cluster as a red-flag emergency presentation consistent with compartment syndrome, returned a structured differential ranking hematoma, pseudoaneurysm, radial artery occlusion, and compartment syndrome in order of likelihood, identified four present red flag criteria, and recommended: go to the emergency room now, bring this assessment, ask for compartment pressure measurement.

He was seen. The assessment matched the clinical workup. This is what the product is for.

---

## SECTION 2 — THE PROCESS

### Step 1 -- Discovery

I have 15 years of clinical experience across acute care, post-acute, rehabilitation, and senior living. Every shift for 15 years has been field research for this product. The constraints were not discovered through user interviews. They were accumulated through repetition:

- Patients who cannot articulate their symptoms in clinical language get worse intake assessments.
- The same symptom cluster means different things depending on context, history, and onset pattern.
- No tool exists that accepts any symptom from any person with no prior diagnosis and returns a structured clinical differential.
- That absence is not a gap in the market. It is a gap in care.

### Step 2 -- Design and Build

**The core product decision was universal intake scope.** Most symptom checkers are condition-specific or population-specific. OrixLink was designed for any symptom, any person, any context, because that is how clinical reality actually presents.

**Prompt architecture was the hardest problem.** The Claude system prompt had to do five things simultaneously without collapsing into either a disclaimer wall or a dangerously confident diagnosis:

- Accept unconstrained natural language symptom input
- Return a structured differential with likelihood rankings
- Surface red flag criteria as a discrete visual layer
- Assign a four-tier urgency level (monitor at home / contact provider same day / urgent care / emergency department now)
- Frame every output as clinical support, not diagnosis -- with the legal overlay language present but not obstructive

**The urgency tier system** required the most iteration. The tiers are not algorithmic. They are judgment-based on symptom pattern, red flag presence, and onset velocity. The prompt architecture mirrors the reasoning a triage nurse applies in the first 90 seconds of an encounter.

**The legal overlay** shipped as a persistent first-use acknowledgment. It frames OrixLink as a clinical support tool, not a diagnostic instrument, and surfaces the emergency services redirect before any analysis is shown. This was a product decision, not a legal afterthought.

**Design system: Meridian Oracle.**

| Token | Value | Usage |
|-------|-------|-------|
| Obsidian | `#080C14` | Primary background |
| Gold | `#C8A96E` | Primary accent, urgency indicators |
| Cream | `#F4EFE6` | Body text, card surfaces |
| Typography | Cormorant Garamond + DM Sans + DM Mono | Display / body / data labels |

The dark background and gold accent were chosen to signal institutional authority and precision -- the product is for clinical staff as much as patients, and the design register communicates that before a word is read.

### Step 3 -- What Shipped

- Conversational symptom intake in natural language, any symptom, any person
- Document type: single-encounter clinical support (not a longitudinal health record)
- Structured differential output with likelihood rankings
- Red flag criteria surfaced as a discrete visual card layer before the differential body
- Four-tier urgency classification with plain-language action guidance
- Follow-up prompting -- the conversation continues if the user adds new symptoms or context
- Legal overlay: first-use acknowledgment, persistent emergency redirect
- Supabase session and message persistence (sessions and messages tables with RLS)
- Full authentication: Supabase Auth (email/password, Google, Apple) with `@supabase/ssr` cookie sessions, root middleware session refresh, and route protection for `/dashboard`, `/history`, `/account`, and `/pricing/success`
- Anonymous first-assessment gate (localStorage + sessionStorage), Meridian-styled auth modal (Supabase Auth UI), and POST migration of anonymous sessions to the signed-in user via service-role API
- Account surface: tier, monthly usage vs cap, credits balance, Stripe Customer Portal (when configured), sign-out
- Multi-language support
- Share and print output
- Design process artifact page at hannahkraulikpagade.com/work/orixlink-ai/process

---

## SECTION 3 — TECHNICAL ARCHITECTURE

| Piece | Implementation |
|-------|----------------|
| Framework | Next.js 16 App Router |
| AI | Claude API (claude-sonnet-4-20250514), multi-turn conversational prompt |
| Prompt architecture | System prompt with urgency tier logic, red flag criteria, differential ranking, guardrail attribution language |
| Persistence | Supabase (sessions + messages tables, RLS, user-scoped) |
| Auth & sessions | `@supabase/ssr`: browser client, server client (`next/headers` cookies), middleware helper to refresh session on every request; OAuth callback route; protected routes redirect unauthenticated users to `/` while `/assessment` stays public |
| Anonymous → signed-in | `localStorage` (`orixlink_anon_used`) limits one free anonymous run per browser; completed anonymous payload in `sessionStorage` (`orixlink_last_session`); on `SIGNED_IN`, client POSTs to `/api/migrate-session` (service role) to insert session + messages for the new `user_id`, then clears storage; bootstrap ensures `subscriptions`, `usage_tracking`, and credits rows where applicable |
| Auth UI | Client `AuthModal` using `@supabase/auth-ui-react` + ThemeSupa tokens aligned to Meridian Oracle (Obsidian, Gold, Cream, DM Sans / Cormorant Garamond) |
| Account & billing | Server `/account` page; `/api/auth/signout` (POST); `/api/billing-portal` opens Stripe Customer Portal when Stripe + customer id are configured |
| Design system | Meridian Oracle |
| Deploy | Vercel, primary domain triage.rohimaya.ai |

**Environment (representative):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, migration), `NEXT_PUBLIC_SITE_URL` for OAuth return URLs, plus Anthropic and optional Stripe keys for production billing.

---

## SECTION 4 — PORTFOLIO COPY

### Card summary
Universal triage and diagnosis. Any symptom, any person, no prior diagnosis required.

### Project description (card view)
OrixLink AI accepts any symptom in natural language and returns a structured clinical differential, red flag criteria, four-tier urgency classification, and plain-language next steps. Built by a 15-year LPN for the intake gap that causes 12 million diagnostic errors a year.

### Problem statement (case study hero)
At least 12 million Americans experience a diagnostic error in outpatient settings each year. Most happen not because clinicians lack knowledge, but because the intake process gives them no structured way to connect a patient's full symptom picture to a working differential. OrixLink is the tool that closes that gap -- any symptom, any person, no prior diagnosis required.

### Process Step 1 -- Discovery
I did not need to conduct user research for this product. I have conducted it for 15 years on every shift. The intake failure pattern is not hypothetical. It is the first 90 seconds of every clinical encounter, repeated across every setting I have worked in.

### Process Step 2 -- Design and Build
The hardest problem was prompt architecture. The Claude system prompt had to accept unconstrained natural language, return a structured differential with likelihood rankings, surface red flags as a discrete layer, assign a four-tier urgency level, and frame everything as clinical support without being a disclaimer wall or a dangerously confident diagnosis. Every word of that prompt was iterated until a triage nurse would trust it.

### Process Step 3 -- What shipped
A conversational clinical triage tool with natural language intake, structured differential output, red flag cards, urgency tiers, follow-up prompting, legal overlay, Supabase persistence, full Supabase Auth with protected app areas, anonymous-to-account session migration, account and usage surfaces, multi-language support, and a design process artifact page showing the full conversation architecture. Validated in March 2026 against a real compartment syndrome presentation that matched the clinical workup.

### Impact line
OrixLink exists because the intake gap is real, the diagnostic error rate is real, and 15 years of clinical experience is worth more than a user research sprint. The proof point is not a demo. It is a real patient whose symptom cluster the product correctly flagged as an emergency before a clinician saw him.

---

*Case study updated March 2026. Hannah Kraulik Pagade, Rohimaya Health AI.*