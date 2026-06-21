import { nanoid } from 'nanoid';
import {
  type Vault,
  type Year,
  type Goal,
  type Month,
  type Tracker,
  type GoalCheckin,
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
