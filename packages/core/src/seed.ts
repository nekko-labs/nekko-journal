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
  setMonthlyTarget,
} from './vault.js';

// A seeded demo vault so the app is alive and inspiring on first run — no setup.
// Tells a small, believable year-at-a-month-scale story.
export function seedDemoVault(currentYear = 2026): Vault {
  const vault = createEmptyVault();
  const year = currentYear;

  ensureYear(vault, year);
  setYearTheme(vault, year, 'Build & breathe');

  // Trackers — monthly totals, never streaks.
  const runs = addTracker(vault, { name: 'Runs', kind: 'count', unit: 'runs', color: '#34d399', target: 8 });
  const books = addTracker(vault, { name: 'Books read', kind: 'count', unit: 'books', color: '#60a5fa', target: 2 });
  const travel = addTracker(vault, { name: 'Real vacation', kind: 'boolean', color: '#f59e0b' });

  // Yearly goals, broken down into months.
  const fitness = addGoal(vault, year, {
    title: 'Run a half marathon',
    why: 'Prove to myself I can stick with something for a whole year.',
    category: 'Health',
    metricKind: 'milestone',
    color: '#34d399',
  });
  const reading = addGoal(vault, year, {
    title: 'Read 24 books',
    why: 'Trade some scrolling for pages.',
    category: 'Growth',
    metricKind: 'number',
    target: 24,
    unit: 'books',
    color: '#60a5fa',
  });
  const ship = addGoal(vault, year, {
    title: 'Ship Nekko Journal',
    why: 'Make the monthly journal I always wanted.',
    category: 'Work',
    metricKind: 'milestone',
    color: '#ff7a59',
  });

  setMonthlyTarget(vault, year, fitness.id, `${year}-01`, 'Base building — 3 easy runs/week');
  setMonthlyTarget(vault, year, fitness.id, `${year}-02`, 'First 10k');
  setMonthlyTarget(vault, year, fitness.id, `${year}-06`, 'Long run up to 18km');
  setMonthlyTarget(vault, year, reading.id, `${year}-01`, '2 books');
  setMonthlyTarget(vault, year, reading.id, `${year}-02`, '2 books');
  setMonthlyTarget(vault, year, ship.id, `${year}-06`, 'MVP: Year + Month + Goals views');

  // January — a full, reflective month.
  updateMonth(vault, `${year}-01`, {
    reflection:
      "A slow, deliberate start to the year. Spent the first week just thinking about what I actually want instead of rushing into resolutions. Settled on three goals and, more importantly, *why* each one matters.\n\nThe monthly rhythm already feels right — I'm not staring at a daily checkbox feeling guilty.",
    highlights: ['Set my three goals for the year', 'Ran 12 times — best month of base building', 'Read "Four Thousand Weeks"'],
    struggles: ['Travel for work threw off the last week'],
    gratitude: ['A quiet New Year at home'],
    mood: 4,
  });
  setTrackerValue(vault, `${year}-01`, runs.id, 12);
  setTrackerValue(vault, `${year}-01`, books.id, 2);
  setTrackerValue(vault, `${year}-01`, travel.id, false);
  setGoalCheckin(vault, `${year}-01`, fitness.id, { note: 'Base building going well, no injuries.' });
  setGoalCheckin(vault, `${year}-01`, reading.id, { value: 2, note: 'Ahead of pace.' });

  // February — lighter.
  updateMonth(vault, `${year}-02`, {
    reflection: 'Shorter, colder month. Kept the running going and ran my first 10k. Reading slipped a bit — only finished one book.',
    highlights: ['First 10k!', 'Weekend trip to the coast'],
    struggles: ['Got sick for a week mid-month'],
    mood: 3,
  });
  setTrackerValue(vault, `${year}-02`, runs.id, 8);
  setTrackerValue(vault, `${year}-02`, books.id, 1);
  setTrackerValue(vault, `${year}-02`, travel.id, true);
  setGoalCheckin(vault, `${year}-02`, fitness.id, { note: 'First 10k done. On track.' });

  // June — current month, in progress.
  updateMonth(vault, `${year}-06`, {
    reflection: 'Started building Nekko Journal this month — the monthly journal I always wished existed. Long runs are getting genuinely long.',
    highlights: ['Kicked off Nekko Journal', '18km long run'],
    mood: 5,
  });
  setTrackerValue(vault, `${year}-06`, runs.id, 10);
  setTrackerValue(vault, `${year}-06`, books.id, 3);
  setGoalCheckin(vault, `${year}-06`, ship.id, { note: 'MVP underway.' });

  // A little last-year history so "this month last year" has something to show.
  ensureYear(vault, year - 1);
  setYearTheme(vault, year - 1, 'Rest & reset');
  ensureMonth(vault, `${year - 1}-06`);
  updateMonth(vault, `${year - 1}-06`, {
    reflection: 'A quieter June last year — mostly recovering from burnout and figuring out what I wanted next.',
    highlights: ['Took two full weeks off', 'Started journaling again'],
    mood: 3,
  });

  return vault;
}
