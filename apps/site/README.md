# Marketing site

A two-page static marketing site for Getsu (no build step, moon + warm-paper design language matching the app). Heavy whitespace, subtle enter-only motion, and calm CTAs into the app.

- `index.html`: the landing page (animated mark hero, signature year grid, the monthly ritual, the three calm truths, a pricing whisper)
- `pricing.html`: the pricing page, served at `/pricing` in production (Vercel `cleanUrls`); Free vs Premium cards, the "never a paywall on writing" promise, and a quiet FAQ
- `site.css`: shared tokens, nav, buttons, footer, and motion primitives

Entrance/reveal hiding is gated on a `.js` root class each page sets synchronously, so content stays visible with scripts disabled or rendering throttled.

## How it ships

The whole repo deploys as **one Vercel project** (`getsu.app`) via the combined build in [`scripts/build-site.mjs`](../../scripts/build-site.mjs):

- `/` → this landing page (`apps/site/*`)
- `/app/` → the local-first app (`apps/web/dist`; Vite `base: './'` so it runs under a subpath)

See the repo [`DEPLOY.md`](../../DEPLOY.md) for the full deploy + domain setup.

## Local preview

```
npm run build:site        # assembles _site/ (landing at /, app at /app/)
npx serve _site           # or: python -m http.server -d _site 4181
```
