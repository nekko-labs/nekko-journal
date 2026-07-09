import {
  type JournalIntent,
  type IntentResult,
  applyIntent,
  parseIntent,
  monthKey,
} from '@nekko/journal-core';
import { useVault } from './store';

// Siri / iOS App Intents / Shortcuts + agent entry point (T23). The command
// vocabulary and all logic live in core (`intents.ts`, unit-tested); this file
// is the thin native seam that runs an intent against the live store and
// persists. Native App Intents (a Swift `AppIntent` per action) and a Shortcuts
// donation are added via an Expo config plugin in a dev build — that plugin
// forwards each invocation to `runPhrase` / `runIntent` below (over a JSI bridge
// or a `nekkojournal://` deep link). The spoken/agent reply is the returned
// `message`.

function ctx() {
  const s = useVault.getState();
  return { year: s.currentYear, monthKey: monthKey(s.currentYear, s.currentMonth) };
}

/** Run a structured intent (agent tool call or a parsed phrase). */
export function runIntent(intent: JournalIntent): IntentResult {
  let result: IntentResult = { ok: false, message: 'Nothing happened.' };
  useVault.getState().mutate((v) => { result = applyIntent(v, intent); });
  return result;
}

/**
 * Run a natural-language phrase ("add goal: run a 5k", "write: shipped it",
 * "mood 4"). Returns a spoken-friendly reply. If the phrase isn't understood,
 * `ok` is false and the caller can ask a follow-up.
 */
export function runPhrase(phrase: string): IntentResult {
  const intent = parseIntent(phrase, ctx());
  if (!intent) {
    return { ok: false, message: "I can add a goal, write your month, add a highlight, or set your mood. Try: \"add goal: run a 5k\"." };
  }
  return runIntent(intent);
}

/**
 * Handle a `nekkojournal://intent?phrase=...` deep link (the URL scheme
 * Shortcuts / an agent opens). Wire in App.tsx via
 * `Linking.addEventListener('url', ({url}) => handleDeepLink(url))`.
 */
export function handleDeepLink(url: string): IntentResult | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'nekkojournal:' || u.hostname !== 'intent') return null;
    const phrase = u.searchParams.get('phrase');
    return phrase ? runPhrase(phrase) : null;
  } catch {
    return null;
  }
}
