import { describe, it, expect } from 'vitest';
import { createEmptyVault, addGoal, updateGoal, setGoalCheckin, addTracker, updateTracker, removeTracker, archiveTracker, setTrackerValue } from './vault.js';
import { goalProgress, yearGoalsProgress } from './lookback.js';

describe('goal progress', () => {
  it('accumulates monthly check-in values toward a number goal target', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Read 12 books', metricKind: 'number', target: 12, plannedMonth: 1 });
    setGoalCheckin(v, '2026-03', g.id, { value: 3 });
    setGoalCheckin(v, '2026-07', g.id, { value: 6 });
    const p = goalProgress(v, g);
    expect(p.value).toBe(9);
    expect(p.target).toBe(12);
    expect(p.fraction).toBeCloseTo(0.75);
    expect(p.done).toBe(false);
  });

  it('marks a number goal done when it reaches target', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Run 8 times', metricKind: 'number', target: 8, plannedMonth: 2 });
    setGoalCheckin(v, '2026-05', g.id, { value: 8 });
    expect(goalProgress(v, g).done).toBe(true);
  });

  it('milestone goals are done-or-not', () => {
    const v = createEmptyVault();
    const g = addGoal(v, 2026, { title: 'Move to the city', plannedMonth: 4 });
    expect(goalProgress(v, g).fraction).toBe(0);
    updateGoal(v, 2026, g.id, { status: 'done' });
    expect(goalProgress(v, g).fraction).toBe(1);
  });

  it('aggregates year progress over planned goals', () => {
    const v = createEmptyVault();
    addGoal(v, 2026, { title: 'A', plannedMonth: 1, status: 'done' });
    addGoal(v, 2026, { title: 'B', plannedMonth: 2 });
    addGoal(v, 2026, { title: 'unplanned' }); // excluded by default
    const yp = yearGoalsProgress(v, 2026);
    expect(yp.total).toBe(2);
    expect(yp.doneCount).toBe(1);
    expect(yp.fraction).toBeCloseTo(0.5);
  });
});

describe('tracker management', () => {
  it('updates, archives, and deletes trackers (cleaning up month values)', () => {
    const v = createEmptyVault();
    const t = addTracker(v, { name: 'Runs', kind: 'count' });
    setTrackerValue(v, '2026-06', t.id, 10);

    updateTracker(v, t.id, { name: 'Morning runs', target: 8 });
    expect(v.trackers[0].name).toBe('Morning runs');
    expect(v.trackers[0].target).toBe(8);

    archiveTracker(v, t.id);
    expect(v.trackers[0].active).toBe(false);

    removeTracker(v, t.id);
    expect(v.trackers).toHaveLength(0);
    expect(v.months['2026-06'].trackers[t.id]).toBeUndefined();
  });
});
