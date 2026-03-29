# FinanceLens AI — Portfolio Case Study
# Hannah Kraulik Pagade
# hannahkraulikpagade.com

**Live product:** https://financelens-ai.vercel.app

**Last updated:** March 2026 (post-ship full sync)

---

## PROJECT METADATA

| Field | Value |
|-------|-------|
| **Project name** | FinanceLens AI |
| **Tagline** | Financial documents, in plain English. |
| **Status** | Live |
| **Primary URL** | https://financelens-ai.vercel.app |
| **Repo** | https://github.com/rohimayaventures/finance-lens |
| **Tags** | FINTECH · AI-PRODUCT · FULL-STACK · DOCUMENT-INTELLIGENCE |
| **Role** | Product design, prompt architecture, implementation |
| **Timeline** | 2026 |
| **Stack** | Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Claude API · Supabase · pdf-lib · pptxgenjs · Zod · Vercel |

---

## SECTION 1 — THE PROBLEM

Executives write earnings calls and regulatory filings to communicate selectively. The language is deliberate. Most readers lack tools to see what the language is *signaling*, not just what it says. The shift from "we will deliver" to "we believe we are well positioned to deliver" is not a stylistic choice. It is information. FinanceLens was built to make that signal visible.

The secondary problem is workflow friction. Analysts and operators who do read these documents carefully lose hours turning a read-through into something shareable. A meeting-ready PDF. A deck for a client. A comparison of two filings. FinanceLens closes that loop without requiring institutional tooling or a Bloomberg terminal.

**The gap in the market:** No accessible tool combines plain-language translation, language drift detection, confidence scoring, two-document comparison, and shareable presentation generation in a single workflow for non-institutional users.

---

## SECTION 2 — THE PROCESS

### The core design insight

The difference between FinanceLens and a document summarizer is the difference between translation and intelligence. Translation removes complexity. Intelligence reveals the complexity beneath deliberately simple language. Every product decision was made in service of that distinction.

### Constraint set

- The tool must produce more than a summary. A summary tells you what was said. FinanceLens must tell you what it means, what it signals, and what deserves scrutiny.
- Language drift must be surfaced as a discrete signal, not buried in prose. The shift from firm to hedging language must be visible at a glance, with the actual phrases quoted.
- Confidence scoring must reflect evidence density in the excerpt, not a statistical prediction or investment recommendation. That distinction must be made explicit in the UI and in a dedicated methodology page.
- The document type must change the analysis logic. An earnings call is analyzed for management tone, guidance language, and selective disclosure. A 10-K is analyzed for auditor changes, revenue concentration risk, and forward-looking statement density. A regulatory notice is analyzed for compliance obligations and enforcement language. The same prompt cannot serve all three.
- The output must be shareable without friction. Analysis is only as useful as the person who receives it.
- Guardrails must be explicit and persistent. The tool must never present itself as a financial advisor and must frame every output as assistive analysis, not authoritative conclusion.

### Technical constraints and a key pivot

The original architecture specified the Canva Connect API for branded presentation generation. During build, Canva's app review process blocked programmatic access for portfolio tools pending approval. Rather than wait on a third-party approval timeline, the architecture was redesigned to own the full presentation layer.

The replacement approach: Claude builds a structured 7-slide JSON outline from the analysis, the server resolves images via Unsplash (with attribution) or Pollinations as a fallback, and the client generates a real `.pptx` file using pptxgenjs as a blob download. Simultaneously, the slide JSON is persisted to Supabase and returned as a shareable URL at `/deck/[slug]` -- a full-screen branded presenter view built inside the app using the WSJ Editorial design system.

The result is architecturally stronger than the original spec. No third-party OAuth dependency. No approval process. The presentation layer is entirely owned, entirely branded, and works for any public user without authentication. Canva API integration remains on the product roadmap for a future release that adds editable deck output.

### Design system -- WSJ Editorial

FinanceLens is the only light-background product in the portfolio. The WSJ Editorial system was designed to read like a financial newspaper crossed with an analyst research report.

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAFAF7` warm cream | All surfaces |
| Primary text | `#1C1C1E` deep ink | Body, headings |
| Signal red | `#C0392B` | Flags, negative indicators, logo accent |
| Positive | `#1A7A3C` forest | Upward metrics, firm language |
| Hedge amber | `#9A6B00` | Drift hedge signals |
| Typography | Georgia + IBM Plex Mono | Headings/wordmark + all financial data and tags |

The deliberate choice to use a light background and serif typography makes FinanceLens immediately visually distinct from every other product in the portfolio and communicates the editorial, research-report register before a word is read.

---

## SECTION 3 — WHAT SHIPPED

