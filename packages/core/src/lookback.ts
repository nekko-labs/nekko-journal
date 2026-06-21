import {
  type Vault,
  type Month,
  type MonthKey,
  type Goal,
  yearMonthKeys,
  monthKeyLastYear,
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
