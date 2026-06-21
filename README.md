# Nekko Journal 🌙

A **monthly** journaling and goal-tracking app — the calm antidote to daily-habit apps that become a chore and get abandoned.

Daily is too much. A year is too long. **A month is just right.** Set goals for the year, break them into months, capture each month's highlights, struggles (optional), and photos — then look back at your life at a month scale.

## Why monthly?

- **Calm, not nagging.** You show up ~once a month. No daily push, no broken-streak shame.
- **Goals you don't forget.** Yearly goals are visible and broken into monthly intentions, so they stay top-of-mind and actually get done.
- **A life you can look back on.** Months hold highlights, struggles, and photos. Scroll back through your year, or "this month last year."

## Features (MVP)

- **Year view** — a 12-month grid + your yearly goals + a word/theme for the year.
- **Month view** — reflection, highlights, optional struggles, photos, lightweight trackers, and goal check-ins.
- **Goals view** — define yearly goals and break each into monthly intentions; see progress.
- **Look back** — a timeline of past months, "this month last year," and a year-in-review.
- **Local-first** — your data lives in your browser (IndexedDB) and can be saved to a folder you own. Zero-config seeded demo on first run.

## Stack

Vite + React 18 + TypeScript (strict) + Tailwind CSS v3 + Zustand. Local-first vault (IndexedDB + File System Access API). Pure-TS, Vitest-tested core engine. Native (Expo RN) planned.

## Develop

```bash
npm install
npm run dev      # web app at http://localhost:5173
npm test         # core engine unit tests
npm run build    # full build
```

## Monorepo

```
packages/shared   shared TypeScript types (Year, Goal, Month, Tracker, …)
packages/core     pure-TS engine: vault model, frontmatter, lookback aggregation (Vitest)
apps/web          the web app (Vite + React)
```

MIT © Nekko Labs
