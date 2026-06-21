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

export interface Settings {
  theme: 'light' | 'dark';
  accent?: string;
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
