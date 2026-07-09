---
status: active
last-updated: 2026-07-09
owner: Philip
---

# Spec — Nekko Journal

> **This is the source of truth for the project.** It describes *what* we're building and *why* — vision, users, journeys, the feature set, and what success looks like. It is **not** about stack or technical design (that's `TASKS.md`). It is a **living artifact**: every prompt that adds or changes a feature updates this file so it always describes the system as it actually is and intends to be. The verbatim origin ask lives in [original-prompt.md](original-prompt.md).

## Vision

**Nekko Journal** is a **monthly** journaling and goal-tracking app. It exists because daily journals and habit trackers become a chore — you miss a day, feel guilty, and drop off. A **month** is the right unit: long enough that showing up isn't a burden, short enough to remember what actually happened and to course-correct on goals.

The promise: *Set goals for the year, break them into months, and actually remember and achieve them — while building a beautiful, lookback-able record of your life at a month scale.*

### The three feelings we are selling

1. **Calm, not nagging** — the opposite of streak-guilt apps. You show up ~once a month. No daily push, no broken-streak shame. A single gentle monthly nudge.
2. **Goals you don't forget** — yearly goals are visible and broken into monthly intentions, so they stay top-of-mind and get done instead of forgotten by February.
3. **A life you can look back on** — months hold highlights, struggles (optional), and photos. Scroll back through your year, or "this month last year," and *see* what you did.

## Why It Exists

People want to reflect, track goals, and keep a record — but the tools that exist demand daily input and punish gaps, so people drop off and lose the record entirely. Nekko Journal makes the monthly cadence a *feature, not a limitation*: ~12 richer sessions a year instead of 365 anxious ones.

### What we're beating, and how

- **Beat daily journals (Day One, Stoic)**: they demand daily input and punish gaps. Nekko Journal asks for ~12 sessions a year, each richer and more reflective. No guilt.
- **Beat habit/streak trackers (Habitica, Streaks)**: streaks optimize for not-breaking-the-chain, which collapses on the first miss. Monthly trackers measure *trends and totals* ("ran 8 times in May", "read 2 books"), which survive an off day.
- **Beat a paper bullet journal**: searchable, photos inline, goal progress computed, "look back" for free, syncable across devices.
- **Inspired by Year in Review / Spotify Wrapped**: the lookback/year-in-review is a first-class, delightful surface — not an afterthought.

### The anti-streak philosophy

Trackers measure **monthly totals/trends**, not daily streaks. A tracker is a count ("times exercised: 8"), a number ("books read: 2", "weight: 72kg"), a rating (1–5), or a boolean ("took a real vacation: yes"). The lookback views chart these across months/years so you see *trajectory*, never a fragile streak. Optional fields (struggles, mood, gratitude) stay visually quiet and never pressure the user — empty is first-class. The product should feel calm and rewarding to return to once a month.

## Who It's For

People who tried daily journaling/habit apps (Day One, Stoic, Habitica, streak trackers) and dropped off, but still want to reflect, track goals, and keep a record. The monthly cadence is the differentiator — it's a feature, not a limitation.

## User Journeys & Experiences

