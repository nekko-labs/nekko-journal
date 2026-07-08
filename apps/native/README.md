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
- **You**: Light/Dark + Free/Premium toggles, plan copy.

Shared logic (vault model, goal placement, photo limits, seed, lookback) is
imported from `@nekko/journal-core`, so behavior stays in lock-step with web.

## Still to wire (see repo TASKS.md T22–T24)

- **Sync (Premium, no backend):** `src/sync.ts` defines the `SyncProvider` seam.
  Plan: **iCloud** on Apple (iCloud Drive document in the app's ubiquity
  container, declared in `app.json`, or `NSUbiquitousKeyValueStore` for the
  snapshot) and **Google Drive `appDataFolder`** on Android. Reconciliation
  reuses core's `reconcileVaults` (whole-vault last-write-wins). Falls back to
  the optional Supabase snapshot if client-to-cloud proves unreliable.
- **Siri & agent (Premium):** iOS **App Intents / Shortcuts** for "add a goal"
  and "write this month", plus an agent-callable interface. Gated on
  `settings.plan === 'premium'`.
- **Photos:** add via `expo-image-picker` (core already stores them per goal and
  enforces the per-month limit).
- **Billing:** App Store / Play Store IAP flipping `settings.plan`. The You
  screen toggle is a local preview only.
- **Fonts:** load **Fraunces** via `expo-font` (currently falls back to Georgia).
