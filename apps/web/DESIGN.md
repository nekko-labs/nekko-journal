# Design

/ Visual system for Nekko Journal. "Warm paper, monthly ritual." Calm, editorial-but-trustworthy product UI. /

## Color

/ Light is the default (a calm evening at a warm desk); dark is an equally-warm night mode. Restrained strategy: warm tinted neutrals + a single indigo accent, plus a 5-step mood ramp used as a data primitive and a standard semantic set. Authored as CSS custom properties; values below are the live tokens. /

- Body background (light): `#fbf7f1` — warm cream paper (deliberate brand identity, carried with serif + mood color, not a default-tint reflex)
- Surface / surface-2 (light): `#fffdfa` / `#f4efe7`
- Border (light): `#ece4d8`
- Ink / soft / faint (light): `#2b2724` / `#7a726a` / `#a89f93`
- Body background (dark): `#1c1a18` — warm near-black, not OLED black
- Surface / surface-2 (dark): `#262320` / `#2f2c27`
- Ink / soft / faint (dark): `#ede6dc` / `#a39a90` / `#756f62`
- Accent: `#7c83ff` light → `#9aa0ff` dark (lifted for contrast). Used only for primary action, current selection, focus, and state — never decoration.
- Accent soft (tint wash): `#ecedff` light / `#262a45` dark
- **Mood ramp (1→5, low→joyful):** `#9ba6c9` · `#a9c0d0` · `#c9c2ba` · `#9fc6b0` · `#f4c15b` (dark variants slightly deeper). The signature primitive — colors the year grid and charts; always paired with emoji + label, never color-alone.
- **Semantic:** success `#3f9d77`, error `#c2563a`, warning `#c98a2b`, info = accent. Used for state (sync, validation, goal-done), with ≥4.5:1 text contrast.

## Typography

/ One contrast pair: a soft serif for identity/headings (warmth, "journal" feel) and a neutral sans for all UI/body/data. No display fonts in labels or controls. /

- Headings / month + year titles / theme word: **Fraunces** (soft serif), 500–600. Fallback: Georgia, serif.
- UI, body, labels, data, buttons: **Inter** / system-ui sans, 400–600.
- Section labels: small, medium-weight, uppercase with mild tracking — used sparingly as a quiet metadata layer, not an eyebrow above every block.
- Reading measure for reflection prose: ~640px container.

## Components

/ Familiar product vocabulary; consistent across surfaces. States: default, hover, focus, active, disabled where applicable. /

- **Card**: 20px radius, 1px hairline border (`--border`), soft diffuse shadow (`--shadow-soft`), lifts to `--shadow-lift` on hover. The month cell, year row, and section panel share this base. (No side-stripe accents — banned; use full border + a mood/goal color dot or a tint wash instead.)
- **Button**: pill (`rounded-full`), hairline border; `.btn-primary` fills with accent. Subtle press feedback.
- **Input / textarea**: 16px radius, hairline border, accent focus ring (3px accent-soft glow).
- **Month cell**: large card, mood-color top stripe (decorative-but-meaningful: encodes the month's mood), photo thumb, up to 2 highlights.
- **Year strip**: 12 squares, each mood-colored if journaled else dashed-empty.
- **Charts**: inline SVG bars (no chart lib), tinted by tracker/mood color.
- **Mood picker**: 5 emoji chips; selected gets accent ring.
- **Nav**: left rail (desktop) + top bar (mobile), accent-soft active state.

## Motion

/ Product timing: 150–250ms for state/feedback, up to ~350ms for entrances. Ease-out only (quint/expo), no bounce/elastic. Motion conveys state, not decoration. Honors `prefers-reduced-motion`. /

- State transitions (hover, focus, theme, selection): 150–200ms.
- Card hover lift: shadow + 1–4px translate, ~250ms ease-out-quint.
- List entrance: tasteful sibling stagger (year cells, year rows), capped total time; one reveal per item, reduced-motion → instant.
- Micro-interactions: button press, mood-chip pop, tracker increment, sync spinner — small, fast, purposeful.
- No orchestrated full-page load choreography; the app loads into the task.

## Layout

- App shell: fixed left rail (≥md) / top bar (<md); scrollable content; centered max-width per surface (year ~6xl, month/goals/insights ~3xl, account ~2xl).
- Responsive is structural (rail→bar, multi-col→single), not fluid type.
- Year grid: `1 / sm:2 / lg:3` columns of month cells.