The atomic unit is the **Month**. Everything orbits it. A month is created lazily (it doesn't exist until the user opens or edits it). The **consolidated design (v7)** centers on the two things that matter: a **markdown journal per month**, and **goals broken down across the year and placed into the months where they'll happen**. The app shell is phone-first: a bottom tab bar (Year / Goals / Insights / You) on mobile, a top nav on desktop, warm-paper calm-ocean palette, light & dark.

### 1. Year (home) — the semantic-zoom surface

A user lands on the current year and can **zoom** between three levels with a segmented control (Years / Year / Timeline) or ctrl + scroll:

- **Years**: an overview of every year, each a 12-cell strip showing which months hold placed goals, with the year's theme word. Tap a year to zoom into it.
- **Year (grid)**: a two-column month grid. Each month cell shows the goal chips planned into it; a **"this month"** badge marks the current month; empty months read "＋ drop a goal". Below the grid, the **yearly goals list** supports **inline add** and **drag**: drag a goal onto a month to plan it, or back onto the list to unplan it. An editable **theme/word of the year** sits at the top.
- **Timeline**: the months as a scrolling list, each with its planned goal chips.

### 2. Month — the journaling ritual surface

The user opens a month (back to the year, prev/next month) and sees the big serif month title, then two things:

- **Journal (markdown)**: a calm, natural editor — a plain text area with a cursor and a small formatting toolbar (heading, bold, italic, code, list, quote, link). No syntax highlighting or editor gimmicks. Tapping **Done** renders the markdown (`#`/`##`/`###` headings, `-`/`*` bullets, `1.` ordered lists, `>` quotes, `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `---` rules).
- **Goals this month**: each goal placed into this month, with a done toggle and its own **photos** (add/remove, subject to the plan's per-month photo limit).

### 3. Goals — manage and break down goals

Every goal for the year in two groups: **In the calendar** (planned into a month, shown with a month tag and a done toggle) and **Unplanned** (waiting on the board). Goals are added on the Year board; here the user reviews, toggles done, deletes, and jumps to a goal's month.

### 4. Insights — the reflection & delight surface

All-time **stat tiles** (months journaled, goals achieved, years tracked, goals set, photos kept, words written), a **goals-across-the-year** bar chart, and a **progress** bar + goal list. It links out to the **Look back** timeline (this-month-last-year, year-in-review), keeping the delight surface one tap away without cluttering the primary tabs.

### 5. You — profile & settings

Avatar + "your journal" summary, a **Light / Dark** theme control, and settings rows: **Plan** (Free / Premium → pricing), **Sync & account**, **Monthly nudge**, **Export vault**, **Import data**, **Reset to demo**.

## What Success Looks Like

- Users who churned out of daily apps *return* — month after month, ~12 times a year, without guilt or nagging.
- Yearly goals get **remembered and achieved** because they're broken into monthly intentions and stay top-of-mind.
- Users build a record they genuinely enjoy **looking back on** — the timeline and Year in Review are the surfaces that create delight and retention.
- The free app is *complete* on its own (local-first, no account required); paid Cloud is reach & safety only, never a paywall on core journaling.

## Feature Set

Living catalog of capabilities, grouped by area. Marked `[shipped]` / `[in progress]` / `[planned]`. Capability-level descriptions — task-level breakdown lives in [TASKS.md](TASKS.md).

### Foundation & shell
- **Phone-first tabbed shell** `[shipped]` — Year / Goals / Insights / You via a bottom tab bar on mobile and a top nav on desktop; chrome hidden on the welcome + month surfaces. React Router (HashRouter).
- **Simplified welcome** `[shipped]` — the first screen is just the title, "one month at a time", and one animated inspirational CTA (a teal underline that flows into an arrow). Shown once per device.
- **Calm dark/light theming** `[shipped]` — CSS-variable theme with `data-theme`, warm-paper **calm-ocean** palette (teal accent `#3e8fa0` / `#6fb3c2` dark), generous whitespace.
- **Local-first vault (zero-config)** `[shipped]` — IndexedDB persistence + seeded demo data so the app is alive on first run with no setup.
- **Open a real local folder** `[shipped]` — on Chromium (File System Access API), open a folder on disk as your vault. It's written as a human-browsable folder of files (`years/YYYY.json`, `months/YYYY-MM.md` with frontmatter, `.nekko/*.json`) and mirrored on every edit; reconnects after a reload. Truly own-your-data: the journal is plain files you can read, back up, or sync yourself.

### Year surface
- **Semantic zoom (Years / Year / Timeline)** `[shipped]` — segmented control + ctrl+scroll to move between a multi-year overview, the month grid, and a scrolling timeline.
- **Two-column month grid** `[shipped]` — goal chips per month, "this month" badge, "＋ drop a goal" empty state.
- **Drag goals onto months** `[shipped]` — drag a yearly goal onto the month where it'll happen (`goal.plannedMonth`); drag back to the list to unplan.
- **Yearly goals list + inline add** `[shipped]` — add a goal for the year inline; each row is draggable.
- **Theme / word of the year** `[shipped]` — editable inline on the grid.
- **Multi-year overview** `[shipped]` — a 12-cell placement strip per year with the year's theme word.

### Month surface
- **Markdown journal + natural editor** `[shipped]` — plain textarea with a cursor and a formatting toolbar (heading/bold/italic/code/list/quote/link), no syntax highlighting; renders `#`/`##`/`###`, `-`/`*`, `1.`, `>`, `**`, `*`, `` ` ``, links, `---`.
- **Goals this month** `[shipped]` — the goals placed into this month, each with a done toggle.
- **Per-goal photos + limits** `[shipped]` — attach photos to a goal within the month; multi-select upload, each photo downscaled + re-encoded client-side (longest edge capped at 1600px) so the vault stays small; enforced per-month limit (3 free / 25 premium) with an upgrade prompt at the ceiling.
- **Captions + lightbox** `[shipped]` — tap a photo for a full-screen viewer: swipe/arrow between a goal's photos, edit the caption inline, delete. Captions preview on the thumbnail.
- **Monthly trackers** `[shipped]` — a quiet "This month" section (only when trackers are defined) to record each tracker's value: count stepper, number field, 1–5 rating chips, or yes/no. Monthly totals, never streaks.
- **Legacy fields retained** `[shipped]` — highlights / struggles / mood / gratitude remain in the data model (import/migration) though the v7 UI folds prose into the journal.

### Goals surface
- **In-calendar vs unplanned** `[shipped]` — planned goals with a month tag + done toggle; unplanned goals waiting on the board.
- **Goal CRUD** `[shipped]` — add (on the Year board), toggle done, delete, jump to a goal's month.
- **Computed progress across the year** `[shipped]` — number goals accumulate their monthly check-in values toward a target (partial credit); milestone goals are done-or-not. Insights shows an averaged progress bar plus per-goal value/target bars.
- **Tracker management** `[shipped]` — define / edit / archive / delete trackers (name, kind, unit, target, color) from the You surface; each charts across the year in Insights.

### Insights & look back
- **All-time stat tiles** `[shipped]` — months journaled, goals achieved, years tracked, goals set, photos kept, words written.
- **Goals-across-the-year bar chart** `[shipped]` — goals placed per month.
- **Progress** `[shipped]` — done/planned bar + goal list.
- **Look back (timeline, this-month-last-year, year-in-review)** `[shipped]` — reachable from Insights. (Not gated; ships free.)

### Plans & billing
- **Free / Premium split** `[shipped]` — Free is the complete local app (all surfaces, unlimited goals/entries, 3 photos/month). Premium adds sync, Siri/agent, 25 photos/month, cloud backup + web access.
- **Pricing surface** `[shipped]` — Premium **$6/month**, a **$3 intro for the first 3 months**, and an **occasional $3 sale**. Plan flips locally in-app to preview premium; real payment is a handoff (App Store / Play Store on mobile, Stripe on web).
- **Plan gating** `[shipped]` — photo limit (3/25), sync gated to Premium, Siri/agent gated to Premium.

### Own-your-data & sync
- **JSON export / import** `[shipped]` — own-your-data export + import from the You surface.
- **Open a real local folder** `[shipped]` — see Foundation & shell: the vault can live as a folder of plain files on disk (File System Access), mirrored on every edit.
- **Cross-device sync (Premium)** `[in progress]` — target is **no-backend, client-to-cloud**: **iCloud** (iCloud Drive / key-value) on Apple, **Google Drive appData** on Android. Optional **Supabase** whole-vault last-write-wins snapshot remains the web/desktop sync path (free tier stays fully local when unconfigured).
- **Siri & agent integration (Premium)** `[planned]` — add goals and journal entries by voice via iOS App Intents / Shortcuts (and an agent-callable interface); premium-gated.
- **Cloud photo storage** `[planned]` — move photos out of the snapshot into object storage with signed URLs before promoting "cloud photos".
- **Live deploy + billing** `[planned]` — real Supabase project + Vercel deploy + App Store/Play/Stripe billing (handoff to Philip; needs credentials).

### Platform & growth
- **Responsive desktop + mobile web** `[shipped]` — one web app: bottom tabs + full-bleed on mobile, top nav + centered column on desktop.
- **Native iOS/Android (Expo)** `[in progress]` — a real Expo React Native app sharing `packages/core` + `packages/shared`, same ocean design.
- **Installable PWA** `[shipped]` — web app manifest + maskable icon + offline service worker (runtime cache, shell fallback), so Nekko installs to the home screen and works offline.
- **Gentle monthly nudge** `[shipped]` — at most one calendar-month reminder (Web Notification), and only if the current month isn't journaled yet; tapping it opens that month. Opt-in from You; no daily nags, no streaks.
- **Marketing site + live demo** `[planned]` — Vercel config + DEPLOY.md done; actual deploy is Philip's.
- **CI / E2E** `[in progress]` — build + unit CI shipped; Playwright E2E planned.

### AI (later phase)
- **Reflection prompts / journaling assistant** `[planned]` — mock-mode friendly.
- **Auto-summarize a month from sparse notes; draft year-in-review** `[planned]`.
- **Suggest goal → monthly breakdowns** `[planned]` — from a natural-language goal.

### Native (later phase)
- **Expo React Native app** `[planned]` — a *real* RN app sharing `packages/core` + `packages/shared` (not a WebView shell).

## Scope Boundaries

- **Not a daily journal or habit/streak tracker.** No daily input requirement, no streaks, no broken-streak guilt, no daily nags. The monthly cadence is intentional and non-negotiable.
- **Not coupled to nekko-notes.** Standalone product with its own repo and app, despite the local-first overlap.
- **Core journaling never requires a server.** AI and cloud sync are optional enhancements that degrade gracefully; the free, local-first app is the complete product.
- **Free tier is the full app**: Insights/analytics, unlimited entries/goals, the monthly markdown journal, local photos (up to 3/month), offline, JSON export, no account. **Premium ($6/mo)** is reach & safety only: cross-device sync, Siri/agent, 25 photos/month, cloud backup + web access. Never a paywall on writing.

## Open Questions

- **Reflection editor depth** — starting with a lightweight Markdown textarea; decide later whether a richer block editor is worth it for monthly free-form prose (likely overkill).
- **Monthly nudge mechanism** — PWA local notification vs. email vs. native push; deferred until the platform phase.
- **Photo storage at scale** — IndexedDB blobs / data URLs fine for demo; move to object storage (Supabase Storage, private bucket + signed URLs) before promoting "cloud photos".
- **Supabase free-tier numbers** — verify at supabase.com/pricing before publishing plan copy (prior research was done without live web access).
- **AI surfaces** — reflection prompts, month auto-summary, year-in-review draft, goal→month breakdown; all later-phase, mock-mode-friendly.
- **Sync without a backend** — preferred path is client-to-cloud with no server: **iCloud** (iCloud Drive documents or `NSUbiquitousKeyValueStore`) on Apple and **Google Drive appData** on Android, both writing the vault snapshot to the user's own cloud. If a backend proves necessary for reliability or conflict handling, fall back to the existing Supabase snapshot path. Decision to firm up when the native app reaches sync.
- **Siri / agent integration (Premium)** — iOS App Intents / Shortcuts for "add a goal" / "write this month"; plus an agent-callable interface. Native-only; scope the intent set when the native app lands.
- **Photo-limit unit** — enforced **per month** (3 free / 25 premium); revisit whether a lifetime or per-year cap ever makes more sense (per-month matches the monthly ritual).

<!-- Resolved questions and their decisions live in memory.md. -->
