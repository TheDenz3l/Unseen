# InboxUnseen — Product Requirements Document (PRD)

_Last updated: Aug 14, 2025 • Owner: Lamar (“Edgewalker”) • PM/Author: LULU_

---

## 0) Executive Summary

**InboxUnseen** is a mobile app that monetizes the peak-anxiety moment after you send a message and don’t get a reply. Users paste text or drop screenshots; the app returns a **Ghost Meter** (Likely / Uncertain / Unlikely), a **Next Best Action** (Send now vs Wait Xh) with short rationale, and—on Pro—a **Recipient Twin (RTwin)** per-contact model that learns each person’s best reply windows and tone preferences.

**Platform strategy:** iOS first (Expo dev client + TestFlight), then port to Android with the same codebase.

**Monetization:** $24.99/mo (or $6.99/wk) Pro plan; VIP human “Wingman” add-on later.

**Why we win:** Fast, private, explainable decisions (not generic chat). RTwin compounds value over time, creating switching costs and LTV.

---

## 1) Goals & Non-Goals

### Goals (P0)
- Reduce user over-texting by giving **clear, timely decisions** (“Wait 4h” or “Send now with this short line”).
- **Explainable** verdicts (3 short reasons) to build trust.
- **Per-contact personalization** (RTwin) that runs on-device by default.
- Ship iOS TestFlight in ≤ 4 weeks with strong privacy posture and clean App Review compliance.

### Non-Goals
- No scraping or logins to third-party apps.
- No auto-sending or impersonation; user always presses send themselves.
- No attractiveness/“hotness” scoring of people; we coach conversation timing/tone only.

---

## 2) Success Metrics & Acceptance Criteria

**North-Star:** # of helpful decisions delivered per user per week (Send/Wait + rationale) that the user accepts.

**Launch Targets (MVP)**
- D1 retention ≥ **45%**; D7 ≥ **20%**.
- Paywall CVR (first session) ≥ **7%**.
- Active users perform ≥ **3 analyses/day**.
- ≥ **40%** of free users revisit the paywall by Day 7.
- Dispute rate (user flags verdict as “wrong”) < **0.5%**.

**Acceptance Criteria (examples)**
- Given a pasted chat, app returns a bucketed verdict and 2–3 reasons in < **700ms** (local).
- With ≥ 10 imported messages for a contact, RTwin renders at least one **Green Window** and a **Fit Meter** label while drafting.
- “Local-only” privacy toggle prevents any network calls for analysis/rewrites.

---

## 3) Personas & JTBD

- **Active App Dater (18–34, male-skewed):** Many live threads; wants to avoid double-texting and sounding needy.  
  _JTBD:_ “Tell me if I should wait and what to send next so I stop overthinking and get replies.”

- **Re-entering Dater (late 20s–40s):** Rusty; wants guardrails on timing & tone.  
  _JTBD:_ “Help me sound normal and text at the right time.”

- **Social Overthinker (any age):** Uses beyond dating (exes, friends, coworkers).  
  _JTBD:_ “Sanity check risky messages across contexts.”

---

## 4) Scope & Feature Set

### MVP (Weeks 1–3) — **P0**
1. **Input**
   - Paste text or select 1–5 screenshots from Photos (limited picker).
2. **Ghost Meter**
   - Output: **Likely / Uncertain / Unlikely**, with % band.
   - **Next Best Action**: “Send now” or “Wait Xh”.
   - **Reasons**: top 3 signals (e.g., _you already asked a question_; _9h since your last message_; _evening historically better_).
   - 2–3 respectful rewrite options (template-based).
3. **History & Outcome Logging**
   - Recent analyses, one-tap “Got reply / No reply,” time-to-reply capture.
4. **Paywall**
   - Free: headline verdict + 1 hint.
   - **Pro ($24.99/mo or $6.99/wk)**: unlimited analyses, full rationale, rewrites, Timing Coach, RTwin.
5. **Privacy**
   - **Local-only Mode** default (on-device OCR + scoring). Data deletion and export.

