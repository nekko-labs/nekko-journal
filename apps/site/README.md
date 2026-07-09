# Marketing site

A single, self-contained static landing page for Nekko Journal (`index.html`, no build step, inline CSS/JS, ocean design language matching the app). It links to the live demo (the app itself) and the GitHub repo.

## Deploy (handoff to Philip)

Static hosting on Vercel (Nekko Labs team). Two options:

- **Separate project** pointed at `apps/site/` with no build command and output dir `.` (serves `index.html`). Suggested domain: `journal.nekkolabs.com` (or a `.vercel.app` default).
- Or fold into the app's Vercel project as the root and host the PWA under a path.

The live-demo CTA currently points at `https://nekko-journal.vercel.app/` — update it to the real demo URL once the app is deployed (see repo `DEPLOY.md`). The GitHub links are live.

## Local preview

```
npx serve apps/site      # or: python -m http.server -d apps/site 4180
```
