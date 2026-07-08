// @nekko/journal-shared — types and helpers shared across core, web, and (later) native.
//
// The atomic unit of Nekko Journal is the Month ("YYYY-MM"). Years hold goals and a
// theme; goals break down into per-month intentions; months hold reflection, highlights,
// optional struggles, photos, trackers, and goal check-ins.

export type MonthKey = string; // "YYYY-MM"

export interface PhotoRef {
  id: string;
  /** IndexedDB blob key (web idb mode) or a vault-relative path ("media/foo.jpg"). */
  src: string;
  caption?: string;
  width?: number;
  height?: number;
}

export type GoalMetricKind = 'milestone' | 'number' | 'boolean';
export type GoalStatus = 'active' | 'done' | 'dropped';

export interface Goal {
  id: string;
  year: number;
  title: string;
  why?: string;
  category?: string;
  metricKind: GoalMetricKind;
  /** For number goals: the year-end target (e.g. 12 books). */
  target?: number;
  unit?: string;
  /** Free-text intention/target per month — the "break it down so you remember" core. */
  monthlyTargets?: Record<MonthKey, string>;
  /**
   * The 1-based month (1–12) this goal is slotted into for its year — the
   * "drag a goal onto the month where it'll happen" placement. `undefined`
   * means it's unplanned and lives on the board. This is the primary
   * breakdown in the consolidated design; `monthlyTargets` remains for the
   * richer per-month intention notes.
   */
  plannedMonth?: number;
  status: GoalStatus;
  /** A hex color for the goal's chip across surfaces. */
  color?: string;
}

export type TrackerKind = 'number' | 'boolean' | 'rating' | 'count';

/** Trackers measure monthly totals/trends — never daily streaks. Defined once, valued per month. */
export interface Tracker {
  id: string;
  name: string;
  kind: TrackerKind;
  unit?: string;
  target?: number;
  color?: string;
  icon?: string;
  active: boolean;
}

export interface GoalCheckin {
  note?: string;
  value?: number;
  done?: boolean;
  /** Photos attached to this goal within the month (captioned memory of it happening). */
  photos?: PhotoRef[];
}

export interface Month {
  id: MonthKey;
  year: number;
  month: number; // 1–12
  /** Free-form reflection (Markdown body of the month file). */
  reflection: string;
  highlights: string[];
  /** Optional and always visually de-emphasized — empty is first-class. */
  struggles: string[];
  gratitude?: string[];
  mood?: number; // 1–5
  photos: PhotoRef[];
  /** This month's tracker values, keyed by Tracker.id. */
  trackers: Record<string, number | boolean>;
  /** This month's check-in per goal, keyed by Goal.id. */
  goalCheckins: Record<string, GoalCheckin>;
  createdAt: string;
  updatedAt: string;
}

export interface Year {
  year: number;
  /** A word or phrase for the year (optional). */
  theme?: string;
  goals: Goal[];
  createdAt: string;
  updatedAt: string;
}

/**
 * App-level entitlement. `free` is the complete local-first app (all four
 * surfaces, unlimited goals/entries, up to {@link PHOTO_LIMIT_FREE} photos per
 * month). `premium` unlocks cross-device sync (iCloud / Google Drive), the
 * Siri / agent integration, and up to {@link PHOTO_LIMIT_PREMIUM} photos/month.
 */
export type Plan = 'free' | 'premium';

export interface Settings {
  theme: 'light' | 'dark';
  accent?: string;
  /** Defaults to 'free' when absent. */
  plan?: Plan;
  /** Notification cadence for the single gentle monthly nudge. */
  notify?: 'monthly' | 'off';
}

export interface Vault {
  version: number;
  settings: Settings;
  trackers: Tracker[];
  years: Record<number, Year>;
  months: Record<MonthKey, Month>;
}

// ---------------------------------------------------------------------------
// MonthKey helpers
// ---------------------------------------------------------------------------

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Build a "YYYY-MM" key from a year and a 1-based month. */
export function monthKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split('-');
  return { year: Number(y), month: Number(m) };
}

/** "January 2026" */
export function monthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** All 12 month keys for a year, in order. */
export function yearMonthKeys(year: number): MonthKey[] {
  return Array.from({ length: 12 }, (_, i) => monthKey(year, i + 1));
}

/** The "YYYY-MM" one calendar year before the given key. */
export function monthKeyLastYear(key: MonthKey): MonthKey {
  const { year, month } = parseMonthKey(key);
  return monthKey(year - 1, month);
}

// ---------------------------------------------------------------------------
// Mood as a color primitive (1 = low → 5 = joyful)
// ---------------------------------------------------------------------------

export const MOOD_EMOJI = ['', '😞', '😕', '😐', '🙂', '😄'] as const;
export const MOOD_LABELS = ['', 'Low', 'Meh', 'Okay', 'Good', 'Great'] as const;

/** CSS custom-property reference for a mood value, e.g. `var(--mood-4)`. */
export function moodVar(mood?: number): string {
  if (!mood || mood < 1 || mood > 5) return 'var(--border)';
  return `var(--mood-${mood})`;
}

// ---------------------------------------------------------------------------
// Goal color palette (calm ocean set) + plan / photo limits
// ---------------------------------------------------------------------------

/**
 * The goal-chip palette from the consolidated design — a calm ocean-leaning
 * set. New goals cycle through it so each reads as its own color across the
 * year board, month view, and insights.
 */
export const GOAL_PALETTE = [
  '#3e8fa0', '#7aa889', '#d9a55f', '#6f97b3',
  '#cc7f6a', '#9d84b0', '#5fb0a6', '#c58aa0',
] as const;

/** Pick a palette color by index (wraps). */
export function goalColor(index: number): string {
  return GOAL_PALETTE[((index % GOAL_PALETTE.length) + GOAL_PALETTE.length) % GOAL_PALETTE.length];
}

/** Photos allowed per month on the free plan. */
export const PHOTO_LIMIT_FREE = 3;
/** Photos allowed per month on premium. */
export const PHOTO_LIMIT_PREMIUM = 25;

export function photoLimit(plan: Plan | undefined): number {
  return plan === 'premium' ? PHOTO_LIMIT_PREMIUM : PHOTO_LIMIT_FREE;
}