### V1 (Weeks 4–6) — **P1**
1. **Timing Coach**
   - Local notifications for per-contact “green windows” (best times to text).
2. **RTwin (Recipient Twin)**
   - Per-contact profile: Green Windows, Fit Meter (live while drafting), Do/Don’t list, **Autopsy Mode** (counterfactuals after a dead thread).
3. **Referral day-pass**
   - Invite 1 friend → 24h Pro unlock.

### Later (P2)
- **VIP Wingman** human review slots.
- Cloud LLM rewrite variations (Pro-only, opt-in, strict token budget).
- Android release.

---

## 5) UX Flows (textual wireframes)

**Home**
- Buttons: _Analyze a conversation_ (Paste | Pick screenshots) • _RTwin Contacts_ • _History_

**Analyze (Paste/Screens) → Result**
- Header: **Ghost Meter** badge (Likely/Uncertain/Unlikely + %)
- Card: **Recommendation** → “Wait 4h (Green Window 7–10 pm)” or “Send now”
- Reasons (3 bullets): short, plain
- CTA: **Copy suggested message** (or open Draft with Fit Meter)
- Footer: _Log outcome_ • _Paywall upsell (if Free)_

**RTwin Contact**
- **Green Window Radar** (svg): e.g., Tue–Thu 7–10 pm
- **Do/Don’t**: “Short + playful works • Avoid double questions”
- **Draft**: text box with **Fit Meter** (Good / Meh / Risky) live
- **Notify me** toggle for next green window

**Paywall**
- Headline: _Stop double-texting. Start getting replies._
- Bullets: _Know when to text • Send the right tone • Track what works_
- Plans: Monthly / Weekly; trial config via RevenueCat
- Legal: cancel anytime, privacy link

---

## 6) Functional Requirements

- On-device **OCR** for screenshots; handle dark/light theme chat bubbles.
- Feature extractor → deterministic **logistic regression** for Ghost Meter bucket.
- **Reason generator** surfaces top feature contributions.
- **Timing Coach**: local schedule notifications per contact.
- **RTwin** stores only hashed contact keys; no raw phone numbers.
- **Local database** (sqlite) for history and per-contact stats.
- **RevenueCat** for subscriptions; **PostHog** (or Amplitude) for analytics.
- Accessibility: VoiceOver labels, Dynamic Type, high-contrast theme.

---

## 7) Non-Functional Requirements

- **Performance:** Analysis in < 700ms (local); UI interactions at 60 fps.
- **Privacy/Security:** Default local-only; encryption at rest for cached files; clear data deletion; no third-party logins.
- **Reliability:** App works offline for core features; only subscriptions/telemetry need network.

---

## 8) Tech Stack

- **Framework:** Expo (TypeScript) + Expo Dev Client + EAS Build
- **UI:** Tamagui (design tokens, dark mode), Reanimated + Moti (micro-animations), react-native-svg (radar)
- **Nav:** Expo Router
- **State:** Zustand; React Query for async/cache
- **Storage:** expo-sqlite (data); expo-secure-store (secrets); expo-file-system (redacted screenshots)
- **OCR:** react-native-vision-camera + vision-camera-ocr (ML Kit) via config plugin
- **NLP/Models:** heuristics + logistic regression in TS; optional tfjs/onnx later
- **Billing:** RevenueCat
- **Notifications:** expo-notifications
- **Analytics/RC:** PostHog or Amplitude + Remote Config

## 8.1) Design System & Color Palette

**Brand palette (HEX)**  
- **Silver** `#c1c1c1`  
- **Charcoal** `#2c4251`  
- **Indian Red** `#d16666`  
- **Yellow Green** `#b6c649`  
- **White** `#ffffff`