### Single-document analysis (`/analyze` → `/results`)

**Input:** Paste text or upload PDF (text extraction via `/api/parse-pdf`, not OCR -- scanned pages require paste).

**Document types:** Earnings call, 10-K, regulatory notice. Each type steers a different Claude system prompt covering tone, risk framing, and compliance language.

**Output sections:**

1. **What they said** -- plain-language translation with no interpretation. Clean enough that a communications team could have written it.
2. **What it actually means** -- interpretation with hedging removed. Not "the company noted challenges" but "revenue in this segment declined and management avoided specifying by how much."
3. **Key numbers** -- values with labels, direction of change, and context.
4. **Language drift** -- `hedge` vs `firm` tags with quoted phrases from the document. The shift is the signal.
5. **Worth a closer look** -- flags with evidence-oriented copy, not opinions.
6. **Source anchors** -- short excerpts tied to the user's paste, supporting each interpretive claim.

**Confidence score:** LLM-assigned 0-100 rubric on evidence density in the excerpt. Not a statistical prediction. Not a stock recommendation. The methodology page explains this explicitly. Toggle on/off.

**Speed:** Haiku on by default for latency. Sonnet available for deeper passes.

**Persistence:** Results in sessionStorage for the tab session. Share analysis saves to Supabase and returns a durable **share URL** at `/deck/[slug]` (**30-day TTL**, with expiry called out in the viewer).

---

### Compare mode (`/compare`)

Two documents, same doc-type framing. One Claude call returns structured JSON:

- Overview of the period-over-period shift
- New language that appeared in Document B
- Language that was dropped from Document A
- Claim shifts with direction indicators (firm to hedge or reverse)
- Metrics narrative
- Dual confidence scores side by side

Six built-in sample pairs (earnings, 10-K, regulatory, retail Y/Y, cyber 10-K, Wells Fargo settlement) for instant demos.

Share comparison saves to Supabase and returns a `/deck/[slug]` URL with a compare-specific layout in DeckViewer showing A/B column structure.

`maxDuration: 120` on the route prevents Vercel timeout on long paired pastes.

---

### Briefing deck (from results)

Claude builds a 7-slide JSON outline. Server resolves images:

- Unsplash Access Key set: `imageSearchQuery` → Unsplash landscape search with attribution and download ping per guidelines.
- Fallback: `imagePrompt` → Pollinations URL for abstract imagery.

UI: Modal preview → Download PowerPoint (`.pptx` via pptxgenjs, blob download after async image fetch) → Share deck (copies `/deck/[slug]` to clipboard) → Open full-screen slides.

---

### Shareable deck viewer (`/deck/[slug]`)

Any analysis, briefing deck, or comparison saved to Supabase is accessible at a **share URL** (**30-day TTL** — not indefinite storage). No login required. Works for any public user with the link.

**Scroll view (default):** Full-width WSJ Editorial cards, one per slide. Generous padding. Georgia headings, IBM Plex Mono for data. "Powered by FinanceLens AI" footer on every card. Expiry date shown at top.

**Full-screen view (toggle):** Fixed overlay, one slide at a time, keyboard arrow navigation, slide counter, ESC to exit. Same WSJ Editorial palette on a near-black background.

Expired or missing slugs show a clean branded error state with a link back to the app.

---

### Share as PDF (`/api/export-pdf`)

Branded PDF via pdf-lib (Node runtime): FinanceLens wordmark, red rule, WSJ Editorial token colors, all report sections with footers and disclaimer. Triggered from the results sidebar.

---

### Methodology and trust layer (`/methodology`)

Dedicated page explaining: how Claude is used, what confidence scores mean, how deck images are sourced, JSON validation and retry logic, sessionStorage scope, and the assistive-only disclaimer. In-product hints on results and compare pages reinforce this framing at point of use.

---

### Validation layer

All analyze, compare, and briefing routes use `claudeJsonWithRetry` in `lib/claudeJsonWithRetry.ts`: one repair turn if JSON is invalid or fails Zod schema validation. Reduces silent empty failures from malformed model output.

---

## SECTION 4 — TECHNICAL ARCHITECTURE

| Piece | Implementation |
|-------|----------------|
| Framework | Next.js 16 App Router |
| AI | Anthropic SDK, `claude-sonnet-4-20250514` (analyze/compare/briefing), `claude-3-5-haiku-20241022` default for fast analyze |
| Validation | Zod schemas + `lib/claudeJsonWithRetry.ts` |
| Persistence | Supabase (`financelens_sessions` table, shared with HealthLiteracy AI project) |
| Deck file | pptxgenjs (browser, blob download) |
| PDF | pdf-lib (`/api/export-pdf`, nodejs, `maxDuration` 60s) |
| PDF parsing | pdf-parse (`/api/parse-pdf`, wired to analyze upload path) |
| Images | Unsplash API + Pollinations fallback |
| Env | `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL` (canonical base for `/deck/[slug]` share links in email and social), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `UNSPLASH_ACCESS_KEY`, optional `ANTHROPIC_ANALYZE_*` tuning |
| Deploy | Vercel; analyze and compare routes `maxDuration: 120s` |

