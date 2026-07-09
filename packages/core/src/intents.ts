import { type Vault, type MonthKey, MONTH_NAMES, monthLabel } from '@nekko/journal-shared';
import { addGoal, setGoalPlannedMonth, updateGoal, updateMonth, ensureMonth, activeGoals } from './vault.js';

// Agent-callable command layer (T23). Siri / iOS App Intents / Shortcuts and any
// agent all speak the same small, typed vocabulary of *intents*; the native (or
// web) layer just maps a voice phrase or a tool call onto one of these and hands
// it to applyIntent. This lives in DOM-free core so it's unit-tested once and
// reused everywhere — the platform wiring stays thin. Each intent mutates the
// vault in place (the caller persists) and returns a short spoken-friendly
// message plus any useful ids.

export type JournalIntent =
  | { type: 'add-goal'; year: number; title: string; plannedMonth?: number }
  | { type: 'plan-goal'; year: number; goalId: string; month: number | null }
  | { type: 'complete-goal'; year: number; goalId: string; done?: boolean }
  | { type: 'write-month'; key: MonthKey; text: string; append?: boolean }
  | { type: 'add-highlight'; key: MonthKey; text: string }
  | { type: 'set-mood'; key: MonthKey; mood: number };

export interface IntentResult {
  ok: boolean;
  /** A short, spoken-friendly confirmation or error (for Siri / agent replies). */
  message: string;
  /** Where the user should land afterward, if the surface wants to navigate. */
  route?: string;
  goalId?: string;
}

function ok(message: string, extra?: Partial<IntentResult>): IntentResult {
  return { ok: true, message, ...extra };
}
function fail(message: string): IntentResult {
  return { ok: false, message };
}

/** Apply an agent/Siri intent to the vault (mutates in place). */
export function applyIntent(vault: Vault, intent: JournalIntent): IntentResult {
  switch (intent.type) {
    case 'add-goal': {
      const title = intent.title.trim();
      if (!title) return fail("I didn't catch the goal — what would you like to add?");
      const g = addGoal(vault, intent.year, { title, plannedMonth: intent.plannedMonth });
      const where = intent.plannedMonth ? ` in ${MONTH_NAMES[intent.plannedMonth - 1]}` : '';
      return ok(`Added "${title}" to your ${intent.year} goals${where}.`, { route: `/goals/${intent.year}`, goalId: g.id });
    }
    case 'plan-goal': {
      const g = setGoalPlannedMonth(vault, intent.year, intent.goalId, intent.month);
      if (!g) return fail("I couldn't find that goal.");
      return intent.month == null
        ? ok(`Moved "${g.title}" back to the board.`, { route: `/goals/${intent.year}` })
        : ok(`Planned "${g.title}" for ${MONTH_NAMES[intent.month - 1]}.`, { route: `/goals/${intent.year}`, goalId: g.id });
    }
    case 'complete-goal': {
      const done = intent.done ?? true;
      const g = updateGoal(vault, intent.year, intent.goalId, { status: done ? 'done' : 'active' });
      if (!g) return fail("I couldn't find that goal.");
      return ok(done ? `Nice — marked "${g.title}" done.` : `Reopened "${g.title}".`, { goalId: g.id });
    }
    case 'write-month': {
      const text = intent.text.trim();
      if (!text) return fail('What would you like to write?');
      const m = ensureMonth(vault, intent.key);
      const next = intent.append && m.reflection.trim() ? `${m.reflection.trimEnd()}\n\n${text}` : text;
      updateMonth(vault, intent.key, { reflection: next });
      return ok(`${intent.append ? 'Added to' : 'Saved'} your ${monthLabel(intent.key)} entry.`, { route: `/month/${intent.key}` });
    }
    case 'add-highlight': {
      const text = intent.text.trim();
      if (!text) return fail('What was the highlight?');
      const m = ensureMonth(vault, intent.key);
      updateMonth(vault, intent.key, { highlights: [...m.highlights, text] });
      return ok(`Added a highlight to ${monthLabel(intent.key)}.`, { route: `/month/${intent.key}` });
    }
    case 'set-mood': {
      const mood = Math.round(intent.mood);
      if (mood < 1 || mood > 5) return fail('Mood should be from 1 to 5.');
      ensureMonth(vault, intent.key);
      updateMonth(vault, intent.key, { mood });
      return ok(`Set your ${monthLabel(intent.key)} mood to ${mood} out of 5.`, { route: `/month/${intent.key}` });
    }
  }
}

/**
 * A tiny natural-language front end for the agent/Shortcuts path: map a spoken
 * phrase to an intent when it's unambiguous, else return null so the caller can
 * ask a follow-up. Deliberately small and rule-based (no model needed) — the
 * assistant proper lives in ai.ts.
 */
export function parseIntent(phrase: string, ctx: { year: number; monthKey: MonthKey }): JournalIntent | null {
  const p = phrase.trim();
  const lower = p.toLowerCase();

  // "add goal <title>" / "new goal <title>" (optionally "... in <month>")
  const addGoalM = lower.match(/^(?:add|new|create)\s+(?:a\s+)?goal[:\s]+(.+)$/i);
  if (addGoalM) {
    let title = p.slice(p.length - addGoalM[1].length);
    let plannedMonth: number | undefined;
    const inMonth = title.match(/\s+in\s+([A-Za-z]+)\s*$/);
    if (inMonth) {
      const idx = MONTH_NAMES.findIndex((n) => n.toLowerCase().startsWith(inMonth[1].toLowerCase().slice(0, 3)));
      if (idx >= 0) { plannedMonth = idx + 1; title = title.slice(0, title.length - inMonth[0].length); }
    }
    return { type: 'add-goal', year: ctx.year, title: title.trim(), plannedMonth };
  }

  // "write <text>" / "journal <text>" / "note <text>" → append to this month
  const writeM = lower.match(/^(?:write|journal|note|log)[:\s]+(.+)$/i);
  if (writeM) {
    return { type: 'write-month', key: ctx.monthKey, text: p.slice(p.length - writeM[1].length).trim(), append: true };
  }

  // "highlight <text>"
  const hlM = lower.match(/^highlight[:\s]+(.+)$/i);
  if (hlM) return { type: 'add-highlight', key: ctx.monthKey, text: p.slice(p.length - hlM[1].length).trim() };

  // "mood <1-5>" / "set mood to 4"
  const moodM = lower.match(/mood\D*([1-5])/i);
  if (moodM) return { type: 'set-mood', key: ctx.monthKey, mood: Number(moodM[1]) };

  return null;
}

/** The goals a "complete/plan the goal named X" phrase could resolve against. */
export function resolveGoalByTitle(vault: Vault, year: number, title: string): string | undefined {
  const q = title.trim().toLowerCase();
  if (!q) return undefined;
  const goals = activeGoals(vault, year);
  const exact = goals.find((g) => g.title.toLowerCase() === q);
  if (exact) return exact.id;
  const partial = goals.find((g) => g.title.toLowerCase().includes(q));
  return partial?.id;
}

/** Human-readable catalog of what the agent/Siri can do (for a help surface). */
export function intentCatalog(): { phrase: string; does: string }[] {
  return [
    { phrase: 'Add goal: Run a marathon in October', does: 'Adds a yearly goal, optionally placed in a month.' },
    { phrase: 'Write: Started my new job this week', does: 'Appends to the current month\'s journal.' },
    { phrase: 'Highlight: Trip to the coast', does: 'Adds a highlight to the current month.' },
    { phrase: 'Mood 4', does: 'Sets the current month\'s mood (1–5).' },
  ];
}
