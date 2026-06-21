import { describe, it, expect } from 'vitest';
import { monthKey, parseMonthKey, monthLabel, yearMonthKeys } from '@nekko/journal-shared';
import {
  createEmptyVault,
  ensureMonth,
  updateMonth,
  addGoal,
  setMonthlyTarget,
  setTrackerValue,
  addTracker,
  isMonthFilled,
} from './vault.js';
import { serializeMonth, parseMonth } from './frontmatter.js';
import { trackerTotal, trackerSeries, buildYearInReview, thisMonthLastYear, journaledYears, buildYearStrip, lifetimeStats, moodSeries } from './lookback.js';
import { vaultTouchedAt, reconcileVaults } from './sync.js';
import { seedDemoVault } from './seed.js';

describe('month key helpers', () => {
  it('builds and parses keys', () => {
    expect(monthKey(2026, 6)).toBe('2026-06');
    expect(parseMonthKey('2026-06')).toEqual({ year: 2026, month: 6 });
    expect(monthLabel('2026-01')).toBe('January 2026');
    expect(yearMonthKeys(2026)).toHaveLength(12);
    expect(yearMonthKeys(2026)[11]).toBe('2026-12');
  });
});

describe('months created lazily', () => {
  it('does not exist until ensured', () => {
    const v = createEmptyVault();
    expect(v.months['2026-06']).toBeUndefined();
    const m = ensureMonth(v, '2026-06');
    expect(m.year).toBe(2026);
    expect(m.month).toBe(6);
    expect(v.years[2026]).toBeDefined(); // ensuring a month ensures its year
  });

  it('isMonthFilled reflects content', () => {
    const v = createEmptyVault();
    const m = ensureMonth(v, '2026-06');
    expect(isMonthFilled(m)).toBe(false);
    updateMonth(v, '2026-06', { highlights: ['shipped a thing'] });
    expect(isMonthFilled(v.months['2026-06'])).toBe(true);
  });
});

describe('goals + monthly breakdown', () => {
  it('adds a goal and per-month targets', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Read 24 books', metricKind: 'number', target: 24 });
    setMonthlyTarget(v, 2026, g.id, '2026-01', '2 books');
    expect(v.years[2026].goals[0].monthlyTargets!['2026-01']).toBe('2 books');
    setMonthlyTarget(v, 2026, g.id, '2026-01', '   '); // clearing
    expect(v.years[2026].goals[0].monthlyTargets!['2026-01']).toBeUndefined();
  });
});

describe('frontmatter round-trip', () => {
  it('serializes and parses a month losslessly', () => {
    const v = createEmptyVault();
    updateMonth(v, '2026-06', {
      reflection: 'A good month.\n\nSecond paragraph.',
      highlights: ['a', 'b'],
      struggles: ['c'],
      mood: 4,
    });
    const text = serializeMonth(v.months['2026-06']);
    const round = parseMonth('2026-06', text);
    expect(round.reflection).toBe('A good month.\n\nSecond paragraph.');
    expect(round.highlights).toEqual(['a', 'b']);
    expect(round.struggles).toEqual(['c']);
    expect(round.mood).toBe(4);
  });

  it('treats plain text without frontmatter as a reflection', () => {
    const m = parseMonth('2026-06', 'just some prose');
    expect(m.reflection).toBe('just some prose');
    expect(m.highlights).toEqual([]);
  });
});

describe('lookback aggregation', () => {
  it('totals and series trackers across a year', () => {
    const v = createEmptyVault();
    const t = addTracker(v, { name: 'Runs', kind: 'count' });
    setTrackerValue(v, '2026-01', t.id, 12);
    setTrackerValue(v, '2026-02', t.id, 8);
    expect(trackerTotal(v, 2026, t.id)).toBe(20);
    const series = trackerSeries(v, 2026, t.id);
    expect(series[0]).toBe(12);
    expect(series[1]).toBe(8);
    expect(series[2]).toBeUndefined();
  });
});

describe('seeded demo vault', () => {
  const v = seedDemoVault(2026);

  it('is alive on first run', () => {
    expect(Object.keys(v.months).length).toBeGreaterThan(0);
    expect(v.years[2026].goals.length).toBe(3);
    expect(v.years[2026].theme).toBe('Build & breathe');
  });

  it('supports this-month-last-year lookback', () => {
    const last = thisMonthLastYear(v, '2026-06');
    expect(last).toBeDefined();
    expect(last!.id).toBe('2025-06');
  });

  it('builds a year in review', () => {
    const review = buildYearInReview(v, 2026);
    expect(review.monthsJournaled).toBeGreaterThanOrEqual(3);
    expect(review.highlights.length).toBeGreaterThan(0);
    expect(review.trackerTotals.length).toBeGreaterThan(0);
  });
});

describe('multi-year + lifetime analytics', () => {
  const v = seedDemoVault(2026);

  it('lists years newest-first including current + next', () => {
    const years = journaledYears(v, 2026);
    expect(years).toContain(2026);
    expect(years).toContain(2027); // next year, for planning ahead
    expect(years).toContain(2025); // has a seeded month
    expect(years[0]).toBeGreaterThanOrEqual(years[years.length - 1]); // descending
  });

  it('builds a 12-cell year strip', () => {
    const strip = buildYearStrip(v, 2026);
    expect(strip.months).toHaveLength(12);
    expect(strip.monthsJournaled).toBeGreaterThanOrEqual(3);
    expect(strip.theme).toBe('Build & breathe');
  });

  it('computes lifetime stats including a consecutive run', () => {
    const life = lifetimeStats(v);
    expect(life.monthsJournaled).toBeGreaterThanOrEqual(4);
    expect(life.totalHighlights).toBeGreaterThan(0);
    expect(life.longestRun).toBeGreaterThanOrEqual(2); // Jan→Feb are consecutive
    expect(life.yearsTracked).toBeGreaterThanOrEqual(2);
  });

  it('returns a 12-month mood series', () => {
    const moods = moodSeries(v, 2026);
    expect(moods).toHaveLength(12);
    expect(moods[0]).toBe(4); // January seeded mood
  });
});

describe('cloud sync reconciliation (last-write-wins)', () => {
  it('pushes when there is no remote', () => {
    const local = seedDemoVault(2026);
    expect(reconcileVaults(local, null)).toEqual({ winner: local, action: 'push' });
  });

  it('picks the more recently touched vault', () => {
    const a = createEmptyVault();
    const b = createEmptyVault();
    updateMonth(a, '2026-01', { reflection: 'older' });
    // force b to be strictly newer
    updateMonth(b, '2026-01', { reflection: 'newer' });
    b.months['2026-01'].updatedAt = '2099-01-01T00:00:00.000Z';
    expect(vaultTouchedAt(b) > vaultTouchedAt(a)).toBe(true);
    expect(reconcileVaults(a, b).action).toBe('pull');
    expect(reconcileVaults(b, a).action).toBe('push');
  });
});
