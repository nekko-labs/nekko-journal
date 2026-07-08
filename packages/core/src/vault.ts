import { nanoid } from 'nanoid';
import {
  type Vault,
  type Year,
  type Goal,
  type Month,
  type Tracker,
  type GoalCheckin,
  type PhotoRef,
  type MonthKey,
  parseMonthKey,
} from '@nekko/journal-shared';

export const VAULT_VERSION = 1;

function now(): string {
  return new Date().toISOString();
}

export function createEmptyVault(): Vault {
  return {
    version: VAULT_VERSION,
    settings: { theme: 'light' },
    trackers: [],
    years: {},
    months: {},
  };
}

// ---------------------------------------------------------------------------
// Years & goals
// ---------------------------------------------------------------------------

/** Get a year, creating an empty one if it doesn't exist yet. Mutates the vault. */
export function ensureYear(vault: Vault, year: number): Year {
  let y = vault.years[year];
  if (!y) {
    const ts = now();
    y = { year, goals: [], createdAt: ts, updatedAt: ts };
    vault.years[year] = y;
  }
  return y;
}

export function setYearTheme(vault: Vault, year: number, theme: string): Year {
  const y = ensureYear(vault, year);
  y.theme = theme;
  y.updatedAt = now();
  return y;
}

export function addGoal(
  vault: Vault,
  year: number,
  goal: Partial<Goal> & { title: string },
): Goal {
  const y = ensureYear(vault, year);
  const g: Goal = {
    id: goal.id ?? nanoid(8),
    year,
    title: goal.title,
    why: goal.why,
    category: goal.category,
    metricKind: goal.metricKind ?? 'milestone',
    target: goal.target,
    unit: goal.unit,
    monthlyTargets: goal.monthlyTargets ?? {},
    plannedMonth: goal.plannedMonth,
    status: goal.status ?? 'active',
    color: goal.color,
  };
  y.goals.push(g);
  y.updatedAt = now();
  return g;
}

export function updateGoal(vault: Vault, year: number, goalId: string, patch: Partial<Goal>): Goal | undefined {
  const y = vault.years[year];
  if (!y) return undefined;
  const g = y.goals.find((x) => x.id === goalId);
  if (!g) return undefined;
  Object.assign(g, patch, { id: g.id, year: g.year });
  y.updatedAt = now();
  return g;
}

export function removeGoal(vault: Vault, year: number, goalId: string): void {
  const y = vault.years[year];
  if (!y) return;
  y.goals = y.goals.filter((g) => g.id !== goalId);
  y.updatedAt = now();
}

/** Set the free-text intention/target for a goal in a specific month. */
export function setMonthlyTarget(vault: Vault, year: number, goalId: string, key: MonthKey, target: string): void {
  const y = vault.years[year];
  const g = y?.goals.find((x) => x.id === goalId);
  if (!g) return;
  g.monthlyTargets = g.monthlyTargets ?? {};
  if (target.trim()) g.monthlyTargets[key] = target;
  else delete g.monthlyTargets[key];
  if (y) y.updatedAt = now();
}

/**
 * Place a goal into the month (1–12) where it'll happen, or clear it back to
 * the board with `month = null`. This is the drag-a-goal-onto-a-month action
 * from the consolidated design.
 */
export function setGoalPlannedMonth(vault: Vault, year: number, goalId: string, month: number | null): Goal | undefined {
  const y = vault.years[year];
  const g = y?.goals.find((x) => x.id === goalId);
  if (!g) return undefined;
  if (month == null) delete g.plannedMonth;
  else g.plannedMonth = Math.max(1, Math.min(12, month));
  if (y) y.updatedAt = now();
  return g;
}

/** Goals for a year placed into a given 1-based month. */
export function goalsInMonth(vault: Vault, year: number, month: number): Goal[] {
  return (vault.years[year]?.goals ?? []).filter((g) => g.plannedMonth === month);
}

/** All active goals for a year. */
export function activeGoals(vault: Vault, year: number): Goal[] {
  return (vault.years[year]?.goals ?? []).filter((g) => g.status === 'active');
}

