import { type Vault, monthKey, isMonthFilled } from '@nekko/journal-core';

// The one gentle monthly nudge. No daily nags, no streaks: at most one reminder
// per calendar month, and only if the current month hasn't been journaled yet.
// Web can't schedule true background notifications without push infrastructure,
// so we surface the reminder when the app next opens in a new month.

const LAST_NUDGE_KEY = 'nekko-last-nudge';
const ICON = 'icon.svg';

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  return notifySupported() ? Notification.permission : 'unsupported';
}

/** Ask for notification permission (call from a user gesture). */
export async function enableMonthlyNudge(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

function readLast(): string | null {
  try { return localStorage.getItem(LAST_NUDGE_KEY); } catch { return null; }
}
function writeLast(key: string): void {
  try { localStorage.setItem(LAST_NUDGE_KEY, key); } catch { /* ignore */ }
}

/**
 * Show the monthly nudge if due. Idempotent within a calendar month. Uses the
 * real current date (not the demo's "today"). Safe to call on every app open.
 */
export function runMonthlyNudge(vault: Vault): void {
  if ((vault.settings.notify ?? 'monthly') !== 'monthly') return;
  if (!notifySupported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const key = monthKey(now.getFullYear(), now.getMonth() + 1);
  if (readLast() === key) return;

  // Already wrote this month — nothing to nudge about; just remember it.
  if (isMonthFilled(vault.months[key])) { writeLast(key); return; }

  try {
    const n = new Notification('Nekko Journal', {
      body: 'A new month. Take a few quiet minutes to look back and write it down.',
      icon: ICON,
      badge: ICON,
      tag: 'nekko-monthly',
    });
    n.onclick = () => { try { window.focus(); window.location.hash = `#/month/${key}`; n.close(); } catch { /* ignore */ } };
    writeLast(key);
  } catch {
    /* notification construction can throw on some platforms — ignore */
  }
}
