# Nekko Journal — Native (iOS / Android)

A real Expo + React Native app that shares the same engine as the web app
(`packages/core` + `packages/shared`) and the same warm-paper / calm-ocean
design. It is intentionally **outside** the web npm workspace so it never affects
the web build or CI; it installs and runs on its own.

## Run it

```bash
cd apps/native
npm install
npx expo install --fix   # align RN/Expo peer versions for your SDK
npx expo start           # then press i (iOS) / a (Android), or scan in Expo Go
```

The app is **local-first**: on first launch it seeds the same demo vault as the
web app and persists to `AsyncStorage`. No account, no network required.

## What's implemented

- Bottom tabs: **Year / Goals / Insights / You** + a pushed **Month** screen.
- **Year**: month grid with placed-goal chips, "this month" badge, inline add.
- **Month**: markdown **journal** (plain multiline `TextInput`, no highlighting)
  that renders on Done via a tiny RN markdown renderer; **goals this month**
  with a done toggle and the per-month photo counter (3 free / 25 premium).
- **Goals**: plan each goal into a month with a tappable month picker (the
  native stand-in for the web's drag-onto-a-month), toggle done.
- **Insights**: all-time stat tiles, goals-across-the-year bars, progress.
- **You**: Light/Dark + Free/Premium toggles, plan copy, a **Sync** row
  (Premium; "Sync now" + status), and a **Siri & Shortcuts** cheat-sheet.

Shared logic (vault model, goal placement, photo limits, seed, lookback, **sync
reconciliation**, **agent/Siri intents**) is imported from `@nekko/journal-core`,
so behavior stays in lock-step with web and is unit-tested there.

## Sync (Premium) — `src/sync.ts`

`SyncProvider` is the seam; `getSyncProvider(deviceId)` picks the backend. A
working **Supabase snapshot** provider (plain `fetch`/PostgREST, no native
module) ships today — set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
and the You → Sync row lights up. `store.syncNow()` reconciles with core's
`reconcileVaults` (whole-vault last-write-wins), same as the web path.

**No-backend target (handoff — needs a dev build + native modules):** **iCloud**
on Apple (iCloud Drive document in the ubiquity container declared in `app.json`,
or `NSUbiquitousKeyValueStore`) and **Google Drive `appDataFolder`** on Android.
Both drop into the same `SyncProvider` interface. The device-scoped Supabase
table is the MVP; promote to the authenticated, RLS-guarded table (see repo
`supabase/schema.sql`) before real users.

## Siri & agent (Premium) — `src/intents.ts` + core `intents.ts`

The command vocabulary and all logic live in **core** (`applyIntent`,
`parseIntent`, `resolveGoalByTitle`, `intentCatalog` — unit-tested). Native
`runPhrase` / `runIntent` run an intent against the live store and persist;
`handleDeepLink` handles `nekkojournal://intent?phrase=...` (wired in `App.tsx`),
which is how a **Shortcut** or an **agent** invokes it today. Native **App
Intents** (a Swift `AppIntent` per action + Shortcuts donation) are added via an
Expo config plugin in a dev build that forwards to `runPhrase` — handoff.

## Still to wire

- **Photos:** add via `expo-image-picker` (core already stores them per goal and
  enforces the per-month limit).
- **Billing:** App Store / Play Store IAP flipping `settings.plan`. The You
  screen toggle is a local preview only.
- **Fonts:** load **Fraunces** via `expo-font` (currently falls back to Georgia).
