import { describe, it, expect } from 'vitest';
import { applyIntent, parseIntent, resolveGoalByTitle } from './intents.js';
import { createEmptyVault, addGoal } from './vault.js';

describe('agent/Siri intents', () => {
  it('adds a goal, optionally placed in a month', () => {
    const v = createEmptyVault();
    const r = applyIntent(v, { type: 'add-goal', year: 2026, title: 'Run a marathon', plannedMonth: 10 });
    expect(r.ok).toBe(true);
    expect(r.message).toContain('October');
    expect(v.years[2026].goals[0].title).toBe('Run a marathon');
    expect(v.years[2026].goals[0].plannedMonth).toBe(10);
  });

  it('rejects an empty goal title', () => {
    const v = createEmptyVault();
    expect(applyIntent(v, { type: 'add-goal', year: 2026, title: '  ' }).ok).toBe(false);
  });

  it('writes and appends to a month entry', () => {
    const v = createEmptyVault();
    applyIntent(v, { type: 'write-month', key: '2026-06', text: 'First line.' });
    applyIntent(v, { type: 'write-month', key: '2026-06', text: 'Second line.', append: true });
    expect(v.months['2026-06'].reflection).toBe('First line.\n\nSecond line.');
  });

  it('completes a goal and sets mood', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Read 12 books', plannedMonth: 1 });
    expect(applyIntent(v, { type: 'complete-goal', year: 2026, goalId: g.id }).ok).toBe(true);
    expect(v.years[2026].goals[0].status).toBe('done');
    applyIntent(v, { type: 'set-mood', key: '2026-06', mood: 4 });
    expect(v.months['2026-06'].mood).toBe(4);
  });

  it('rejects an out-of-range mood', () => {
    const v = createEmptyVault();
    expect(applyIntent(v, { type: 'set-mood', key: '2026-06', mood: 9 }).ok).toBe(false);
  });

  it('parses natural phrases into intents', () => {
    const ctx = { year: 2026, monthKey: '2026-06' as const };
    expect(parseIntent('Add goal: Learn piano in March', ctx)).toEqual({ type: 'add-goal', year: 2026, title: 'Learn piano', plannedMonth: 3 });
    expect(parseIntent('write: Shipped the app today', ctx)).toEqual({ type: 'write-month', key: '2026-06', text: 'Shipped the app today', append: true });
    expect(parseIntent('Highlight: Trip to the coast', ctx)).toEqual({ type: 'add-highlight', key: '2026-06', text: 'Trip to the coast' });
    expect(parseIntent('set mood to 5', ctx)).toEqual({ type: 'set-mood', key: '2026-06', mood: 5 });
    expect(parseIntent('what is the weather', ctx)).toBeNull();
  });

  it('resolves a goal id by (partial) title', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Run a first 5k', plannedMonth: 3 });
    expect(resolveGoalByTitle(v, 2026, 'first 5k')).toBe(g.id);
    expect(resolveGoalByTitle(v, 2026, 'nope')).toBeUndefined();
  });

  it('end-to-end: parse then apply', () => {
    const v = createEmptyVault();
    const intent = parseIntent('add goal: Save for a house', { year: 2026, monthKey: '2026-06' });
    expect(intent).not.toBeNull();
    const r = applyIntent(v, intent!);
    expect(r.ok).toBe(true);
    expect(v.years[2026].goals[0].title).toBe('Save for a house');
  });
});