**Semantic mapping (app-wide tokens)**  
- `bg` → **Charcoal** `#2c4251` (default dark background)  
- `surface` → **Charcoal** `#2c4251` (cards/sheets; use 1px subtle border)  
- `text` → **White** `#ffffff` (primary on dark)  
- `textMuted` → **Silver** `#c1c1c1`  
- `accent` → **Yellow Green** `#b6c649` (primary actions/positive)  
- `danger` → **Indian Red** `#d16666` (errors/unlikely state emphasis)  
- `border` → **Silver** `#c1c1c1`  
- `overlay` → `rgba(44, 66, 81, 0.72)` (charcoal with alpha)  
- `borderDim` → `rgba(193, 193, 193, 0.24)` (silver with alpha)

**Ghost Meter mapping**  
- **Likely** → accent-tinted background (**Yellow Green**) with white text and thin silver border  
- **Uncertain** → neutral silver tint with silver text  
- **Unlikely** → danger tint (**Indian Red**) with danger border and white text

**Gradients (sparingly)**  
- CTA fill: `linear-gradient(90deg, #b6c649, #ffffff)`

**Expo/Tamagui tokens (authoritative)**  
```ts
// app/theme/colors.ts
export const palette = {
  silver:     '#c1c1c1',
  charcoal:   '#2c4251',
  indianRed:  '#d16666',
  yellowGreen:'#b6c649',
  white:      '#ffffff',
  overlay:    'rgba(44,66,81,0.72)',
  borderDim:  'rgba(193,193,193,0.24)',
}

// app/theme/tokens.ts
export const tokens = {
  color: {
    silver:      '#c1c1c1',
    charcoal:    '#2c4251',
    indianRed:   '#d16666',
    yellowGreen: '#b6c649',
    white:       '#ffffff',
    bg:          '#2c4251',
    surface:     '#2c4251',
    text:        '#ffffff',
    textMuted:   '#c1c1c1',
    accent:      '#b6c649',
    danger:      '#d16666',
    border:      '#c1c1c1',
    borderDim:   'rgba(193,193,193,0.24)',
    overlay:     'rgba(44,66,81,0.72)',
  },
}
```

**Navigation theme (React Navigation)**  
```ts
// app/theme/navigation.ts
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native'
import { palette } from './colors'

export const NavDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.charcoal,
    card:       palette.charcoal,
    text:       palette.white,
    border:     palette.silver,
    notification: palette.indianRed,
    primary:    palette.yellowGreen,
  },
}

export const NavLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.white,
    card:       palette.silver,
    text:       palette.charcoal,
    border:     palette.silver,
    notification: palette.indianRed,
    primary:    palette.yellowGreen,
  },
}
```

---

## 9) Architecture (high-level)

- **Client-side first**: OCR → Feature extractor → Logistic scorer → UI.
- **Local DB** holds contact stats & history; **optional** cloud sync (encrypted) for backup.
- **Backend (thin)**: Auth, subscription validation webhook, remote config, (later) LLM rewrite endpoint.

---

## 10) Data Model (sqlite)

```sql
-- Contacts are anonymized via a stable hash
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,          -- contact_hash
  display_hint TEXT,            -- optional user-given label
  n_msgs INTEGER DEFAULT 0,
  confidence REAL DEFAULT 0.0,  -- 0..1
  created_at INTEGER
);

CREATE TABLE contact_stats (
  contact_id TEXT REFERENCES contacts(id),
  reply_latency_hist BLOB,      -- serialized buckets
  best_hours TEXT,              -- JSON array e.g., [19,20,21,22]
  tone_len_coeffs TEXT,         -- JSON {len: x, playful: y, direct: z}
  taboo_tokens TEXT,            -- JSON array ["??","..."]
  updated_at INTEGER,
  PRIMARY KEY (contact_id)
);

CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id),
  created_at INTEGER
);

CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  thread_id TEXT REFERENCES threads(id),
  features_hash TEXT,
  prob REAL,                    -- 0..1
  bucket TEXT,                  -- Likely/Uncertain/Unlikely
  recommendation TEXT,          -- send|wait; wait_minutes
  reasons TEXT,                 -- JSON array of strings
  suggestions TEXT,             -- JSON array of rewrite strings
  created_at INTEGER
);

CREATE TABLE outcomes (
  analysis_id TEXT PRIMARY KEY REFERENCES analyses(id),
  got_reply INTEGER,            -- 0/1
  latency_minutes INTEGER,
  logged_at INTEGER
);
```

