---
status: active
last-updated: 2026-06-25
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

The atomic unit is the **Month**. Everything orbits it. A month is created lazily — it doesn't exist until the user opens or edits it. The app is organized around four core surfaces:

### 1. Year (home) — the landing surface

A user opens the app and lands on the current year. They see a **12-month grid**: each month cell shows a thumbnail/highlight, a filled/empty state (journaled or not), and a glance at mood/photo count. Clicking a cell goes to that Month. A **yearly goals** panel shows the year's goals at-a-glance with progress. An optional, editable **theme/word of the year** sits at the top, and a year switcher lets them move between years.

### 2. Month — the journaling ritual surface

Once a month, the user opens the current month and reflects. There's a calm, minimal **Markdown reflection editor**; a **highlights** list (add/remove); an optional, visually de-emphasized **struggles** list (so it never feels mandatory); **photos** (drag/drop or pick, in a captioned grid); **trackers** (this month's values via steppers/toggles/ratings); and a **goal check-in** for each active goal (a quick "how did this month go" note + progress). Optional **mood** and **gratitude** round it out, with gentle prompts ("What's one thing you're proud of this month?").

### 3. Goals — manage and break down goals

The user lists and edits their yearly goals (title, why, category, color), then **breaks each goal into months** by setting a monthly intention/target — the "plan it so you remember and achieve it" core value. Progress across the year is computed from month check-ins and trackers.

### 4. Look back (Timeline / Year in Review) — the delight surface

The user scrolls chronologically through past months (highlight + photo + mood) in a **timeline**, gets a **"this month last year"** callback, and at year-end sees a **Year in Review** montage — top photos, all highlights, tracker totals, goals achieved (Spotify-Wrapped energy; shareable/exportable later).

The app shell offers Year / Month / Goals / Look back via a left rail or top tabs, a calm dark/light theme, and generous whitespace.

## What Success Looks Like

- Users who churned out of daily apps *return* — month after month, ~12 times a year, without guilt or nagging.
- Yearly goals get **remembered and achieved** because they're broken into monthly intentions and stay top-of-mind.
- Users build a record they genuinely enjoy **looking back on** — the timeline and Year in Review are the surfaces that create delight and retention.
- The free app is *complete* on its own (local-first, no account required); paid Cloud is reach & safety only, never a paywall on core journaling.

## Feature Set

Living catalog of capabilities, grouped by area. Marked `[shipped]` / `[in progress]` / `[planned]`. Capability-level descriptions — task-level breakdown lives in [TASKS.md](TASKS.md).

### Foundation & shell
- **App shell & navigation** `[shipped]` — Year / Month / Goals / Look back via nav rail/tabs, React Router routing.
- **Calm dark/light theming** `[shipped]` — CSS-variable theme with `data-theme`, warm "dawn" paper palette, generous whitespace.
- **Local-first vault (zero-config)** `[in progress]` — IndexedDB persistence + seeded demo data so the app is alive on first run with no setup. Open-a-real-local-folder (File System Access API) still planned.

### Year surface
- **12-month grid** `[shipped]` — mood-colored month cards with photo thumb + highlights; filled/empty journaled state.
- **Yearly goals panel** `[shipped]` — the year's goals with at-a-glance progress.
- **Theme / word of the year** `[shipped]` — optional, editable.
- **Year switcher** `[shipped]` — prev/next year, jump to year.
- **All Years multi-year overview** `[shipped]` — a 12-month mood strip per year, to see across multiple years.

### Month surface
- **Reflection editor** `[shipped]` — calm/minimal Markdown body.
- **Highlights** `[shipped]` — add/remove list.
- **Struggles (optional)** `[shipped]` — visually de-emphasized so it's never mandatory.
- **Photos** `[in progress]` — drag/drop or picker upload (data URL today); thumbnails, captions UI, and lightbox still planned.
- **Trackers (monthly entry)** `[shipped]` — steppers/toggles/ratings for each active tracker; define/edit-trackers UI still planned.
- **Goal check-ins** `[shipped]` — per-goal "how did this month go" note + progress.
- **Mood & gratitude** `[shipped]` — optional, gentle prompts.

### Goals surface
- **Goal CRUD** `[shipped]` — title, why, category, color.
- **Monthly breakdown** `[shipped]` — set a monthly intention/target per month for each goal.
- **Computed progress across the year** `[planned]` — derived from month check-ins / trackers.

### Look back & insights
- **Timeline** `[shipped]` — scroll chronologically through past months (highlight + photo + mood).
- **"This month last year"** `[shipped]` — callback to the same month a year prior.
- **Year in Review** `[shipped]` — end-of-year montage (top photos, highlights, tracker totals, goals achieved); shareable/exportable still planned.
- **Insights analytics** `[shipped]` — lifetime stats, mood trend, tracker bar charts, goal completion. (Not gated — ships free.)

### Own-your-data, cloud & tiering
- **JSON export / snapshot** `[shipped]` — own-your-data export from IndexedDB.
- **Optional Supabase cloud sync** `[shipped]` — magic-link auth, whole-vault last-write-wins snapshot, plan-gated; free tier stays fully local when unconfigured.
- **Account & sync + Pricing surfaces** `[shipped]` — free / $2-mo Cloud split (free = complete app; paid = sync + backup + cloud photos + web access).
- **File System Access folder save** `[planned]` — save the vault to a real local folder.
- **Cloud photo storage (Supabase Storage)** `[planned]` — move photos out of the vault snapshot into a private bucket with signed URLs.
- **Live deploy + billing** `[planned]` — actual Supabase project + Vercel deploy + Stripe billing (handoff to Philip; needs credentials).

### Platform & growth
- **Responsive mobile-web** `[in progress]` — mobile bar done; installable PWA + gentle monthly nudge (local notification/reminder) planned.
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
- **Free tier is the full app** — Insights/analytics, unlimited entries/goals/trackers, local photos, offline, JSON export, no account. Paid Cloud is reach & safety only.

## Open Questions

- **Reflection editor depth** — starting with a lightweight Markdown textarea; decide later whether a richer block editor is worth it for monthly free-form prose (likely overkill).
- **Monthly nudge mechanism** — PWA local notification vs. email vs. native push; deferred until the platform phase.
- **Photo storage at scale** — IndexedDB blobs / data URLs fine for demo; move to object storage (Supabase Storage, private bucket + signed URLs) before promoting "cloud photos".
- **Supabase free-tier numbers** — verify at supabase.com/pricing before publishing plan copy (prior research was done without live web access).
- **AI surfaces** — reflection prompts, month auto-summary, year-in-review draft, goal→month breakdown; all later-phase, mock-mode-friendly.

<!-- Resolved questions and their decisions live in memory.md. -->
