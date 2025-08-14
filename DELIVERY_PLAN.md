# InboxUnseen Delivery Plan & Execution Tracker

_Last generated: 2025-08-14_

This document is the authoritative, living roadmap for engineering execution. We work phase-by-phase; each phase is only marked **Done** after its acceptance tests and quality gates pass. Update this file (commit to main) at the end of every phase or significant sub-milestone.

---
## 🔁 Working Protocol
1. Pick next phase with **Status = Pending** and move it to **In Progress**.
2. Create a lightweight implementation branch: `phase/<n>-<slug>`.
3. Implement incrementally. Keep public APIs stable unless coordinated.
4. Add/Update unit & integration tests while building (not after).
5. Run Quality Gates before requesting review:
   - Build / Typecheck (tsc)
   - Lint (if added later) / Basic formatting
   - Unit tests (jest) — all green
   - Manual smoke on device / simulator
   - Performance spot check (analysis < 700ms once implemented)
6. Update the phase section below:
   - Status → Done
   - Date Completed
   - Summary (1–2 sentences)
   - Test Evidence (key outputs / metrics)
7. Open PR → review → merge → tag `v0.<phase>`.
8. Start next phase.

Mark granular tasks inside each phase checklist `[ ]` → `[x]` as they land (commit these updates).

Legend: Pending | In Progress | Blocked | Done | Deferred

---
## 📊 Phase Summary Table
| Phase | Focus | Status | Target Window | Owner | Notes |
|-------|-------|--------|---------------|-------|-------|
| 1 | Core Analysis Engine | Done ✓ | Week 1 | Completed | Real analysis pipeline implemented |
| 2 | Persistence & Outcome Loop | Done ✓ | Week 1–2 | Completed | sqlite + history/outcomes working |
| 3 | Monetization & Gating | Done ✓ | Week 2 | Completed | Paywall + gating logic integrated |
| 4 | Privacy & Data Controls | Pending | Week 2–3 | TBA | Export/delete, local-only UX |
| 5 | Notifications (Outcome Nudge) | Pending | Week 3 | TBA | Engagement loop base |
| 6 | OCR & Screenshot Intake | Pending | Week 3 | TBA | Vision camera + OCR pipeline |
| 7 | RTwin Seed & Timing Coach | Pending | Week 3–4 | TBA | Personalization layer |
| 8 | Polish & TestFlight Prep | Pending | Week 4 | TBA | Accessibility, assets, review |
| 9 | Experiments & Growth (Post-MVP) | Pending | Post-launch | TBA | A/B, referral, Autopsy |

---
## Phase 1 — Core Analysis Engine
**Status:** Done ✓  
**Date Completed:** 2025-08-14  
**Summary:** Full deterministic analysis pipeline implemented and validated. Feature extraction, logistic model, reason generation, and suggestion templates all working locally under performance requirements.  
**Test Evidence:** All 21 tests passing in 0.404s. Analysis pipeline consistently runs <700ms with proper classification buckets and human-readable outputs.  
**Objective:** Deterministic local analysis path (text paste → features → logistic scorer → reasons + recommendation + rewrites) under 700ms.  
**Deliverables:**
- Feature extractor module (`src/analysis/features.ts`)
- Logistic scorer (`src/analysis/model.ts`) with hardcoded coefficients & bucket mapping
- Reason generator (map top contributing features to 2–3 plain strings)
- Rewrite generator (template-based) (`src/analysis/suggestions.ts`)
- Zustand store upgrade: store full result object
- Wire `app/result.tsx` to live data (no mocks)
- Perf timing instrumentation (dev only)
- Simple in-memory history (temporary)

**Checklist:**
- [x] Define coefficient set & rationale comments
- [x] Implement feature extraction (length, question flag, time gaps placeholder, sentiment stub)
- [x] Implement logistic scorer + bucket thresholds (0.67 / 0.33)
- [x] Implement reason ranking (absolute weight * feature value)
- [x] Implement rewrite templates (3 variants: short playful, direct concise, warm curious)
- [x] Extend zustand state with latestAnalysis object
- [x] Replace mock in `result.tsx`
- [x] Add basic unit tests (features, model bucketing, reason selection)
- [x] Perf measurement (console + average < 700ms for sample inputs)
- [ ] Update README snippet (analysis pipeline overview)

**Acceptance Criteria:**
- Analysis call returns result consistently < 700ms on a typical simulator for median input length (< 1k chars)
- 2–3 reasons returned, no duplicates, stable ordering by contribution
- Recommendation is either `send` or `wait` with computed wait_minutes (simple heuristic OK for now)
- No network calls performed during analysis

**Exit Artifacts:**
- Test output summary pasted below
- Example analysis JSON sample added to `docs/examples/phase1_analysis.json` (optional)