---

## 11) Scoring Spec (deterministic, explainable)

**Features (examples):**
- `mins_since_last_msg`, `is_question (0/1)`, `msg_len`, `chase_count`, `hour_of_day_bias`, `weekday_bias`, `sentiment`, `who_spoke_last (you|them)`, `prev_latency_avg`, `double_question (0/1)`

**Model (TypeScript)**
```ts
const z = b0 +
  b1*minsSince +
  b2*isQuestion +
  b3*msgLen +
  b4*chaseCount +
  b5*hourBias +
  b6*weekdayBias +
  b7*sentiment +
  b8*(whoSpokeLast === 'them' ? 1 : 0);

const prob = 1 / (1 + Math.exp(-z));
const bucket = prob > 0.67 ? 'Likely' : prob < 0.33 ? 'Unlikely' : 'Uncertain';
```
**Calibration:** Platt or isotonic using anonymized user-logged outcomes.

**Reasons:** map top absolute coefficient contributions to short strings.

---

## 12) RTwin (Recipient Twin) Spec

- **Seed:** import 3–5 screenshots or pasted messages for a contact.
- **Learned signals per contact:**
  - **Green Windows:** KDE/ histogram on reply times → hours where replies cluster.
  - **Tone/Length Preference:** coefficients leaning short vs long, playful vs direct.
  - **Taboos:** tokens correlated with non-replies (e.g., “??”, ellipses, double questions).
- **Fit Meter (draft screen):** Good / Meh / Risky based on how current draft matches their learned prefs and whether you’re inside a Green Window.
- **Autopsy Mode:** After 72h no reply, show two actionable counterfactuals (e.g., “+9–12% if you sent between 7–10 pm; +6–8% if you cut length by ~40%.”)

---

## 13) Notifications

- **Timing Coach Local Alerts** (per contact): “Your next green window starts in 1h 20m.”
- **Outcome Nudge:** 12h after analysis, “Log outcome?” (to improve calibration)
- Respect iOS Focus; all alerts are local unless user enables cloud sync.

---

## 14) Monetization

- **Pro Plan:** $24.99/mo (test $6.99/wk).  
  Includes: unlimited analyses, full reasons, rewrites, **RTwin**, **Timing Coach**, Green Window alerts, Fit Meter.
- **Trial:** Remote-configurable (3 days or none).
- **Add-Ons (later):** VIP Wingman (human review slots).
- **Refund/Cancel:** RevenueCat entitlements; in-app “Manage subscription” deep link.

**Paywall Copy (v1)**
- Title: **Stop double-texting. Start getting replies.**
- Bullets: **Know when to text next • Send the right tone • Track what actually works**
- CTA: **Unlock Pro — $24.99/mo** (Cancel anytime)

---

## 15) Analytics & Event Schema

**Core Events**
```json
{
  "analysis_created": {
    "user_id": "...",
    "ts": 1692123123,
    "source": "paste|screenshot",
    "features_hash": "sha256:...",
    "prob_bucket": "Likely|Uncertain|Unlikely",
    "recommendation": "send|wait",
    "wait_minutes": 240
  },
  "message_action": {
    "user_id": "...",
    "ts": 1692123500,
    "action": "send|wait",
    "contact_id": "hash..."
  },
  "outcome_logged": {
    "analysis_id": "...",
    "got_reply": 1,
    "latency_minutes": 53
  },
  "paywall_view": { "variant": "A" },
  "subscribe": { "plan": "monthly|weekly", "price": 24.99, "country": "US" },
  "share_receipt": { "channel": "story|tiktok|reddit" }
}
```

**KPIs**
- K-factor, Share-rate of “receipt cards,” Paywall CVR %, D1/D7 retention, Analyses per DAU, Reply-rate lift vs baseline.

---

## 16) Privacy, Compliance, Moderation

