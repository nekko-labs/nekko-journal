import {
  type Vault,
  type Month,
  type MonthKey,
  type Goal,
  yearMonthKeys,
  monthKeyLastYear,
  monthKey,
} from '@nekko/journal-shared';

/** The filled months of a year, in calendar order. */
export function filledMonths(vault: Vault, year: number): Month[] {
  return yearMonthKeys(year)
    .map((k) => vault.months[k])
    .filter((m): m is Month => !!m);
}

/** All months across all years, newest first. */
export function monthsNewestFirst(vault: Vault): Month[] {
  return Object.values(vault.months).sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

/** The month exactly one year before `key`, if it exists. */
export function thisMonthLastYear(vault: Vault, key: MonthKey): Month | undefined {
  return vault.months[monthKeyLastYear(key)];
}

/** Sum a numeric/count tracker across a year. Booleans count as 1 per true month. */
export function trackerTotal(vault: Vault, year: number, trackerId: string): number {
  let total = 0;
  for (const m of filledMonths(vault, year)) {
    const v = m.trackers[trackerId];
    if (typeof v === 'number') total += v;
    else if (v === true) total += 1;
  }
  return total;
}

/** Per-month series for a tracker across a year (undefined where unset). */
export function trackerSeries(vault: Vault, year: number, trackerId: string): (number | undefined)[] {
  return yearMonthKeys(year).map((k) => {
    const v = vault.months[k]?.trackers[trackerId];
    if (typeof v === 'number') return v;
    if (v === true) return 1;
    if (v === false) return 0;
    return undefined;
  });
}

export interface YearInReview {
  year: number;
  theme?: string;
  monthsJournaled: number;
  highlights: { key: MonthKey; text: string }[];
  photoCount: number;
  goalsAchieved: Goal[];
  goalsActive: Goal[];
  trackerTotals: { trackerId: string; total: number }[];
  averageMood?: number;
}

/**
 * Every year worth showing in the multi-year overview — any year that has goals,
 * a theme, or at least one journaled month, plus the current year and next year
 * so there's always somewhere to plan ahead. Sorted descending (newest first).
 */
export function journaledYears(vault: Vault, currentYear: number): number[] {
  const set = new Set<number>([currentYear, currentYear + 1]);
  for (const y of Object.keys(vault.years)) set.add(Number(y));
  for (const m of Object.values(vault.months)) set.add(m.year);
  return [...set].sort((a, b) => b - a);
}

export interface YearStrip {
  year: number;
  theme?: string;
  monthsJournaled: number;
  photoCount: number;
  /** 12 entries: the month if journaled, else undefined. */
  months: (Month | undefined)[];
  goalsActive: number;
  goalsDone: number;
}

export function buildYearStrip(vault: Vault, year: number): YearStrip {
  const months = yearMonthKeys(year).map((k) => vault.months[k]);
  const filled = months.filter((m): m is Month => !!m);
  const goals = vault.years[year]?.goals ?? [];
  return {
    year,
    theme: vault.years[year]?.theme,
    monthsJournaled: filled.length,
    photoCount: filled.reduce((n, m) => n + m.photos.length, 0),
    months,
    goalsActive: goals.filter((g) => g.status === 'active').length,
    goalsDone: goals.filter((g) => g.status === 'done').length,
  };
}

export interface LifetimeStats {
  monthsJournaled: number;
  yearsTracked: number;
  totalHighlights: number;
  totalStruggles: number;
  totalPhotos: number;
  totalWords: number;
  goalsAchieved: number;
  longestRun: number; // longest consecutive run of journaled months
}

function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Everything you've done, across all years. */
export function lifetimeStats(vault: Vault): LifetimeStats {
  const months = Object.values(vault.months);
  const years = new Set(months.map((m) => m.year));
  let goalsAchieved = 0;
  for (const y of Object.values(vault.years)) goalsAchieved += y.goals.filter((g) => g.status === 'done').length;

  // longest consecutive run of journaled months across the whole timeline
  const keys = months.map((m) => m.id).sort();
  let longest = 0;
  let run = 0;
  let prev: MonthKey | null = null;
  for (const k of keys) {
    if (prev) {
      const p = prev.split('-').map(Number);
      const expected = monthKey(p[1] === 12 ? p[0] + 1 : p[0], p[1] === 12 ? 1 : p[1] + 1);
      run = k === expected ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = k;
  }

  return {
    monthsJournaled: months.length,
    yearsTracked: years.size,
    totalHighlights: months.reduce((n, m) => n + m.highlights.length, 0),
    totalStruggles: months.reduce((n, m) => n + m.struggles.length, 0),
    totalPhotos: months.reduce((n, m) => n + m.photos.length, 0),
    totalWords: months.reduce((n, m) => n + countWords(m.reflection), 0),
    goalsAchieved,
    longestRun: longest,
  };
}

/** Average mood per month for a year (undefined where no mood set). */
export function moodSeries(vault: Vault, year: number): (number | undefined)[] {
  return yearMonthKeys(year).map((k) => vault.months[k]?.mood);
}

export function buildYearInReview(vault: Vault, year: number): YearInReview {
  const months = filledMonths(vault, year);
  const highlights = months.flatMap((m) => m.highlights.map((text) => ({ key: m.id, text })));
  const photoCount = months.reduce((n, m) => n + m.photos.length, 0);
  const moods = months.map((m) => m.mood).filter((x): x is number => typeof x === 'number');
  const goals = vault.years[year]?.goals ?? [];
  const trackerTotals = vault.trackers
    .filter((t) => t.active)
    .map((t) => ({ trackerId: t.id, total: trackerTotal(vault, year, t.id) }))
    .filter((x) => x.total > 0);

  return {
    year,
    theme: vault.years[year]?.theme,
    monthsJournaled: months.length,
    highlights,
    photoCount,
    goalsAchieved: goals.filter((g) => g.status === 'done'),
    goalsActive: goals.filter((g) => g.status === 'active'),
    trackerTotals,
    averageMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : undefined,
  };
}
