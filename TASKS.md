---
status: active
last-updated: 2026-07-09
owner: Philip
---

# Execution Plan — Nekko Journal

> Converted from executionplan.md on 2026-06-29. ✅ = done per the prior plan; Part 1 below is the technical plan, Part 2 is the task checklist.

> **The plan + the build log, in one file.** The top half (Part 1) is the technical plan — how we build what `SPEC.md` describes. The bottom half (Part 2) is the task list — Now / Backlog / Shipped, recording how past features were built and how future ones will be. (Merged from the former `plan.md` + `tasks.md`.)

---

# Part 1 — Plan (how we build it)

> The **technical plan**: how we build what [SPEC.md](SPEC.md) describes. Stack, architecture, data model, conventions, design system, and constraints — the rules of the game before the agent starts playing. Update this whenever the technical approach changes.

## Stack

Decided — mirrors nekko-notes; **do not relitigate**.

- **Monorepo**: npm workspaces. *(pnpm and yarn are broken on this machine — do not use them.)*
- **Web app** (`apps/web`): Vite 6 + React 18 + TypeScript 5 (strict) + **Tailwind CSS v3** (not v4) + Zustand. React Router for view routing (HashRouter for Pages hosting).
- **Core engine** (`packages/core`): pure TS, no DOM/React imports, Vitest-unit-testable — vault file model, year/goal/month models, tracker computation, lookback queries, (later) AI orchestration.
- **Shared types** (`packages/shared`): types + contracts shared by web/core/native.
- **Storage / local-first**: a **vault = a folder of files**. Web uses the **File System Access API** (Chromium) to open a real local folder; falls back to **IndexedDB** (via `idb`) and ships with seeded demo data so the app is alive on first run with zero setup.
- **Photos**: stored under `media/`; in IndexedDB-mode stored as blobs (data URLs today). Drag/drop or file-picker upload; thumbnails generated client-side.
- **Cloud (optional)**: **Supabase** (cloud DB) + **Vercel** (hosting) — the Nekko Labs default stack (Philip's org-wide call). Free tier is fully local-first (no account); Cloud sync is paid (~$2/mo) on Supabase, hosted on Vercel.
- **AI** (later phase): provider-agnostic, **default Claude**. Use cases: monthly-reflection prompts/journaling assistant, auto-summarize a month, draft a year-in-review, suggest goal breakdowns. Graceful mock mode when no key set. BYO key stored locally.
- **Native** (`apps/native`, later phase): **Expo + React Native**, sharing `packages/core` + `packages/shared`.
- **No native node modules.** Cross-platform, **Windows-first** dev.

## Architecture Overview

`packages/core` is DOM-free and Vitest-tested (frontmatter round-trip, month CRUD, tracker aggregation, lookback queries). Web glue (File System Access, IndexedDB, image handling) lives in `apps/web/src/lib`.

```
apps/web/
  src/app/        shell: AppLayout, nav, routing, theme
  src/views/      year/     (12-month grid + goals panel + theme word)
                  month/    (reflection, highlights, struggles, photos, trackers, goal check-ins)
                  goals/    (goal CRUD + monthly breakdown + progress)
                  lookback/ (timeline, this-month-last-year, year-in-review)
  src/state/      Zustand stores (vault, ui, settings)
  src/lib/        web-only glue (fs access, idb, image/thumbnail)
packages/core/    vault/    (file model, load/save, frontmatter, idb adapter, seed demo data)
                  models/   (year, goal, month, tracker ops + validation)
                  lookback/ (cross-month queries, tracker aggregation, year-in-review)
                  (later) ai/ (reflection prompts, month summarize, year-in-review draft)
packages/shared/  types (Year, Goal, Month, Tracker, PhotoRef, Settings), MonthKey helpers
apps/native/      (later) Expo RN app sharing core + shared
```

### Vault file layout

A vault is a folder of files:

- `years/YYYY.json` — yearly goals, theme/word-of-the-year, settings.
- `months/YYYY-MM.md` — one Markdown file per month. YAML frontmatter holds structured fields (highlights, struggles, trackers, photo refs, goal check-ins, mood); the Markdown body is the free-form reflection.
- `media/` — photos (referenced by month entries).
- `.nekko/` — app metadata (settings, theme, tracker definitions, cache).

## Data Model

The atomic unit is the **Month**. Everything orbits it. `MonthKey` = `"YYYY-MM"`. A month is created **lazily** — it doesn't exist until the user opens/edits it. Empty struggles/photos are first-class.

```
Year   { year: number, theme?: string (word/phrase of the year),
         goals: Goal[], createdAt, updatedAt }

Goal   { id, year, title, why?: string, category?: string,
         metricKind?: 'milestone' | 'number' | 'boolean',
         target?: number, unit?: string,
         monthlyTargets?: Record<MonthKey, string|number>,  // intention/target per month
         plannedMonth?: number,     // 1–12: the month the goal is dragged into (v7)
         status: 'active' | 'done' | 'dropped',
         color?: string }

Month  { id: MonthKey ("YYYY-MM"), year, month (1-12),
         reflection: string (markdown body),
         highlights: string[],
         struggles: string[],            // optional; empty is fine
         gratitude?: string[],
         mood?: 1..5,
         photos: PhotoRef[],
         trackers: Record<TrackerId, number|boolean>,   // this month's values
         goalCheckins: Record<GoalId, { note?: string, value?: number, done?: boolean, photos?: PhotoRef[] }>,
         createdAt, updatedAt }

Tracker { id, name, kind: 'number'|'boolean'|'rating'|'count',
          unit?, target?, color?, icon?, active: boolean }
          // defined once (in .nekko), valued per month

PhotoRef { id, src (vault path or blob key), caption?, width?, height? }
```

### Tracker semantics (anti-streak by design)

Trackers measure **monthly totals/trends**, not daily streaks. A tracker is a count ("times exercised: 8"), a number ("books read: 2", "weight: 72kg"), a rating (1–5), or a boolean ("took a real vacation: yes"). The lookback views chart these across months/years so you see *trajectory*, never a fragile streak.

## Integrations & APIs

- **Supabase** (optional cloud): magic-link auth; whole-vault JSONB snapshot with last-write-wins reconciliation (`reconcileVaults` in core); RLS via `supabase/schema.sql`. Configured by `VITE_SUPABASE_*` env vars — when unset, the app is 100% local (free tier untouched). Upgrade path (per-record tables, Storage for photos) documented in repo `DEPLOY.md`.
- **Billing** (planned): **Premium $6/mo**, a **$3 intro for the first 3 months**, and an **occasional $3 sale**. Payment via **App Store / Play Store** on mobile and **Stripe** on the web (webhook flips the entitlement). App-level entitlement is `Settings.plan: 'free' | 'premium'`; the in-app Pricing screen flips it locally to preview premium. Handoff to Philip (needs accounts/credentials).
- **Sync (Premium, no-backend target)**: iCloud (Apple) + Google Drive appData (Android) writing the vault snapshot to the user's own cloud; optional Supabase snapshot remains the web/desktop path. See SPEC open questions.
- **Siri / agent (Premium, planned)**: iOS App Intents / Shortcuts + an agent-callable interface for "add goal" / "write this month".
- **AI** (later): provider-agnostic, default Claude; BYO key stored locally; graceful mock mode.

## Infrastructure & Deployment

- **Code repo**: `C:\Users\phili\code\nekko-journal` → GitHub **nekko-labs/nekko-journal** (public, MIT — Nekko Labs org).
- **Hosting**: Vercel (config + `supabase/schema.sql` (RLS) + `.env.example` + `DEPLOY.md` runbook done). Actual Supabase project + Vercel deploy + Stripe billing is a handoff to Philip (needs credentials).
- **CI**: build + unit tests via GitHub Actions (landed via PR #1). Playwright E2E planned.
- **Workflow**: land code via **PRs** — branch → push → `gh pr create` → merge immediately, no review (auto-merge; PRs exist for history). Keep PR descriptions to a few bullets; concise commit subjects. The obsurdian vault keeps its direct-commit-to-main convention.

## Design System & UI/UX

Direction locked (Dawn-inspired refresh, PR #2; polished via the impeccable toolkit, PR #4):

- **Typography**: Inter + Fraunces (system-font fallbacks — Fraunces→Georgia, Inter→system-ui — to avoid an external Google-Fonts `@import` that breaks offline use and hung preview screenshots). The "overused-font" warning from impeccable is accepted: the product register permits it and Philip chose it deliberately.
- **Palette**: warm paper, calm ocean — cream `#fbf7f1` / warm-dark `#1c1a18`; single **ocean-teal** accent (`#3e8fa0` → `#6fb3c2` dark) with a lighter `--accent-2` for gradients. An 8-color **goal palette** (`GOAL_PALETTE`, ocean-leaning) colors goal chips. Theming via CSS vars + `data-theme`. (Superseded the earlier indigo accent in the v7 redesign, 2026-07-09.)
- **Mood as a 5-step color primitive** — the mood-colored year grid is the signature surface.
- **Shape & motion**: 20px radii, soft diffuse shadows, gentle rise animations; ease-out tokens, mood-chip pop, sync-icon spin, strong reduced-motion support.
- **Semantic tokens**: success / error / warning / info (added in colorize pass). Removed an absolute-ban `border-left` accent stripe on goal cards in favor of a leading color dot.
- **States & copy**: permanence in destructive confirms; empathetic auth errors. Design-context docs live in `apps/web/PRODUCT.md` + `DESIGN.md` (impeccable, register=product).

## Coding Conventions

Mirror nekko-notes conventions; global defaults in `../../knowledgebase/principles/coding.md` (this file overrides them):

- npm workspaces (no pnpm/yarn — broken on this machine).
- TypeScript strict.
- Tailwind v3 (not v4).
- Pure-TS, DOM-free `packages/core` — Vitest-testable, no React/DOM imports.
- Windows-first, cross-platform code; no native node modules.
- Keep the build green (`npm run build` at repo root, `npm run dev` clean) before each commit.
- Verify UI changes in the browser preview with a screenshot; don't claim done without running it.

## Constraints

- **Local-first is the law**: never require a server for core journaling. AI/sync are later enhancements that degrade gracefully.
- **Respect the monthly ritual**: no daily nags, no streak guilt, no chore-feeling. Optional fields stay optional and visually quiet. The product should feel calm and rewarding to return to once a month.
- **No pnpm, no yarn, no native node modules.** Windows-first dev, cross-platform code.
- **Free tier must be fully functional** — the complete app, no account required. Cloud is reach & safety only.
- Don't ask the user questions during the build; record open questions in `memory.md`.

## Key Technical Decisions

- **Standalone product** — own repo (`nekko-labs/nekko-journal`) + app, not coupled to nekko-notes, despite the local-first overlap. Keeps the product story focused.
- **Native = a real Expo RN app**, not a WebView shell (unlike nekko-notes), because Nekko Journal has no canvas/DOM-bound editor — the UI is RN-friendly and can share `packages/core` + `packages/shared`.
- **Nekko Labs default stack = Supabase + Vercel** (Philip's org-wide call).
- **Free/paid split (honest)**: free = the *complete* app (all surfaces incl. Insights, unlimited entries/goals, monthly markdown journal, local photos up to 3/month, offline, JSON export, no account). **Premium $6/mo** ($3 intro 3 months, occasional $3 sale) = reach & safety only (cross-device sync, Siri/agent, 25 photos/month, encrypted backup, web access). Insights are NOT gated.
- **v7 consolidation (2026-07-09)**: the app is reframed around two things — a per-month markdown journal and goals dragged onto the months where they'll happen. Nav is a phone-first tab bar (Year/Goals/Insights/You); Year has semantic zoom (Years/Year/Timeline); Month is journal + goals-with-photos. Palette moved indigo → **ocean teal**. Highlights/struggles/trackers/mood stay in the model (import/migration) but the UI folds prose into the journal.
- **Journal editor**: deliberately a plain textarea (natural cursor) + a formatting toolbar that inserts markdown; no in-editor syntax highlighting. A tiny dependency-free renderer handles `#`/`-`/`>`/`**`/`*`/`` ` ``/links/`---` (keeps the bundle small + offline).
- **Photo limits**: enforced per month in core (`addGoalPhoto(..., limit)` returns `undefined` at the ceiling); 3 free / 25 premium (`photoLimit(plan)`).
- **Cloud sync MVP = whole-vault JSONB snapshot, last-write-wins** at the vault level (`reconcileVaults` in core). Simple & correct for one user across their own devices.
- **Zustand snapshot caching**: selectors returning a fresh array (`.filter(...)` / `?? []`) trigger "getSnapshot should be cached" infinite loops. Fix: select the stable source and derive in the render body; use a module-level constant for empty-array fallbacks. The Month surface subscribes to the whole `vault` ref (replaced on every `mutate`) so in-place edits re-render reliably.
- **impeccable design tooling is gitignored** (`.claude/skills/impeccable/`, `.github/skills/impeccable/`, `.claude/settings.local.json`) — re-installable via `npx impeccable install`; only the design artifacts (PRODUCT.md/DESIGN.md) + code polish are committed.

---

# Part 2 — Tasks (what's built and what's next)

> The spec + plan broken into **small, reviewable, independently testable work items**. This is the project-level build checklist; phase grouping from the original build plan is preserved as sub-headings.

> **Status values**: `[ ]` not-started · `[~]` in-progress · `[x]` done · `[!]` blocked
>
> Keep IDs stable (T1, T2, …) — don't renumber. When a task ships, move it to **Shipped** with a one-line note.

## Now / In Progress

- [~] **T21** — Native iOS/Android Expo app (`apps/native`) sharing `packages/core` + `packages/shared`, ocean design; scaffold + key screens. · Added: 2026-07-09 · [spec](SPEC.md#platform--growth)
- [ ] **T22** — Cross-device sync (Premium): no-backend iCloud (Apple) + Google Drive appData (Android) vault-snapshot sync; Supabase snapshot stays the web path. · Added: 2026-07-09 · [spec](SPEC.md#own-your-data--sync)
- [ ] **T23** — Siri / agent integration (Premium): iOS App Intents / Shortcuts + agent-callable "add goal" / "write this month". · Added: 2026-07-09 · [spec](SPEC.md#own-your-data--sync)
- [ ] **T24** — Real billing: App Store / Play Store IAP + Stripe (web) flipping the `plan` entitlement; the in-app toggle is a preview only. Handoff to Philip. · Added: 2026-07-09 · [spec](SPEC.md#plans--billing)
- [ ] **T16** — CI: Playwright E2E (build + unit CI already done via PR #1). · Added: 2026-06-29

## Backlog / Planned

### Phase 3 — Polish & platform (remaining)
- [ ] **T15** — Marketing site + live demo deployed (Vercel) — Vercel config + DEPLOY.md done; actual deploy is Philip's. · Added: 2026-06-29 · [spec](SPEC.md#platform--growth)

### Phase 3c — Cloud, hosting & tiering (handoff)
- [ ] **T_cloud_handoff** — Actual Supabase project + Vercel deploy + Stripe billing — handoff to Philip (needs account credentials). Includes moving photos from data URLs to Supabase Storage (private bucket + signed URLs) before promoting "cloud photos". · Added: 2026-06-29 · [spec](SPEC.md#own-your-data--sync)

### Phase 4 — AI (later)
- [ ] **T17** — Reflection prompts / journaling assistant (mock-mode friendly). · Added: 2026-06-29 · [spec](SPEC.md#ai-later-phase)
- [ ] **T18** — Auto-summarize a month from sparse notes; draft year-in-review. · Added: 2026-06-29 · [spec](SPEC.md#ai-later-phase)
- [ ] **T19** — Suggest goal → monthly breakdowns from a natural-language goal. · Added: 2026-06-29 · [spec](SPEC.md#ai-later-phase)

### Phase 5 — Native (later)
- [ ] **T20** — Expo RN app sharing `packages/core` + `packages/shared` (real native, not WebView). · Added: 2026-06-29 · [spec](SPEC.md#native-later-phase)

## Shipped

### Phase 0 — Docs & spec
- [x] **T1** — Project docs in obsurdian (README, AGENTS, original-prompt, build prompt, memory).

### Phase 1 — Foundation
- [x] **T2** — Monorepo scaffold (npm workspaces), tsconfig (strict), Tailwind v3, MIT license, app README, `.gitignore`, git init + GitHub repo (public `nekko-labs/nekko-journal`). · [spec](SPEC.md#foundation--shell)
- [x] **T3** — `packages/shared` — core types (Year, Goal, Month, Tracker, PhotoRef, Settings) + MonthKey helpers. · [spec](SPEC.md#foundation--shell)
- [x] **T4** — `packages/core` — vault file model (frontmatter round-trip), month/goal/tracker ops, lookback aggregation, seed demo data, **10 Vitest tests passing**. · [spec](SPEC.md#foundation--shell)
- [x] **T5** — App shell: nav (Year/Month/Goals/Look back), dark/light theming, Zustand vault store, React Router (HashRouter for Pages). · [spec](SPEC.md#foundation--shell)

### Phase 2 — Surfaces
- [x] **T6 (partial)** — Local-first vault: IndexedDB persistence + seeded demo data (zero-config first run) done & verified. (Folder-open still in T6 above.) · [spec](SPEC.md#own-your-data--sync)
- [x] **T7** — Year view: 12-month grid + yearly goals panel + theme word + year switcher. · [spec](SPEC.md#year-surface)
- [x] **T8** — Month view: reflection editor, highlights, struggles (optional/de-emphasized), photos (drag/drop), trackers, goal check-ins, mood. · [spec](SPEC.md#month-surface)
- [x] **T9** — Goals view: goal CRUD + monthly breakdown + color. (Progress in T9b.) · [spec](SPEC.md#goals-surface)
- [x] **T10** — Look back: timeline + this-month-last-year + year-in-review. · [spec](SPEC.md#look-back--insights)

### Phase 3 — Polish & platform
- [x] **T12** — Trackers: monthly entry UI + per-month bar charts in Insights. (Define/edit UI in T12b.) · [spec](SPEC.md#month-surface)
- [x] **T16 (partial)** — CI build + unit via PR #1. (E2E in T16 above.)

### Phase 3b — Multi-year, design & analytics (PR #2, 2026-06-21)
- [x] **T_design_refresh** — Dawn-inspired design refresh: warm paper palette, mood color primitive, soft shadows, 20px radii, gentle animations. · Done: 2026-06-21
- [x] **T_month_cards** — Bigger mood-colored month cards in the Year view (photo thumb + highlights). · Done: 2026-06-21 · [spec](SPEC.md#year-surface)
- [x] **T_all_years** — All Years multi-year overview (12-month mood strip per year). · Done: 2026-06-21 · [spec](SPEC.md#look-back--insights)
- [x] **T_insights** — Insights analytics: lifetime stats, mood trend, tracker bar charts, goal completion. · Done: 2026-06-21 · [spec](SPEC.md#look-back--insights)

### Phase 3c — Cloud, hosting & tiering (PR #3, 2026-06-21)
- [x] **T_cloud_sync** — Optional Supabase cloud sync (magic-link auth, whole-vault snapshot LWW, plan-gated); free tier stays fully local when unconfigured. · Done: 2026-06-21 · [spec](SPEC.md#own-your-data--sync)
- [x] **T_pricing** — Account & sync + Pricing surfaces; free / $2-mo Cloud split. · Done: 2026-06-21 · [spec](SPEC.md#own-your-data--sync)
- [x] **T_deploy_config** — Vercel hosting config + `supabase/schema.sql` (RLS) + `.env.example` + `DEPLOY.md` runbook. · Done: 2026-06-21 · [spec](SPEC.md#own-your-data--sync)

### Phase 3d — Design polish (PR #4, 2026-06-22)
- [x] **T_impeccable** — impeccable design toolkit pass (init → clarify → colorize → animate): semantic tokens, destructive-confirm permanence, empathetic auth errors, ease-out/motion tokens, leading color dot on goal cards. Added `apps/web/PRODUCT.md` + `DESIGN.md`. · Done: 2026-06-22

### Phase 4e — Installable PWA + monthly nudge (2026-07-09)
- [x] **T14** — PWA: `manifest.webmanifest` + maskable `icon.svg` + offline `sw.js` (runtime stale-while-revalidate cache, navigation shell fallback), registered in `main.tsx` (production only). Ocean theme-color (light/dark). Gentle monthly nudge (`lib/nudge.ts`): at most one Web Notification per calendar month, only when the current month isn't journaled; opt-in from You (requests permission); tapping opens that month. · Done: 2026-07-09 · [spec](SPEC.md#platform--growth)

### Phase 4d — Goal progress + tracker management (2026-07-09)
- [x] **T9b** — Computed goal progress: core `goalProgress` (number goals accumulate monthly check-in `value`s toward target; milestone/boolean are done-or-not) + `yearGoalsProgress` aggregate. Insights progress bar uses averaged fraction; per-goal number progress bars show value/target. 5 new Vitest. · Done: 2026-07-09 · [spec](SPEC.md#goals-surface)
- [x] **T12b** — Trackers management: core `updateTracker`/`archiveTracker`/`removeTracker` (deletes values across months); `TrackersView` (add/edit/archive/restore/delete, kind + unit + target + color) linked from You; quiet monthly tracker-entry section on Month (count stepper / number / rating chips / yes-no); restored per-tracker MonthBars charts in Insights. Verified in preview. · Done: 2026-07-09 · [spec](SPEC.md#month-surface)

### Phase 4c — Month photos polish (2026-07-09)
- [x] **T11** — Photos polish: client-side downscale + re-encode on upload (`lib/image.ts`, caps longest edge at 1600px so the vault snapshot stays small; stores width/height), multi-select upload honoring the plan limit per file, editable captions, and a full-screen `Lightbox` (prev/next, keyboard Esc/←/→, caption editor, delete). Verified in preview. · Done: 2026-07-09 · [spec](SPEC.md#month-surface)

### Phase 4b — Local-first folder vault (2026-07-09)
- [x] **T6** — Local-first vault: File System Access "open folder" support. Core `serializeVaultToFiles`/`parseVaultFromFiles` own the human-browsable folder-of-files layout (`years/YYYY.json`, `months/YYYY-MM.md`, `.nekko/*.json`) with a lossless round-trip (4 new Vitest); web `lib/fsaccess.ts` does the I/O, handle persisted in IndexedDB, reconnect after reload. · Done: 2026-07-09 · [spec](SPEC.md#own-your-data--sync)
- [x] **T13** — Own-your-data: File System Access folder save — the vault mirrors to the connected folder on every edit (debounced); "Local folder" row in You (open / reconnect / disconnect). · Done: 2026-07-09 · [spec](SPEC.md#own-your-data--sync)

### Phase 4 — v7 ocean redesign + plans (2026-07-09)
- [x] **T_v7_model** — Core model + tokens: `Goal.plannedMonth`, `GoalCheckin.photos`, `Settings.plan`/`notify`, `GOAL_PALETTE`/`goalColor`, `photoLimit` + `addGoalPhoto`/`removeGoalPhoto`/`countMonthPhotos`/`setGoalPlannedMonth`/`goalsInMonth`; ocean CSS tokens + `--grad`; reseeded demo (placed goals, markdown journals, multi-year history). 18 Vitest passing. · Done: 2026-07-09
- [x] **T_v7_shell** — Phone-first tabbed shell (bottom tabs mobile / top nav desktop), simplified welcome (title + "one month at a time" + animated underline→arrow CTA), semantic-zoom Year (Years/Year/Timeline + ctrl-scroll) with drag-goals-onto-months + inline add. · Done: 2026-07-09 · [spec](SPEC.md#year-surface)
- [x] **T_v7_month** — Month: markdown journal with a natural textarea + formatting toolbar (no highlighting), dependency-free renderer, goals-this-month with done toggle + per-goal photos honoring the plan limit. · Done: 2026-07-09 · [spec](SPEC.md#month-surface)
- [x] **T_v7_surfaces** — Goals (in-calendar / unplanned), Insights (stat tiles + goal bars + progress), You (profile + theme + settings + export/import). · Done: 2026-07-09
- [x] **T_v7_billing** — Free/Premium plans ($6/mo, $3 intro 3 months, occasional $3 sale), plan gating (photos 3/25, sync + Siri Premium), Pricing surface, plan preview toggle. · Done: 2026-07-09 · [spec](SPEC.md#plans--billing)
- [x] **T_v7_responsive** — Responsive desktop + mobile web verified in preview (light + dark). · Done: 2026-07-09 · [spec](SPEC.md#platform--growth)
