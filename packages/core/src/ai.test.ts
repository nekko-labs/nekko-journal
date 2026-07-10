import { describe, it, expect } from 'vitest';
import {
  mockProvider,
  reflectionPrompts,
  reflectionPromptsMock,
  summarizeMonth,
  summarizeMonthMock,
  draftYearInReview,
  suggestGoalBreakdown,
  reflectOnJourney,
  reflectOnJourneyMock,
  type AIProvider,
} from './ai.js';
import { createEmptyVault, addGoal, updateMonth, setGoalCheckin, ensureMonth } from './vault.js';
import { buildYearInReview, buildReflectionMaterial } from './lookback.js';

function fakeProvider(reply: string): AIProvider {
  return { available: true, label: 'Test', complete: async () => reply };
}

describe('AI mock mode (no provider)', () => {
  it('reflectionPrompts returns heuristic questions offline', async () => {
    const v = createEmptyVault();
    const m = ensureMonth(v, '2026-06');
    const g = addGoal(v, 2026, { title: 'Run a 5k', plannedMonth: 6 });
    const prompts = await reflectionPrompts(mockProvider, m, [g]);
    expect(prompts.length).toBeGreaterThanOrEqual(3);
    expect(prompts.some((p) => p.includes('Run a 5k'))).toBe(true);
    expect(prompts).toEqual(reflectionPromptsMock(m, [g]));
  });

  it('summarizeMonth summarizes from sparse notes offline', async () => {
    const v = createEmptyVault();
    updateMonth(v, '2026-06', { reflection: 'Ran my first 5k. It felt great.', highlights: ['first 5k'] });
    setGoalCheckin(v, '2026-06', 'g1', { done: true });
    const out = await summarizeMonth(mockProvider, v.months['2026-06']);
    expect(out).toContain('June 2026');
    expect(out).toContain('1 highlight');
    expect(out).toContain('1 goal done');
  });

  it('summarizeMonth handles an empty month', () => {
    const v = createEmptyVault();
    const m = ensureMonth(v, '2026-01');
    expect(summarizeMonthMock(m)).toContain('blank page');
  });

  it('draftYearInReview assembles markdown offline', async () => {
    const v = createEmptyVault();
    v.years[2026] = { year: 2026, theme: 'Momentum', goals: [], createdAt: '', updatedAt: '' };
    addGoal(v, 2026, { title: 'Read 12 books', status: 'done', plannedMonth: 1 });
    updateMonth(v, '2026-06', { reflection: 'good', highlights: ['a highlight'], mood: 4 });
    const review = buildYearInReview(v, 2026);
    const md = await draftYearInReview(mockProvider, review);
    expect(md).toContain('# 2026 — Momentum');
    expect(md).toContain('Read 12 books');
    expect(md).toContain('a highlight');
  });

  it('suggestGoalBreakdown returns spread monthly steps offline', async () => {
    const steps = await suggestGoalBreakdown(mockProvider, 'Learn piano', 2026, 1);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(steps.every((s) => s.month >= 1 && s.month <= 12)).toBe(true);
    // months are non-decreasing across the plan
    for (let i = 1; i < steps.length; i++) expect(steps[i].month).toBeGreaterThanOrEqual(steps[i - 1].month);
  });

  it('reflectOnJourney reflects three lists offline', async () => {
    const v = createEmptyVault();
    v.years[2026] = { year: 2026, theme: '', goals: [], createdAt: '', updatedAt: '' };
    addGoal(v, 2026, { title: 'Run a 5k', status: 'done', plannedMonth: 6 });
    addGoal(v, 2026, { title: 'Read 12 books', status: 'active', plannedMonth: 3 });
    addGoal(v, 2026, { title: 'Declutter the flat', status: 'active' }); // unplanned
    updateMonth(v, '2026-06', { reflection: 'Ran my first 5k.\n\n- Cooked for friends', mood: 5 });
    const r = await reflectOnJourney(mockProvider, buildReflectionMaterial(v));
    expect(r.highlights.length).toBeGreaterThan(0);
    expect(r.growth.length).toBeGreaterThan(0);
    expect(r.workOn.length).toBeGreaterThan(0);
    // an unplaced goal surfaces as something to work on
    expect(r.workOn.join(' ')).toMatch(/board/i);
    // reflectOnJourney with the offline provider equals the pure mock
    expect(r).toEqual(reflectOnJourneyMock(buildReflectionMaterial(v)));
  });
});

describe('AI real-provider path (parsing)', () => {
  it('parses reflection prompts from provider lines', async () => {
    const v = createEmptyVault();
    const m = ensureMonth(v, '2026-06');
    const p = fakeProvider('- What went well?\n- What was hard?\n- Who mattered?\n- What did you learn?');
    const prompts = await reflectionPrompts(p, m, []);
    expect(prompts).toEqual(['What went well?', 'What was hard?', 'Who mattered?', 'What did you learn?']);
  });

  it('parses a goal breakdown from "Month: step" lines', async () => {
    const p = fakeProvider('March: Sign up for a class\nJune: Practice weekly\nSeptember: Play for a friend');
    const steps = await suggestGoalBreakdown(p, 'Learn piano', 2026);
    expect(steps).toEqual([
      { month: 3, note: 'Sign up for a class' },
      { month: 6, note: 'Practice weekly' },
      { month: 9, note: 'Play for a friend' },
    ]);
  });

  it('falls back to mock when the provider returns nothing usable', async () => {
    const v = createEmptyVault();
    const m = ensureMonth(v, '2026-06');
    const p = fakeProvider('   ');
    const prompts = await reflectionPrompts(p, m, []);
    expect(prompts.length).toBeGreaterThanOrEqual(3);
  });

  it('parses a journey reflection from three labeled sections', async () => {
    const p = fakeProvider(
      'Highlights:\n- You ran a 5k\nAreas of growth:\n- Steady journaling\nTo work on:\n- Schedule the board goals',
    );
    const v = createEmptyVault();
    const r = await reflectOnJourney(p, buildReflectionMaterial(v));
    expect(r.highlights).toContain('You ran a 5k');
    expect(r.growth).toContain('Steady journaling');
    expect(r.workOn).toContain('Schedule the board goals');
  });
});