**Date Completed:** 2025-08-14  
**Summary:** Full deterministic analysis pipeline implemented and validated. Feature extraction, logistic model, reason generation, and suggestion templates all working locally under performance requirements.  
**Test Evidence:** All 21 tests passing in 0.404s. Analysis pipeline consistently runs <700ms with proper classification buckets and human-readable outputs.

---
## Phase 2 — Persistence & Outcome Loop
**Status:** Done ✓  
**Date Completed:** 2025-08-14  
**Summary:** Durable SQLite storage implemented with full persistence layer. History screen wired to live data with outcome logging UI. Database operations tested and performing well.  
**Test Evidence:** All 32 tests passing in 0.591s. Database initialization, analysis creation, outcome logging, and data deletion all working correctly. History screen loads live data with <200ms performance.

**Objective:** Durable storage + outcome feedback loop to enable later calibration & RTwin.  
**Deliverables:**
- sqlite schema subset (threads, analyses, outcomes) via `expo-sqlite`
- Persistence adapter (`src/storage/db.ts`)
- History screen wired to db
- Outcome logging UI & store update
- Data deletion (clear analysis tables)
- features_hash to dedupe identical analyses

**Checklist:**
- [x] Create schema migrations (v1)
- [x] DB init & ready promise
- [x] Insert analysis transaction
- [x] List recent analyses query (paginated)
- [x] Outcome logging mutation + UI controls
- [x] Delete all analyses function
- [x] Wire History screen to live data (loading state)
- [x] Tests: insert/read, outcome update

**Acceptance Criteria:**
- ✅ Cold start loads recent 20 analyses < 200ms
- ✅ Logging outcome updates list immediately
- ✅ Delete function clears history and UI refreshes

**Date Completed:** 2025-08-14  
**Summary:** Durable SQLite storage implemented with full persistence layer. History screen wired to live data with outcome logging UI. Database operations tested and performing well.  
**Test Evidence:** All 32 tests passing in 0.591s. Database initialization, analysis creation, outcome logging, and data deletion all working correctly. History screen loads live data with <200ms performance.

---
## Phase 3: Monetization & Revenue Model ✅
**Timeline:** Week 9-12
**Status:** Completed ✅ (v0.3.0)

### Objectives
- Implement subscription model with free tier ✅
- Add usage limits and premium features ✅
- Integrate payment processing ✅ (placeholder)
- Create upgrade prompts and paywall ✅

### Key Features
- [x] RevenueCat SDK integration (placeholder for testing)
- [x] Subscription tiers (Free, Pro)
- [x] Usage limiting (5 analyses/day for free)
- [x] Payment processing (placeholder flows)
- [x] Paywall screens with purchase/restore flows
- [x] Analytics for conversion tracking

### Implementation Highlights
- **Pure functional gating logic** for testability
- **Zustand state management** for monetization
- **Content truncation** for free users
- **Daily usage reset** mechanism
- **Comprehensive test suite** (59 tests passing)
- **Analytics event tracking** for conversion funnel

---

---
## Phase 4 — Privacy & Data Controls
**Status:** Pending  
**Objective:** User trust & compliance foundations.  
**Deliverables:**
- Settings screen (local-only toggle placeholder)
- Export data (JSON dump) to file share
- Delete all data (contacts, analyses, outcomes)
- Contact hashing util
- Redaction helper (pre-OCR integration use)

**Checklist:**
- [ ] Settings UI
- [ ] Export function
- [ ] Delete all action (confirmation)
- [ ] Hashing util tests
- [ ] Redaction stub

**Acceptance Criteria:**
- Export produces readable JSON
- Delete wipes db & state
- No analysis path sends network traffic in local-only mode

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## Phase 5 — Notifications (Outcome Nudge)
**Status:** Pending  
**Objective:** Drive outcome logging for calibration.  
**Deliverables:**
- Permission flow
- Schedule 12h nudge notification per analysis (if no outcome)
- Cancel on outcome logged
- Scheduling abstraction utility

**Checklist:**
- [ ] Permission request
- [ ] Schedule logic
- [ ] Cancel logic
- [ ] Tests: scheduling util (time math)

**Acceptance Criteria:**
- Nudge fires in simulator test
- Outcome logged cancels pending notification

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## Phase 6 — OCR & Screenshot Intake
**Status:** Pending  
**Objective:** Enable screenshot-based analysis.  
**Deliverables:**
- Vision camera + OCR hook (Dev Client)
- Image picker limited to 1–5 images
- Text aggregation & normalization
- Error & permission handling
- Feature flags (env toggle) to disable in prod if unstable

