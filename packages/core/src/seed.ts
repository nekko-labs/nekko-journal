import { type Vault } from '@nekko/journal-shared';
import {
  createEmptyVault,
  ensureYear,
  setYearTheme,
  addGoal,
  addTracker,
  ensureMonth,
  updateMonth,
  setTrackerValue,
  setGoalCheckin,
} from './vault.js';

// A seeded demo vault so the app is alive and inspiring on first run — no setup.
// Mirrors the consolidated design's story: goals placed into the months where
// they'll happen, a per-month markdown journal, calm ocean goal colors.
export function seedDemoVault(currentYear = 2026): Vault {
  const vault = createEmptyVault();
  const year = currentYear;

  ensureYear(vault, year);
  setYearTheme(vault, year, 'Rooted');
  vault.settings.plan = 'free';
  vault.settings.notify = 'monthly';

  // Trackers — monthly totals, never streaks. (Kept for Insights; quiet in the UI.)
  const runs = addTracker(vault, { name: 'Runs', kind: 'count', unit: 'runs', color: '#3e8fa0', target: 8 });
  const books = addTracker(vault, { name: 'Books read', kind: 'count', unit: 'books', color: '#7aa889', target: 2 });

  // Yearly goals, each placed into the month where it happens (plannedMonth).
  const G = (title: string, color: string, month: number | undefined, done: boolean) =>
    addGoal(vault, year, {
      title,
      color,
      metricKind: 'milestone',
      plannedMonth: month,
      status: done ? 'done' : 'active',
    });

  G('Morning pages daily', '#9d84b0', 1, false);
  G('Read 12 books', '#7aa889', 3, false);
  G('Run a first 5k', '#5fb0a6', 3, true);
  G('Learn film photography', '#cc7f6a', 4, false);
  G('Cook 20 new dishes', '#d9a55f', 5, false);
  const half = G('Run a half marathon', '#3e8fa0', 6, false);
  G('Save for Japan trip', '#6f97b3', 6, true);
  G('Declutter the flat', '#c58aa0', undefined, false); // on the board
  G('Plan the garden', '#7aa889', undefined, false); // on the board

  // Per-month markdown journals — a small, believable year at a month scale.
  updateMonth(vault, `${year}-01`, {
    reflection:
      'A quiet, hopeful start. Set intentions without pressure and mostly kept them.\n\nHighlights:\n- Started **morning pages**\n- Ran three times a week',
    mood: 4,
  });
  updateMonth(vault, `${year}-03`, {
    reflection:
      '## Momentum arrived\n\nRunning finally clicked and I had time to *read* again.\n\n- First **5k** without walking\n- Finished three books',
    mood: 4,
  });
  updateMonth(vault, `${year}-04`, {
    reflection:
      'Gentle and full of small good things.\n\n> Cherry blossoms with Mio. Spring makes everything feel possible.',
    mood: 5,
  });
  updateMonth(vault, `${year}-05`, {
    reflection:
      'A plateau month. Not bad, just ordinary, and that turned out to be fine.\n\n- Cooked for the whole flat',
    mood: 3,
  });
  updateMonth(vault, `${year}-06`, {
    reflection:
      '## The month it all came together\n\nRan my **first 10k** without stopping. The training finally clicked.\n\nHighlights:\n- Cooked dinner for *six* friends\n- Booked the autumn trip\n\n> Having everyone around the table felt like the whole point.',
    mood: 5,
  });
  setTrackerValue(vault, `${year}-06`, runs.id, 10);
  setTrackerValue(vault, `${year}-06`, books.id, 3);
  setGoalCheckin(vault, `${year}-06`, half.id, { note: 'Long runs getting genuinely long.' });

  // Last year — a lighter, real history so the Years overview + "this month last
  // year" + all-time insights have something to show.
  ensureYear(vault, year - 1);
  setYearTheme(vault, year - 1, 'Steady');
  const prevPlaced: Array<[string, string, number, boolean]> = [
    ['Keep a morning routine', '#9d84b0', 1, true],
    ['Read more', '#7aa889', 2, true],
    ['Learn to cook', '#d9a55f', 3, true],
    ['Take a real vacation', '#6f97b3', 5, true],
    ['Start running', '#3e8fa0', 6, true],
    ['Declutter', '#c58aa0', 8, false],
    ['See old friends', '#5fb0a6', 9, true],
    ['Save consistently', '#cc7f6a', 11, false],
  ];
  for (const [title, color, month, done] of prevPlaced) {
    addGoal(vault, year - 1, { title, color, metricKind: 'milestone', plannedMonth: month, status: done ? 'done' : 'active' });
  }
  ensureMonth(vault, `${year - 1}-06`);
  updateMonth(vault, `${year - 1}-06`, {
    reflection: 'A quieter June last year. Mostly recovering, and figuring out what I wanted next.\n\n- Took two full weeks off\n- Started journaling again',
    mood: 3,
  });

  // A first year further back for the multi-year strip.
  ensureYear(vault, year - 2);
  setYearTheme(vault, year - 2, 'Begin');
  const firstPlaced: Array<[string, string, number]> = [
    ['Move to the city', '#3e8fa0', 3],
    ['Find a rhythm', '#7aa889', 4],
    ['Make the flat home', '#d9a55f', 6],
    ['Meet new people', '#9d84b0', 7],
    ['Take up a hobby', '#cc7f6a', 10],
  ];
  for (const [title, color, month] of firstPlaced) {
    addGoal(vault, year - 2, { title, color, metricKind: 'milestone', plannedMonth: month, status: 'done' });
  }

  return vault;
}
