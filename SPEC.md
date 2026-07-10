---
status: active
last-updated: 2026-07-10
owner: Philip
---

# Spec — Getsu

> **This is the source of truth for the project.** It describes *what* we're building and *why* — vision, users, journeys, the feature set, and what success looks like. It is **not** about stack or technical design (that's `TASKS.md`). It is a **living artifact**: every prompt that adds or changes a feature updates this file so it always describes the system as it actually is and intends to be. The verbatim origin ask lives in [original-prompt.md](original-prompt.md).

## Vision

**Getsu** is a **monthly** journaling and goal-tracking app. It exists because daily journals and habit trackers become a chore — you miss a day, feel guilty, and drop off. A **month** is the right unit: long enough that showing up isn't a burden, short enough to remember what actually happened and to course-correct on goals.

The promise: *Set goals for the year, break them into months, and actually remember and achieve them — while building a beautiful, lookback-able record of your life at a month scale.*

### The three feelings we are selling

1. **Calm, not nagging** — the opposite of streak-guilt apps. You show up ~once a month. No daily push, no broken-streak shame. A single gentle monthly nudge.
2. **Goals you don't forget** — yearly goals are visible and broken into monthly intentions, so they stay top-of-mind and get done instead of forgotten by February.
3. **A life you can look back on** — months hold highlights, struggles (optional), and photos. Scroll back through your year, or "this month last year," and *see* what you did.

## Why It Exists

People want to reflect, track goals, and keep a record — but the tools that exist demand daily input and punish gaps, so people drop off and lose the record entirely. Getsu makes the monthly cadence a *feature, not a limitation*: ~12 richer sessions a year instead of 365 anxious ones.

### What we're beating, and how

- **Beat daily journals (Day One, Stoic)**: they demand daily input and punish gaps. Getsu asks for ~12 sessions a year, each richer and more reflective. No guilt.
- **Beat habit/streak trackers (Habitica, Streaks)**: streaks optimize for not-breaking-the-chain, which collapses on the first miss. Monthly trackers measure *trends and totals* ("ran 8 times in May", "read 2 books"), which survive an off day.
- **Beat a paper bullet journal**: searchable, photos inline, goal progress computed, "look back" for free, syncable across devices.
- **Inspired by Year in Review / Spotify Wrapped**: the lookback/year-in-review is a first-class, delightful surface — not an afterthought.

### The anti-streak philosophy

Trackers measure **monthly totals/trends**, not daily streaks. A tracker is a count ("times exercised: 8"), a number ("books read: 2", "weight: 72kg"), a rating (1–5), or a boolean ("took a real vacation: yes"). The lookback views chart these across months/years so you see *trajectory*, never a fragile streak. Optional fields (struggles, mood, gratitude) stay visually quiet and never pressure the user — empty is first-class. The product should feel calm and rewarding to return to once a month.

## Who It's For

People who tried daily journaling/habit apps (Day One, Stoic, Habitica, streak trackers) and dropped off, but still want to reflect, track goals, and keep a record. The monthly cadence is the differentiator — it's a feature, not a limitation.

## User Journeys & Experiences