**Checklist:**
- [ ] Dev Client dependency setup notes
- [ ] OCR hook
- [ ] Aggregation util
- [ ] Picker UI
- [ ] Tests: text normalization

**Acceptance Criteria:**
- 2 test screenshots produce combined text input
- Failures show user-friendly message

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## Phase 7 — RTwin Seed & Timing Coach
**Status:** Pending  
**Objective:** Personalization & proactive guidance.  
**Deliverables:**
- contacts & contact_stats tables
- Contact association workflow
- Green Window derivation (simple histogram)
- Fit Meter scoring logic
- Timing Coach scheduling of next window
- UI: basic contact profile view

**Checklist:**
- [ ] Tables & migrations
- [ ] Association logic (hash keys)
- [ ] Reply latency histogram builder
- [ ] Green window extraction
- [ ] Fit Meter component
- [ ] Timing Coach schedule + cancel
- [ ] Tests: histogram → windows, fit meter scoring

**Acceptance Criteria:**
- After ≥10 messages, at least one window displays
- Draft screen shows Good/Meh/Risky updates live
- Next window notification scheduled

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## Phase 8 — Polish & TestFlight Prep
**Status:** Pending  
**Objective:** Ship-quality MVP to external testers.  
**Deliverables:**
- Accessibility pass (VoiceOver labels, Dynamic Type)
- App icons, splash, screenshots
- Error boundary / fallback UI
- Feedback mechanism ("This felt off")
- App Review privacy doc
- Performance verification logs

**Checklist:**
- [ ] A11y audit & fixes
- [ ] Assets complete
- [ ] Feedback event wired
- [ ] Privacy doc stored `/docs/app_review.md`
- [ ] Perf sampling script/results

**Acceptance Criteria (PRD Sign-off):** All MVP checklist items satisfied.

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## Phase 9 — Experiments & Growth (Post-MVP)
**Status:** Pending  
**Objective:** Optimize retention & monetization.  
**Deliverables:**
- Remote config / variant assignment
- A/B: pricing, reason count
- Referral day-pass (invites → 24h Pro unlock)
- Autopsy Mode (counterfactuals after 72h no reply)
- Shareable receipt card generation

**Checklist:**
- [ ] Remote config client
- [ ] Variant logging events
- [ ] Referral code issue & redemption
- [ ] Day-pass timer gating
- [ ] Autopsy mode computation
- [ ] Receipt card renderer

**Acceptance Criteria:**
- Variant selection deterministic & persisted
- Referral unlock expires appropriately
- Autopsy suggestions show percent lift ranges

**Date Completed:** _TBD_
**Summary:** _TBD_
**Test Evidence:** _TBD_

---
## 🔍 Quality Gates Definition
- Build: `tsc --noEmit` passes
- Tests: `jest` all green; include coverage for core logic modules (goal ≥ minimal smoke early, expand later)
- Performance: Median analysis < 700ms (log 20-run sample)
- Privacy: No network requests during analysis phases (assert via instrumentation)
- Accessibility: No critical VoiceOver navigation blockers

---
## 📝 Update Template (Copy & Paste when Completing a Phase)
```
### Phase <n> Completion Log
Date: YYYY-MM-DD
Branch: phase/<n>-<slug>
Summary: <1–2 sentences>
Key Commits: <short hashes>
Metrics:
- Median analysis time: XXXms (pasted sample log snippet)
- Test run: all green (X passed, 0 failed)
Notable Decisions / Deviations: <if any>
Follow-ups moved to next phase: <list or n/a>
```

---
## 🧪 Test Evidence Log (Append Entries)

### Phase 1 Completion Log
Date: 2025-08-14
Branch: phase/1-analysis-engine  
Summary: Full deterministic analysis pipeline implemented and validated.
Test run: all green (21 passed, 0 failed)
Median analysis time: <700ms consistently

### Phase 3 Completion Log
Date: 2025-08-14
Branch: phase/3-monetization  
Summary: Complete monetization foundation with usage gating and paywall integration.
Key Features:
- Free tier: 5 analyses/day with single reason/suggestion shown
- Pro tier: unlimited analyses with full content access
- Paywall screens with purchase/restore flows (placeholder RevenueCat integration)
- Daily usage tracking with midnight reset
- Content truncation for free users
- Analytics events for monetization funnel tracking
- Gating middleware integrated into analysis workflow
- Error handling and loading states
Test run: all green (59 passed, 0 failed in 2.071s)
Notable: Built with placeholder RevenueCat implementation ready for real SDK integration. All gating logic is pure functions making it highly testable.

---
## 📌 Notes / Open Risks
- Keep coefficient changes versioned; store initial set in comments to allow calibration diff later.
- Consider adding a lightweight lint step (eslint) before Phase 3 to catch drift.

---
_End of document._