**Routes:** `/`, `/analyze`, `/results`, `/compare`, `/deck/[slug]`, `/methodology`, `/api/analyze`, `/api/compare`, `/api/briefing`, `/api/export-pdf`, `/api/parse-pdf`.

**Supabase table:** `financelens_sessions` -- columns: `id`, `document_type`, `document_text`, `analysis`, `slides`, `share_slug` (unique), `layout` (`briefing` for single-doc analysis + briefing decks, `compare` for compare mode), `created_at`, `expires_at` (30-day TTL). Public read by slug. Public insert. No auth required. Row Level Security enabled.

---

## SECTION 5 — STATUS MATRIX

### What works

- Paste → analyze → results with typed JSON, guardrail phrasing, drift, source anchors, confidence meter, optional fast model
- PDF upload via server-side pdf-parse with extracted text preview and truncation notice
- Compare for two pasted texts with clear A/B framing, claim shifts, sample pairs, share URL, and `maxDuration` protection
- Briefing modal with slide outline, PPTX download, share deck copy-to-clipboard, and full-screen deck via `/deck/[slug]`
- `/deck/[slug]` scroll + full-screen presenter view for both briefing and compare layouts
- Branded PDF export from results with consistent FinanceLens identity
- Methodology page and in-product hints on confidence and evidence framing
- Schema and retry logic reduces brittle empty failures from malformed model JSON
- Graceful degradation -- if Supabase insert fails, PPTX download still works offline
- Build hygiene -- `getSupabase()` guard prevents build crashes without Supabase env

### Known gaps and roadmap

- **Canva API integration** (roadmap): Canva Connect API app approval is pending. When approved, the briefing flow will add a "Polish in Canva" path that produces an editable, branded Canva design alongside the existing PPTX download and **30-day** `/deck/[slug]` share links. A manual "Open in Canva" link exists in the current UI as a bridge.
- **Scanned PDF support:** `/api/parse-pdf` uses pdf-parse for text-layer extraction only. Scanned image PDFs require paste. Copy in the UI reflects this accurately.
- **Streaming:** Analyze waits for full JSON response. A streaming status UI ("Analyzing language drift... Scoring confidence...") is a planned UX improvement.
- **Rate limiting:** Not implemented on API routes. Appropriate before any public traffic push.
- **Observability:** No structured logging for latency, token use, or failure class distribution. Needed before any monetization layer.
- **Confidence calibration:** Scores are useful as a rough rubric. Not calibrated across models or document types. Clearer UI copy and optional hiding available now.

---

## SECTION 6 — PORTFOLIO COPY

### Key outcome

Structured financial intelligence -- plain language, drift detection, source anchors, confidence rubric -- across single-document analysis and two-document comparison, with branded PDF share, LLM-built briefing decks with Unsplash imagery, PPTX download, full-screen presenter view at a **30-day share URL** (`/deck/[slug]`), and an explicit methodology and trust layer. Assistive only. Never financial advice.

### Card summary

Earnings calls, 10-Ks, and regulatory filings → structured analysis, two-document compare, shareable PDF, and exportable slides -- with explicit trust framing and a validated JSON pipeline from document to shareable artifact.

### One honest line for interviews

FinanceLens closes the loop from financial document to shareable artifact using Claude, Zod validation, pdf-lib, pptxgenjs, and Supabase-backed **30-day share URLs** -- not a thin summarizer, and every architectural decision in the case study matches what is actually wired in the repo.

### The pivot story (for PM interviews)

The original spec called for Canva Connect API as the presentation output. During build, Canva's app review process blocked access pending approval -- a real-world constraint with no timeline. Rather than stall the ship, the architecture was redesigned to own the presentation layer entirely: Claude JSON outlines, pptxgenjs for the file download, and a custom `/deck/[slug]` viewer built inside the app using the WSJ Editorial design system. The result removed a third-party OAuth dependency, gave full control over the branded output, and shipped faster. Canva API remains on the roadmap as an additive feature, not a requirement for the core workflow to function.

---

*FinanceLens AI — https://financelens-ai.vercel.app · Case study reflects [github.com/rohimayaventures/finance-lens](https://github.com/rohimayaventures/finance-lens) as of March 2026.*