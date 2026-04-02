# OrixLink AI — Portfolio Case Study

**Hannah Kraulik Pagade | Rohimaya Health AI**
[hannahkraulikpagade.com](https://hannahkraulikpagade.com)

**Last updated:** April 2026

---

## Project metadata

| Field | Value |
|-------|-------|
| **Project name** | OrixLink AI |
| **Tagline** | Where every symptom finds its answer. |
| **Status** | Live — production |
| **Primary URL** | [triage.rohimaya.ai](https://triage.rohimaya.ai) |
| **Repo** | github.com/rohimayaventures/orixlink |
| **Tags** | CLINICAL-AI · CONVERSATIONAL · FULL-STACK · MONETIZED |
| **Role** | Product Lead, Conversation UX, Prompt Architect, Full-Stack Implementation |
| **Timeline** | 2025 — Present |
| **Stack** | Next.js 16 · TypeScript · Tailwind CSS v4 · Claude API (Sonnet + Haiku) · Supabase (Auth + Postgres + RLS + pg_cron + pg_net) · Stripe (Checkout + Webhooks + Billing Portal) · Resend · Vercel |

---

## Section 1 — The proof point

Seven days after my spouse had a radial artery cardiac catheterization with stent placement, he developed forearm swelling, a hard and tight forearm to palpation, pain that had returned after initial improvement, pain waking him from sleep, and progressive grip weakness.

I ran OrixLink.

It flagged the symptom cluster as a red-flag emergency presentation consistent with compartment syndrome. It returned a structured differential ranking hematoma, pseudoaneurysm, radial artery occlusion, and compartment syndrome in order of likelihood. It identified four present red flag criteria and recommended: go to the emergency room now, bring this assessment, ask for compartment pressure measurement.

He was seen. The assessment matched the clinical workup.

This is not a demo. This is what the product is for.

---

## Section 2 — The problem

### One-sentence framing

Diagnostic errors affect at least 12 million Americans every year. Most happen not because clinicians lack knowledge, but because the intake process gives them no structured way to connect a patient's full symptom picture to a working differential before the encounter begins.

### Why familiar tools do not solve this

**Consumer symptom checkers** optimize for engagement and liability avoidance. They steer users toward emergency departments or self-care buckets without producing a clinician-grade differential with explicit likelihood language and red flag criteria tied to the actual narrative the patient typed.

**EMR intake** captures chief complaint and structured fields. It does not help a layperson translate "it feels like something is tearing when I grip" into the pattern a triage nurse weighs in the first 90 seconds.

OrixLink sits in the gap: any symptom, any person, no prior diagnosis required, with output structured so it could travel with the patient into the clinical encounter.

### A personal professional observation

As a Licensed Practical Nurse with 15 years across acute care, post-acute, rehabilitation, and senior living, I work with patients who arrived at their current level of care because something was missed or delayed upstream. A patient presenting with nonspecific complaints at an urgent care clinic that has no structured way to think through a differential is a patient at risk. That observation is not from a product spec. It is from 15 years of shift work. OrixLink exists because I have seen what happens when the intake gap is not closed.

### The data

The stakes are not abstract. They are quantified.

**Diagnostic errors kill and disable at scale.** Diagnosis-related allegations account for the highest proportion of total U.S. malpractice payments at 32.9%, with $28.7 billion paid out between 1999 and 2018. Among those outcomes, 38.9% resulted in death and 36% in permanent disability. A 2024 BMJ Quality and Safety study found that harmful diagnostic errors may occur in 1 in every 14 general medical hospital patients, with 85% assessed as likely preventable.

**Error rates are highest where presentation is least obvious.** Diagnostic error rates across 15 serious conditions have a median of 13.6%, ranging from 2.2% for myocardial infarction to 62.1% for spinal abscess. The conditions with the highest error rates are also the least obvious at initial presentation. That is precisely where a structured triage and differential tool has the most value.

**Triage delays cost lives in measurable minutes.** Research published in JAMA Network Open found that undertriaged patients with aortic dissection waited an average of 8.9 minutes longer for CT imaging and 33.3 minutes longer for critical medications. For subarachnoid hemorrhage, undertriage delayed CT orders by 2.4 minutes and medication orders by 17.6 minutes. In time-sensitive emergencies, those minutes are not administrative inconveniences.

**AI shows clinical-grade promise in this category.** Research published in The Lancet Digital Health found that a general-purpose AI language model performed diagnostic tasks at levels comparable to physicians and significantly better than lay individuals. The implication: a properly constrained AI in a clinical support context is a viable tool for improving the front end of the diagnostic process, particularly for patients and caregivers navigating symptoms without immediate access to a clinician.

| Focus | Source | Finding |
|-------|--------|---------|
| Diagnostic error magnitude | National Academies, *Improving Diagnosis in Health Care* (2015) | Most people experience at least one diagnostic error in their lifetime; harm is often preventable. |
| Primary care burden | Singh et al., *BMJ Qual Saf* (2014) | ~5% of adults in large health systems experience a missed diagnostic opportunity per year. |
| Malpractice and mortality | Newman-Toker et al., *Diagnosis* (2021) | Diagnosis-related claims: 32.9% of total U.S. malpractice payments; 38.9% of outcomes resulted in death. |
| Triage delays | Sax et al., *JAMA Network Open* (2025) | Undertriaged aortic dissection: 8.9 min longer to CT, 33.3 min longer to critical medications. |
| Error rate by condition | Johns Hopkins / Newman-Toker | Median 13.6% across 15 serious conditions; spinal abscess 62.1%. |
| AI diagnostic performance | Levine et al., *Lancet Digital Health* (2024) | General-purpose AI performed diagnostic tasks comparable to physicians; triage inferior but improving. |
| Symptom checkers | Semigran et al., *BMJ* (2015) | Triage advice from symptom checkers is variable; most tools lack transparent clinical reasoning. |
| Human factors | Graber et al., *BMJ Qual Saf* (2014) | Cognitive and systems factors both drive diagnostic error; structured intake is a leverage point. |

---

## Section 3 — The process

### The constraint set

The product had to do five things simultaneously and none of them could be sacrificed for the others:

- Accept unconstrained natural-language symptom input regardless of health literacy or prior diagnosis.
- Return a structured differential with likelihood rankings a clinician would recognize as correctly framed.
- Surface red flag criteria as a discrete visual layer, not buried in prose.
- Assign a four-tier urgency level that mirrors triage judgment in the first 90 seconds.
- Frame every output as clinical support, not diagnosis, with a legal overlay present but not obstructive.

The urgency tiers are judgment-based, encoded in the system prompt, not a shallow decision tree. Tier 1 is monitor at home. Tier 4 is go to the emergency department now. The criteria for each tier were drawn from 15 years of clinical observation across acute care, post-acute, and rehabilitation environments.

The output contract matters as much as the clinical logic. The system prompt enforces fixed section tokens — differential, red flags, urgency, disclaimer, follow-up prompts — that `lib/parseAssessment.ts` maps into typed UI components. That keeps share text, print output, and reminder previews predictable regardless of how the model phrases its response. The parser includes regex fallbacks for minor formatting drift. The goal is stable structure, not a claim that the model can never deviate.

**Monetization was designed before the first paying user.** The atomic `attempt_assessment` RPC paired with `rollback_assessment` on model failure means users do not lose a cap slot when the model errors. Credits live in a dedicated table. Stripe webhooks use a claim-after-process pattern so retries behave correctly. These are product decisions, not engineering afterthoughts.

### The pivot stories

**Pivot 1: Anonymous enforcement**

Early enforcement leaned on localStorage. A determined user could clear storage and run unlimited free assessments. At roughly $0.014 per Haiku session, that is a real cost leak, not a theoretical one. The fix moved enforcement server-side: fingerprint and IP stored in `anonymous_assessments` with a 24-hour window and 30-day retention. The legal disclosure was added at the same time. The goal was closing the abuse loop without punishing normal users who simply close a tab and come back.

The lesson: client-side enforcement is a UX signal, not a security gate. Any enforcement that matters lives at the data layer.

**Pivot 2: Credit data model drift**

Credit packs initially wrote to a `credits_balance` column on `usage_tracking` while `attempt_assessment` read a separate `credits` table. A user could purchase a credit pack, see a confirmation, and still hit a cap-reached wall on their next assessment because the two systems never talked to each other. Real money was moving. The fix was aligning webhook writes with RPC reads before any paid user hit the flow.

The lesson: billing data model decisions compound quickly. Every column that stores money-adjacent state needs an explicit contract with the function that reads it.

**Pivot 3: The RPC boundary bug**

`attempt_assessment` used logic that could treat the last included subscription assessment as over-cap and pull from credits incorrectly. A user at exactly their monthly limit would have a credit consumed for what should have been a free subscription assessment. The fix reads `v_used_before` before incrementing and only enters the credits path when the subscription increment did not fire.

This is the kind of bug that is invisible in normal usage, catastrophic in edge cases, and nearly impossible to catch without knowing exactly what the RPC is supposed to guarantee. The fix is one variable and two lines of SQL. The diagnosis took careful reading of the entire function contract.

The lesson: atomic database functions require explicit boundary definitions, not implicit assumptions about when paths fire.

---

## Section 4 — What shipped

### Core assessment

- Three-step conversational intake (role, context, symptoms) with session persistence across refresh.
- Seven roles: patient, clinician, and five caregiver variants (child, elderly, spouse, family member, other).
- 12-language support with tiered confidence disclaimers. Emergency results in moderate or low-confidence languages surface copy in both the selected language and English.
- Structured differential from section tokens via `lib/parseAssessment.ts`. Red flags as a discrete card layer with PRESENT, ABSENT, and UNKNOWN status. Four-tier urgency. Three follow-up prompt chips per response.
- Share and print with full disclaimer. Multi-turn conversation with full message history.

### Authentication and sessions

- Supabase Auth: email/password and Google OAuth.
- Anonymous first-assessment gate: client-side UX layer, server-side enforcement in `anonymous_assessments`.
- Anonymous-to-authenticated session migration on sign-in.
- Bootstrap on sign-in creates subscription and usage tracking rows automatically.
- 30-minute inactivity timeout with 2-minute warning banner.
- Protected routes across dashboard, history, account, admin, and pricing success.

### Billing and monetization

| Tier | Price | Cap | Model |
|------|-------|-----|-------|
| Free | $0 | 5/month | Haiku |
| Pro | $19/mo or $190/yr | 150/month | Sonnet |
| Family | $34/mo or $340/yr | 600/month, 6 members | Sonnet |
| Lifetime | $249 one-time | 100/month, 2 dependent profiles | Sonnet |

Credit packs (Starter through Power) with full lifecycle management: purchased credits live in a dedicated table, consumed atomically by the RPC, rolled back on model failure, deduped on payment intent ID.

**Clinical B2B tier is a planned future feature.** The database schema, RPC scaffolding, and seat management tables are built. Public checkout and provider UI are deferred until B2C production validates the core product and legal review of the clinical practice context is complete.

Stripe Checkout (subscription and one-time), full webhook lifecycle handling, Billing Portal, authenticated success confirmation. Env validation at startup fails fast on bad deploys.

### Family system

Complete invite and join flow via email and invite code. Shared 600-assessment pool across 6 members with 10-assessment daily per-member limit. Owner cancellation cascades to all members. Usage dashboard with per-member breakdown.

### Post-auth product surface

Dashboard with usage ring and recent sessions. History with full session list and dependent filter. Session detail view. Account page with tier, usage, credits, billing dates, dependent management, and family join.

### Reminders

24, 48, and 72-hour delay options with cancel. Resend-branded HTML email with Meridian Oracle styling. pg_cron hourly job via pg_net secured with cron secret. Status tracking: pending, sent, cancelled, failed.

### Compliance and legal

First-use legal overlay. Full legal page covering disclaimer, terms, subscription terms, privacy policy, HIPAA non-covered-entity statement, anonymous fingerprint and IP disclosure, and session policy. Disclaimers in system prompt, UI, share text, and print output. RLS on all core tables.

### Infrastructure

Meridian Oracle design system across all surfaces. PWA manifest and service worker with offline fallback. WCAG-oriented contrast and focus states. Admin panel with user management, tier control, manual credit grants, and analytics.

---

## Section 5 — Technical architecture

| Piece | Implementation |
|-------|----------------|
| Framework | Next.js 16 App Router |
| AI | `claude-sonnet-4-20250514` (paid tiers); `claude-haiku-4-5-20251001` (Free) |
| Temperature | 0.3 — hardcoded for clinical determinism |
| Prompt | Urgency tier hierarchy, red flag criteria, differential ranking, refusal protocol, ABSENT vs UNKNOWN symptom documentation rule, section tokens for `parseAssessment` |
| Output parser | `lib/parseAssessment.ts` — section token extraction, urgency with null fallback, red flag card layer, disclaimer with non-English resilience |
| Persistence | sessions, messages, subscriptions, usage_tracking, credits, reminders, webhook_events, anonymous_assessments, profiles, dependents, family_members, practice_* (scaffold) |
| Usage enforcement | `attempt_assessment` RPC (jsonb contract, atomic, v_used_before boundary fix) + `rollback_assessment` on failure with credit restoration |
| Auth | `@supabase/ssr`, middleware refresh, Google OAuth, bootstrap on sign-in |
| Billing | Stripe Checkout + Webhooks + Billing Portal, claim-after-process idempotency, `stripe_payment_intent_id` dedup constraint |
| Scheduling | pg_cron + pg_net for reminders |
| Security | RLS on all public tables including anonymous_assessments and practice tables (migration 029) |
| Deploy | Vercel; primary domain triage.rohimaya.ai |

---

## Section 6 — Status matrix

### What works

Core assessment funnel end to end. Auth including Google OAuth. Caps, rollback, and credit consumption. Full Stripe lifecycle. Credit packs. Family invite, join, member management, and pool enforcement. Reminders with branded email. Dashboard, history, and account. Legal layer. PWA. Admin tools. Env validation at startup. Webhook logging for edge cases.

### Known gaps and roadmap

| Gap | Notes |
|-----|-------|
| PDF pipeline | Browser print today; dedicated pipeline (Puppeteer or similar) on roadmap. |
| Emergency number localization | Hardcoded 911 in share text and some copy; locale-aware mapping planned. |
| Test suite | No automated tests; manual launch checklist is thorough. Parsing and RPC contract tests are the first priority post-launch. |
| Anonymous session recovery | localStorage marks the gate as used; sessionStorage holds the data. A user who closes the tab loses results but cannot re-run. |
| Webhook family cascade | 3 to 4 separate operations on owner cancel with no transaction wrapper. Acceptable at current scale; database function wrap is the fix. |
| Clinical B2B tier | Schema, RPC scaffolding, and seat management tables built. Provider UI, public checkout, and legal review deferred until B2C production validates the core product. |
| App stores | PWA ready; store submission not started. |

---

## Section 7 — Portfolio copy

### Card summary

Universal triage support: any symptom, any person, no prior diagnosis required. Live at triage.rohimaya.ai with Stripe billing, atomic usage enforcement, credit packs, family plans, 12-language support, and follow-up reminders.

### Project description (card view)

OrixLink AI is a clinical triage and differential support tool that accepts any symptom from any person with no prior diagnosis required. The output is structured the way a triage nurse actually thinks: four-tier urgency, ranked differential with likelihood language, red flags as a discrete layer, and a follow-up thread for evolving presentations. It is live, monetized, and validated against a real clinical scenario.

### Problem statement (case study hero)

Twelve million Americans experience a diagnostic error in outpatient settings every year. The majority happen not in hospitals but in primary care and urgent care, where intake is shortest and least structured. Symptom checkers optimize for liability avoidance. EMR intake captures what the system needs, not what the patient is experiencing. OrixLink sits in the gap between a person's symptom narrative and the structured clinical picture a provider can actually work from.

### Process steps (for portfolio page)

**Step 1 — Clinical constraint set**
The core design constraint was not technical. It was clinical: the output had to be structured the way a triage nurse actually thinks, not the way a software team imagines triage works. Urgency tiers, differential ranking, and red flag framing were all drawn from 15 years of clinical observation before a single line of prompt engineering was written.

**Step 2 — Output contract before UI**
The system prompt enforces fixed section tokens that the parser maps into typed UI components. The contract was defined first. The UI was built to consume it. That sequence is why share text, print output, and reminder previews are all consistent without separate formatting logic for each surface.

**Step 3 — Monetization before the first user**
Billing architecture, credit data model, and the atomic attempt/rollback RPC pairing were all designed before launch. Three real production bugs were caught and fixed during build: anonymous enforcement leakage, credit data model misalignment, and an RPC boundary error that would have consumed credits incorrectly at cap boundaries. All three are documented in the migrations and the process.

### Impact line

The intake gap and diagnostic error statistics are real. Fifteen years at the bedside is the research program. The proof point is a real patient whose emergency presentation the product surfaced before a clinician saw him.

### One honest line for technical interviews

Typed output contract via `parseAssessment` plus `attempt_assessment` and `rollback_assessment` RPC pairing plus Stripe claim-after-process idempotency and `stripe_payment_intent_id` dedup, built and shipped by one person with a clinical license and a code editor.

### One honest line for product interviews

I designed the monetization architecture, wrote the system prompt, built the full-stack implementation, identified and fixed three production-class billing bugs during build, and validated the clinical output against a real emergency presentation. This is what 0-to-1 looks like when the builder has 15 years of domain expertise.

### Business model framing

Four live consumer tiers from free to Lifetime one-time. Credit packs for over-cap access. Family plans with shared pools. A Clinical B2B tier is planned for a future phase pending B2C validation and legal review of the clinical practice context. The tier architecture was designed from the start to support enterprise expansion without a rebuild when that phase is ready.

### What this demonstrates for the roles I am targeting

**Production-grade prompt engineering for clinical AI.** The OrixLink system prompt is the most technically demanding prompt engineering work in this portfolio. It must produce structured output, enforce clinical attribution language, surface urgency discretely, and handle the full range of symptom presentations from benign to life-threatening without hallucinating diagnoses or missing red flags. That is a different problem than summarization or translation, and it requires a different level of constraint design. The system prompt is the product IP.

**Universal scope as a deliberate product decision.** Any symptom, any person, no prior diagnosis required is a positioning choice that most clinical AI products explicitly avoid. Existing tools narrow their scope to reduce liability and engineering complexity. OrixLink accepts the full scope and manages it through prompt constraint rather than feature limitation. That is a more ambitious product bet, and it required clinical confidence to make it.

**Design systems thinking at brand scale.** The Meridian Oracle system was not designed for OrixLink alone. It was designed as the foundation for the Rohimaya Health AI brand family, with patient-facing education products using a distinct but related system. Maintaining visual coherence across multiple products while differentiating by audience is a Head of Product competency, not just a design competency.

**Clinical knowledge as a product constraint.** OrixLink was built by someone who has worked clinical floors for 15 years. The red flag logic, the urgency taxonomy, the care pathway recommendations, and the attribution language all reflect real clinical knowledge applied as product constraint. That is not replicable by a product manager without clinical experience, and it shows in the output quality.

**0-to-1 ownership across every layer.** Product strategy, conversation design, system prompt engineering, full-stack implementation, billing architecture, and clinical validation all came from one person. This is the portfolio evidence for what that combination looks like at production scale.

---

## Section 8 — Citations

1. Singh, H., Meyer, A. N., and Thomas, E. J. (2014). The frequency of diagnostic errors in outpatient care: Estimations from three large observational studies involving US adult populations. BMJ Quality and Safety, 23(9), 727-731.

2. National Academy of Medicine. (2015). Improving Diagnosis in Health Care. Committee on Diagnostic Error in Health Care. The National Academies Press.

3. Newman-Toker, D. E., et al. (2021). Rate of diagnostic errors and serious misdiagnosis-related harms for major vascular events, infections, and cancers: Toward a national incidence estimate using the Big Three. Diagnosis, 8(1), 67-84.

4. Gunderson, C. G., et al. (2020). Prevalence of harmful diagnostic errors in hospitalised adults: A systematic review and meta-analysis. BMJ Quality and Safety, 29(12), 1008-1018.

5. BMJ Group. (2024). Harmful diagnostic errors may occur in 1 in every 14 general medical hospital patients. BMJ Quality and Safety.

6. Sax, D. R., et al. (2025). Emergency department triage accuracy and delays in care for high-risk conditions. JAMA Network Open.

7. Levine, D. M., et al. (2024). The diagnostic and triage accuracy of the GPT-3 artificial intelligence model: An observational study. The Lancet Digital Health, 6(10).

8. Semigran, H. L., et al. (2015). Evaluation of symptom checkers for self diagnosis and triage: Audit study. BMJ, 351.

9. Graber, M. L., et al. (2014). Cognitive interventions to reduce diagnostic error: A narrative review. BMJ Quality and Safety, 21(7), 535-557.

10. Singh, H., et al. (2013). Types and origins of diagnostic errors in primary care settings. JAMA Internal Medicine, 173(6), 418-425.

11. PSNet, AHRQ. Diagnostic errors. Agency for Healthcare Research and Quality Patient Safety Network.

12. Suamchaiyaphum, K., Jones, A. R., and Markaki, A. (2024). Triage accuracy of emergency nurses: An evidence-based review. Journal of Emergency Nursing, 50(1), 44-54.

---

*Case study updated April 2026. Hannah Kraulik Pagade, Rohimaya Health AI.*