// ---------------------------------------------------------------------------
// Months (created lazily)
// ---------------------------------------------------------------------------

export function getMonth(vault: Vault, key: MonthKey): Month | undefined {
  return vault.months[key];
}

export function createMonth(key: MonthKey): Month {
  const { year, month } = parseMonthKey(key);
  const ts = now();
  return {
    id: key,
    year,
    month,
    reflection: '',
    highlights: [],
    struggles: [],
    gratitude: [],
    photos: [],
    trackers: {},
    goalCheckins: {},
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Get the month, creating it if absent. Mutates the vault. */
export function ensureMonth(vault: Vault, key: MonthKey): Month {
  let m = vault.months[key];
  if (!m) {
    m = createMonth(key);
    vault.months[key] = m;
    ensureYear(vault, m.year);
  }
  return m;
}

/** Apply a partial update to a month (creating it if needed) and bump updatedAt. */
export function updateMonth(vault: Vault, key: MonthKey, patch: Partial<Month>): Month {
  const m = ensureMonth(vault, key);
  Object.assign(m, patch, { id: m.id, year: m.year, month: m.month });
  m.updatedAt = now();
  return m;
}

export function setGoalCheckin(vault: Vault, key: MonthKey, goalId: string, checkin: GoalCheckin): Month {
  const m = ensureMonth(vault, key);
  m.goalCheckins[goalId] = { ...m.goalCheckins[goalId], ...checkin };
  m.updatedAt = now();
  return m;
}

/** Total photos kept in a month across all goal check-ins + the month gallery. */
export function countMonthPhotos(m: Month | undefined): number {
  if (!m) return 0;
  const inCheckins = Object.values(m.goalCheckins).reduce((n, c) => n + (c.photos?.length ?? 0), 0);
  return inCheckins + m.photos.length;
}

/**
 * Attach a photo to a goal's check-in for the month. Returns the updated month,
 * or `undefined` if the per-month photo limit for `plan` is already reached
 * (the UI surfaces the upgrade prompt in that case).
 */
export function addGoalPhoto(
  vault: Vault,
  key: MonthKey,
  goalId: string,
  photo: PhotoRef,
  limit: number,
): Month | undefined {
  const m = ensureMonth(vault, key);
  if (countMonthPhotos(m) >= limit) return undefined;
  const c = m.goalCheckins[goalId] ?? {};
  c.photos = [...(c.photos ?? []), photo];
  m.goalCheckins[goalId] = c;
  m.updatedAt = now();
  return m;
}

export function removeGoalPhoto(vault: Vault, key: MonthKey, goalId: string, photoId: string): Month | undefined {
  const m = vault.months[key];
  const c = m?.goalCheckins[goalId];
  if (!m || !c?.photos) return undefined;
  c.photos = c.photos.filter((p) => p.id !== photoId);
  m.updatedAt = now();
  return m;
}

export function setTrackerValue(vault: Vault, key: MonthKey, trackerId: string, value: number | boolean): Month {
  const m = ensureMonth(vault, key);
  m.trackers[trackerId] = value;
  m.updatedAt = now();
  return m;
}

/** True if a month has any content worth showing as "journaled". */
export function isMonthFilled(m: Month | undefined): boolean {
  if (!m) return false;
  return (
    m.reflection.trim().length > 0 ||
    m.highlights.length > 0 ||
    m.struggles.length > 0 ||
    m.photos.length > 0 ||
    Object.keys(m.trackers).length > 0 ||
    (m.mood != null)
  );
}

// ---------------------------------------------------------------------------
// Trackers
// ---------------------------------------------------------------------------

export function addTracker(vault: Vault, tracker: Partial<Tracker> & { name: string }): Tracker {
  const t: Tracker = {
    id: tracker.id ?? nanoid(8),
    name: tracker.name,
    kind: tracker.kind ?? 'count',
    unit: tracker.unit,
    target: tracker.target,
    color: tracker.color,
    icon: tracker.icon,
    active: tracker.active ?? true,
  };
  vault.trackers.push(t);
  return t;
}

export function activeTrackers(vault: Vault): Tracker[] {
  return vault.trackers.filter((t) => t.active);
}