The atomic unit is the **Month**. Everything orbits it. A month is created lazily (it doesn't exist until the user opens or edits it). The **consolidated design (v7)** centers on the two things that matter: a **markdown journal per month**, and **goals broken down across the year and placed into the months where they'll happen**. The app shell is phone-first: a bottom tab bar (Year / Goals / Reflect / You) on mobile, a top nav on desktop, warm-paper calm-ocean palette, light & dark. (Insights is no longer its own tab: it lives inside **You**, and its old slot is now the **Reflect** surface.)

### 1. Year (home) — the semantic-zoom surface

A user lands on the current year, **defaulting to the Timeline**, and can **zoom** between three levels with a segmented control (Years / Year / Timeline) or ctrl + scroll:

- **Timeline (default)**: a clean, journaling-first scroll of the year, inspired by minimal calendar apps. Each month leads with the **lead of its journal entry**; goals and photos are demoted to a quiet meta line (count of goals, photo count); **future and un-written months read faint** ("yet to come" / "nothing written yet") so the written months carry the eye. A **"this month"** marker sits on the current month; the editable **theme/word of the year** sits above the list.
- **Years**: an overview of every year, each a 12-cell strip showing which months hold placed goals, with the year's theme word. Tap a year to zoom into it.
- **Year (grid)**: a two-column month grid. Each month cell shows the goal chips planned into it; a **"this month"** badge marks the current month; empty months read "＋ drop a goal". Below the grid, the **yearly goals list** supports **inline add** and **drag**: drag a goal onto a month to plan it, or back onto the list to unplan it. An editable **theme/word of the year** sits at the top.

### 2. Month — the journaling ritual surface

The user opens a month (back to the year, prev/next month) and sees the big serif month title, then two things:

- **Journal (markdown)**: a calm, natural editor — a plain text area with a cursor and a small formatting toolbar (heading, bold, italic, code, list, quote, link). No syntax highlighting or editor gimmicks. Tapping **Done** renders the markdown (`#`/`##`/`###` headings, `-`/`*` bullets, `1.` ordered lists, `>` quotes, `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `---` rules).
- **Goals this month**: each goal placed into this month, with a done toggle and its own **photos** (add/remove, subject to the plan's per-month photo limit).

### 3. Goals — manage and break down goals

Every goal for the year in two groups: **In the calendar** (planned into a month, shown with a month tag and a done toggle) and **Unplanned** (waiting on the board). Goals are added on the Year board; here the user reviews, toggles done, deletes, and jumps to a goal's month.

### 4. Reflect: the memories & AI-reflection surface

The reflective home, one tap from anywhere. Two parts:

- **Memories**: a horizontal rail of **photo memories** pulled from across every month and goal (newest first, tap to open that month). When there are no photos yet, the rail gracefully falls back to **remembered moments** (the lead lines of recent journal entries) so the surface is alive from day one.
- **Reflection**: a calm, AI-written read of **all past data**, grouped into three short lists: **Highlights** (follow-through and brightest moments), **Areas of growth** (the habit itself, trackers trending up, a life you can see), and **To work on** (unplaced goals, one in motion, a quiet month, gently). It runs **offline by default** (a deterministic heuristic over the whole vault) and **deepens with a Claude key** on demand. Never nags, never invents facts. Links out to the deeper **Look back** (year-in-review, this-month-last-year).

### 5. You: profile, insights & settings

Avatar + "your journal" summary; the full **Insights** panel folded in (all-time **stat tiles**: months journaled, goals achieved, years tracked, goals set, photos kept, words written; a **goals-across-the-year** bar chart; a **progress** bar + goal list; **trackers** across the year; and the **Look back** link); a **Light / Dark** theme control; and settings rows: **Plan** (Free / Premium → pricing), **Sync & account**, **Local folder**, **Trackers**, **Journaling assist**, **Monthly nudge**, **Export vault**, **Import data**, **Reset to demo**.

## What Success Looks Like

- Users who churned out of daily apps *return* — month after month, ~12 times a year, without guilt or nagging.
- Yearly goals get **remembered and achieved** because they're broken into monthly intentions and stay top-of-mind.
- Users build a record they genuinely enjoy **looking back on** — the timeline and Year in Review are the surfaces that create delight and retention.
- The free app is *complete* on its own (local-first, no account required); paid Cloud is reach & safety only, never a paywall on core journaling.

## Feature Set

Living catalog of capabilities, grouped by area. Marked `[shipped]` / `[in progress]` / `[planned]`. Capability-level descriptions — task-level breakdown lives in [TASKS.md](TASKS.md).

### Foundation & shell
- **Phone-first tabbed shell** `[shipped]`: Year / Goals / Reflect / You via a bottom tab bar on mobile and a top nav on desktop; chrome hidden on the welcome + month surfaces. React Router (HashRouter). (Insights folded into You; Reflect took its tab slot.)
- **Simplified welcome** `[shipped]` — the first screen is just the title, "one month at a time", and one animated inspirational CTA (a teal underline that flows into an arrow). Shown once per device.
- **Calm dark/light theming** `[shipped]` — CSS-variable theme with `data-theme`, warm-paper **calm-ocean** palette (teal accent `#3e8fa0` / `#6fb3c2` dark), generous whitespace.
- **Calm motion language** `[shipped]`: gentle enter-only route transitions (fade + small rise) and staggered list/grid entrances in the app (via the `motion` library, ease-out only, never bounce); scroll-triggered reveals, a staggered month-tile entrance, and a slow breathing moon glow on the landing page. Everything respects `prefers-reduced-motion` and never delays interactivity.
- **Local-first vault (zero-config)** `[shipped]` — IndexedDB persistence + seeded demo data so the app is alive on first run with no setup.
- **Open a real local folder** `[shipped]` — on Chromium (File System Access API), open a folder on disk as your vault. It's written as a human-browsable folder of files (`years/YYYY.json`, `months/YYYY-MM.md` with frontmatter, `.getsu/*.json`) and mirrored on every edit; reconnects after a reload. Truly own-your-data: the journal is plain files you can read, back up, or sync yourself.

### Year surface
- **Semantic zoom (Years / Year / Timeline)** `[shipped]`: segmented control + ctrl+scroll to move between a multi-year overview, the month grid, and a scrolling timeline. **Timeline is the default** zoom.
- **Journaling-first timeline** `[shipped]`: the timeline leads each month with the lead of its journal entry; goals/photos are a quiet meta line; future and un-written months read faint. A clean, minimal, journaling-focused scroll (inspired by minimal calendar apps).
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

### Reflect surface
- **Photo memories rail** `[shipped]`: a horizontal rail of every photo kept across all months and goals (newest first; tap to open the month). Falls back to remembered journal moments when no photos exist yet.
- **Whole-journey AI reflection** `[shipped]`: a calm three-part read of all past data (Highlights / Areas of growth / To work on), offline by default via a deterministic heuristic over the whole vault, deepening with a Claude key on demand. Provider-agnostic core op (`reflectOnJourney` + `buildReflectionMaterial`), DOM-free and testable.

### Insights & look back (now inside You)
- **All-time stat tiles** `[shipped]`: months journaled, goals achieved, years tracked, goals set, photos kept, words written. Folded into the **You** surface (no longer its own tab).
- **Goals-across-the-year bar chart** `[shipped]`: goals placed per month.
- **Progress** `[shipped]`: done/planned bar + goal list.
- **Look back (timeline, this-month-last-year, year-in-review)** `[shipped]`: reachable from You and from Reflect. (Not gated; ships free.)

### Plans & billing
- **Free / Premium split** `[shipped]` — Free is the complete local app (all surfaces, unlimited goals/entries, 3 photos/month). Premium adds sync, Siri/agent, 25 photos/month, cloud backup + web access.
- **Pricing surface** `[shipped]` — Premium **$6/month**, a **$3 intro for the first 3 months**, and an **occasional $3 sale**. Plan flips locally in-app to preview premium; real payment is a handoff (App Store / Play Store on mobile, Stripe on web).
- **Plan gating** `[shipped]` — photo limit (3/25), sync gated to Premium, Siri/agent gated to Premium.

### Own-your-data & sync
- **JSON export / import** `[shipped]` — own-your-data export + import from the You surface.
- **Open a real local folder** `[shipped]` — see Foundation & shell: the vault can live as a folder of plain files on disk (File System Access), mirrored on every edit.
- **Cross-device sync (Premium)** `[in progress]` — **no-backend, client-to-cloud**: whole-vault last-write-wins snapshot (`reconcileVaults` in core). A working **Supabase** snapshot ships on both web and native (native via plain fetch, no native module; free tier stays fully local when unconfigured). The **iCloud** (Apple) and **Google Drive appData** (Android) providers slot into the same seam and are a native-module handoff.
- **Siri & agent integration (Premium)** `[shipped, core]` — a provider-agnostic command layer in core (`applyIntent` / `parseIntent`: add a goal, write/append the month, add a highlight, set mood) drives both a `getsu://intent?phrase=…` deep link (Shortcuts / agent-callable today) and the future iOS App Intents. The native App Intents plugin (Swift) is a dev-build handoff.
- **Cloud photo storage** `[planned]` — move photos out of the snapshot into object storage with signed URLs before promoting "cloud photos".
- **Live deploy + billing** `[planned]` — real Supabase project + Vercel deploy + App Store/Play/Stripe billing (handoff to Philip; needs credentials).

### Platform & growth
- **Responsive desktop + mobile web** `[shipped]` — one web app: bottom tabs + full-bleed on mobile, top nav + centered column on desktop.
- **Marketing site** `[shipped]` — a self-contained static landing page (`apps/site/`) in the app's ocean design: mood-grid hero, feature grid, the free/premium split, and a live-demo CTA. Deploy to Vercel + the real demo URL is a handoff to Philip.
- **Native iOS/Android (Expo)** `[shipped]` — a real Expo React Native app (`apps/native`) sharing `packages/core` + `packages/shared`: Year / Goals / Insights / You + Month, markdown journal, goal placement, sync + Siri/Shortcuts wiring, same ocean design. Runs local-first today; store publishing is part of the billing/deploy handoff.
- **Installable PWA** `[shipped]` — web app manifest + maskable icon + offline service worker (runtime cache, shell fallback), so Getsu installs to the home screen and works offline.
- **Gentle monthly nudge** `[shipped]` — at most one calendar-month reminder (Web Notification), and only if the current month isn't journaled yet; tapping it opens that month. Opt-in from You; no daily nags, no streaks.
- **Marketing site + live demo** `[planned]` — Vercel config + DEPLOY.md done; actual deploy is Philip's.
- **CI / E2E** `[in progress]` — build + unit CI shipped; Playwright E2E planned.

### AI (journaling assist)
- **Reflection prompts / journaling assistant** `[shipped]` — the Month surface suggests reflection prompts you can tap to drop into your entry.
- **Auto-summarize a month; draft year-in-review** `[shipped]` — summarize the current month from its notes (Month), and draft a warm year-in-review from the year's data (Look back).
- **Whole-journey reflection** `[shipped]`: reads all past data into three calm lists (highlights, areas of growth, things to work on) on the Reflect surface; offline heuristic by default, Claude on demand.
- **Suggest goal → monthly breakdowns** `[shipped]` — turn a goal into a few monthly steps (Goals), placeable into the calendar with one tap.
- **Provider-agnostic, default Claude, offline-first** `[shipped]` — all of the above run offline with built-in heuristics (no key, no network); adding a bring-your-own Claude API key (stored only on-device, never synced/exported) upgrades them to the model. Core `ai.ts` is DOM-free and provider-agnostic; the web layer supplies the Claude provider via the official SDK.

### Native (later phase)
- **Expo React Native app** `[planned]` — a *real* RN app sharing `packages/core` + `packages/shared` (not a WebView shell).

## Scope Boundaries

- **Not a daily journal or habit/streak tracker.** No daily input requirement, no streaks, no broken-streak guilt, no daily nags. The monthly cadence is intentional and non-negotiable.
- **Not coupled to getsu-notes.** Standalone product with its own repo and app, despite the local-first overlap.
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