- **Local-only Mode default**; screenshots/text never leave device unless user opts into backup/LLM features.
- **Age Gate:** 17+.  
- **Content Rules:** Block coercion/harassment; frequent “Do nothing” recommendations.  
- **Data Controls:** Export, delete per contact, delete all.  
- **Policies:** Clear ToS/Privacy; “coaching, not guarantees.”

---

## 17) Accessibility & Localization

- **A11y:** Dynamic Type; VoiceOver labels for meters; color-safe palettes; haptic feedback on verdict changes.
- **L10n:** Start EN; prep for ES. All copy in a single i18n file.

---

## 18) Risks & Mitigations

- **Trust (black-box fear):** Always show 3 reasons; show confidence bands; allow feedback (“This felt off”).
- **OCR friction:** Ship text-paste first; screenshot import is optional.
- **Abuse:** Toxicity filter on rewrites; block certain intents.
- **App Review:** Avoid platform logos; explicit user action to send; no scraping.

---

## 19) Release Plan

- **Week 1:** Scaffold Expo app, paste-flow, basic scorer, paywall stub, RevenueCat, PostHog.
- **Week 2:** Screenshot OCR (Dev Client), reasons, rewrites, sqlite history, outcome logging.
- **Week 3:** RTwin seed, Green Windows, Fit Meter, local notifications, privacy & delete flows; TestFlight (50–100 users).
- **Week 4:** Polish, AB paywall (weekly vs monthly), creator seeding, submit for App Review.

**Android:** Begin after iOS stabilizes; parity features; ML Kit setup.

---

## 20) Experiments (Initial A/Bs)

- **Pricing:** $24.99/mo vs $19.99/mo; weekly on/off.
- **Paywall Placement:** pre-result vs post-result gating.
- **Copy Variants:** “Stop double-texting” vs “Text at the right time.”
- **Reason Count:** 2 vs 3 reasons (brevity vs trust).

---

## 21) Open Questions (track but don’t block MVP)

- Should we add a **“Work Mode”** (email tone) inside the same app later?
- Minimal viable **LLM rewrite** option behind Pro—what daily token cap preserves margin?

---

## 22) Appendix A — Package List (no pinned versions in PRD)

- `expo`, `expo-router`, `react`, `react-native`, `tamagui`, `react-native-reanimated`, `moti`, `react-native-svg`, `@gorhom/bottom-sheet`, `zustand`, `@tanstack/react-query`, `react-hook-form`, `expo-sqlite`, `expo-secure-store`, `expo-file-system`, `expo-notifications`, `react-native-vision-camera`, `vision-camera-ocr` (ML Kit), `@react-native-community/blur` (optional), `posthog-react-native` (or Amplitude), `react-native-mmkv` (optional), `revenuecat/purchases-react-native`.

---

## 23) Appendix B — Config Notes

- **Expo Dev Client** required for vision-camera & OCR plugin.
- iOS Info.plist: Photo library usage strings; local notifications; camera access (optional).
- RevenueCat products: `pro_monthly`, `pro_weekly`, (later) `vip_wingman_addon`.

---

## 24) Appendix C — Sample Copy

**Reasons snippet examples**
- “You asked a direct question recently.”
- “9 hours since your last message; evenings perform better.”
- “Double-question pattern lowers replies for this person.”

**Rewrite tone labels**
- _Short & playful_ • _Direct & concise_ • _Warm & curious_

---

### Sign-off Checklist (MVP)

- [ ] Local-only mode fully functional; no external calls during analysis.  
- [ ] Result screen returns verdict < 700ms with 3 reasons.  
- [ ] RTwin renders at least one Green Window after 10+ messages imported.  
- [ ] Paywall shows both monthly & weekly; purchase & restore tested.  
- [ ] Delete account/data clears local DB and caches.  
- [ ] App Review doc prepared (privacy, data usage, screenshots without platform logos).

---

**Decision:** Build iOS MVP now under this PRD. After TestFlight learning, ship V1 and prepare Android port.
