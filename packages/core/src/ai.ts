import { type Month, type Goal, MONTH_NAMES, monthLabel } from '@getsu/shared';
import { type YearInReview, type ReflectionMaterial } from './lookback.js';

// Provider-agnostic AI assistant for Getsu. The default is Claude, but
// nothing here imports an SDK or touches the network: this module defines the
// operations, the prompts they'd send to a real model, AND a deterministic
// heuristic fallback ("mock mode") used whenever no provider/key is configured.
// The web layer supplies the real Claude provider (BYO key, stored locally).
//
// Design: every operation has a *mock* (pure, unit-testable, no network) and a
// *real* path (build a prompt, call the provider, parse). When the provider is
// unavailable the mock runs, so the whole assistant works offline and free.

export interface AICompletionInput {
  system?: string;
  user: string;
  maxTokens?: number;
}

export interface AIProvider {
  /** Whether a real model is configured. When false, operations use mock mode. */
  readonly available: boolean;
  /** A short human label for the active provider (e.g. "Claude", "Offline"). */
  readonly label: string;
  complete(input: AICompletionInput): Promise<string>;
}

/** The always-offline provider: `available` is false, so mocks are used. */
export const mockProvider: AIProvider = {
  available: false,
  label: 'Offline',
  complete: async () => '',
};

function bullets(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((l) => l.length > 0);
}

function firstSentences(text: string, n = 2): string {
  const clean = text.replace(/[#>*`_-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = clean.split(/(?<=[.!?])\s+/).slice(0, n);
  return parts.join(' ');
}

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// ---------------------------------------------------------------------------
// 1. Reflection prompts / journaling assistant (T17)
// ---------------------------------------------------------------------------

export function reflectionPromptsMock(month: Month, goals: Goal[]): string[] {
  const name = MONTH_NAMES[month.month - 1];
  const goalTitles = goals.map((g) => g.title);
  const prompts = [
    `What's one moment from ${name} you don't want to forget?`,
    goalTitles.length
      ? `How did "${goalTitles[0]}" go this month — a step forward, a stall, or a change of heart?`
      : `Which of your goals moved forward in ${name}, and what nudged it along?`,
    `What felt hard in ${name}, and what did it teach you?`,
    `Who or what are you grateful for this month?`,
  ];
  return prompts.slice(0, 4);
}

export async function reflectionPrompts(provider: AIProvider, month: Month, goals: Goal[]): Promise<string[]> {
  if (!provider.available) return reflectionPromptsMock(month, goals);
  const name = monthLabel(month.id);
  const goalLine = goals.length ? `Their goals this month: ${goals.map((g) => g.title).join(', ')}.` : 'No goals are planned this month.';
  const text = await provider.complete({
    system: 'You are a calm, warm monthly-journaling companion. You never nag or moralize. You ask short, specific, open-ended questions that help someone reflect on the month they just lived.',
    user: `Write 4 short reflection prompts for someone journaling about ${name}. ${goalLine} Return only the questions, one per line, no numbering.`,
    maxTokens: 400,
  });
  const lines = bullets(text).slice(0, 4);
  return lines.length ? lines : reflectionPromptsMock(month, goals);
}

// ---------------------------------------------------------------------------
// 2. Summarize a month from sparse notes (T18)
// ---------------------------------------------------------------------------

export function summarizeMonthMock(month: Month): string {
  const name = monthLabel(month.id);
  const words = countWords(month.reflection);
  const bits: string[] = [];
  if (month.highlights.length) bits.push(`${month.highlights.length} highlight${month.highlights.length === 1 ? '' : 's'}`);
  if (month.photos.length) bits.push(`${month.photos.length} photo${month.photos.length === 1 ? '' : 's'}`);
  const doneGoals = Object.values(month.goalCheckins).filter((c) => c.done).length;
  if (doneGoals) bits.push(`${doneGoals} goal${doneGoals === 1 ? '' : 's'} done`);
  const lead = firstSentences(month.reflection);
  const stats = bits.length ? ` You kept ${bits.join(', ')}.` : '';
  if (!lead && !stats.trim()) return `${name} is still a blank page — nothing written yet.`;
  return `${name}: ${lead}`.trim() + stats;
}

export async function summarizeMonth(provider: AIProvider, month: Month): Promise<string> {
  if (!provider.available) return summarizeMonthMock(month);
  const name = monthLabel(month.id);
  const parts = [
    month.reflection && `Reflection:\n${month.reflection}`,
    month.highlights.length && `Highlights: ${month.highlights.join('; ')}`,
    month.struggles.length && `Struggles: ${month.struggles.join('; ')}`,
    month.mood && `Mood: ${month.mood}/5`,
  ].filter(Boolean).join('\n');
  if (!parts.trim()) return summarizeMonthMock(month);
  const text = await provider.complete({
    system: 'You gently summarize a person\'s month from their sparse journal notes. Warm, second person ("you"), 2-3 sentences, no clichés, no advice.',
    user: `Summarize ${name} from these notes:\n\n${parts}`,
    maxTokens: 400,
  });
  return text.trim() || summarizeMonthMock(month);
}

// ---------------------------------------------------------------------------
// 3. Draft a year-in-review (T18)
// ---------------------------------------------------------------------------

export function draftYearInReviewMock(review: YearInReview): string {
  const lines: string[] = [];
  lines.push(`# ${review.year}${review.theme ? ` — ${review.theme}` : ''}`);
  lines.push('');
  lines.push(`You journaled ${review.monthsJournaled} month${review.monthsJournaled === 1 ? '' : 's'} this year and kept ${review.photoCount} photo${review.photoCount === 1 ? '' : 's'}.`);
  if (review.goalsAchieved.length) {
    lines.push('');
    lines.push(`**Goals reached:** ${review.goalsAchieved.map((g) => g.title).join(', ')}.`);
  }
  if (review.highlights.length) {
    lines.push('');
    lines.push('**A few highlights**');
    for (const h of review.highlights.slice(0, 6)) lines.push(`- ${h.text}`);
  }
  if (review.averageMood) {
    lines.push('');
    lines.push(`Your mood averaged ${review.averageMood.toFixed(1)} out of 5 across the year.`);
  }
  return lines.join('\n');
}

export async function draftYearInReview(provider: AIProvider, review: YearInReview): Promise<string> {
  if (!provider.available) return draftYearInReviewMock(review);
  const material = [
    `Year: ${review.year}`,
    review.theme && `Theme: ${review.theme}`,
    `Months journaled: ${review.monthsJournaled}`,
    `Photos kept: ${review.photoCount}`,
    review.goalsAchieved.length && `Goals achieved: ${review.goalsAchieved.map((g) => g.title).join(', ')}`,
    review.highlights.length && `Highlights:\n${review.highlights.slice(0, 12).map((h) => `- ${h.text}`).join('\n')}`,
    review.averageMood && `Average mood: ${review.averageMood.toFixed(1)}/5`,
  ].filter(Boolean).join('\n');
  const text = await provider.complete({
    system: 'You write a warm, personal year-in-review from someone\'s journal. Second person, markdown, a short title then a few paragraphs. Celebrate honestly without exaggeration; no advice for next year unless the notes invite it.',
    user: `Write a year-in-review from this:\n\n${material}`,
    maxTokens: 1200,
  });
  return text.trim() || draftYearInReviewMock(review);
}

// ---------------------------------------------------------------------------
// 4. Suggest a goal → monthly breakdown (T19)
// ---------------------------------------------------------------------------

export interface MonthlyStep {
  month: number; // 1-12
  note: string;
}

export function suggestGoalBreakdownMock(title: string, startMonth = 1): MonthlyStep[] {
  const phases = [
    `Get clear on what "${title}" really means to you and what done looks like.`,
    `Take the first small, concrete step toward ${title.toLowerCase()}.`,
    `Build momentum — make it a regular part of the month.`,
    `Check in: what's working, what to adjust.`,
    `Push through the messy middle of ${title.toLowerCase()}.`,
    `Reflect and celebrate the progress you've made.`,
  ];
  return phases.map((note, i) => ({ month: Math.min(12, startMonth + i * 2), note }));
}

export async function suggestGoalBreakdown(provider: AIProvider, title: string, year: number, startMonth = 1): Promise<MonthlyStep[]> {
  if (!provider.available) return suggestGoalBreakdownMock(title, startMonth);
  const text = await provider.complete({
    system: 'You break a yearly goal into a few realistic monthly steps for a calm, anti-streak journal. Return lines like "March: <one concrete step>". 4-6 steps, spread across the year, no filler.',
    user: `Goal for ${year}: "${title}". Suggest a monthly breakdown.`,
    maxTokens: 600,
  });
  const steps: MonthlyStep[] = [];
  for (const line of bullets(text)) {
    const m = line.match(/^([A-Za-z]+)\s*[:\-–]\s*(.+)$/);
    if (!m) continue;
    const idx = MONTH_NAMES.findIndex((n) => n.toLowerCase().startsWith(m[1].toLowerCase().slice(0, 3)));
    if (idx >= 0) steps.push({ month: idx + 1, note: m[2].trim() });
  }
  return steps.length ? steps : suggestGoalBreakdownMock(title, startMonth);
}

// ---------------------------------------------------------------------------
// 5. Reflect on the whole journey: highlights, growth, things to work on
// ---------------------------------------------------------------------------

/** A calm, three-part reflection over everything in the vault. */
export interface JourneyReflection {
  /** What's going well / brightest moments. */
  highlights: string[];
  /** Where the person has grown. */
  growth: string[];
  /** Gentle, non-nagging suggestions to work on. */
  workOn: string[];
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function reflectOnJourneyMock(m: ReflectionMaterial): JourneyReflection {
  const highlights: string[] = [];
  const growth: string[] = [];
  const workOn: string[] = [];

  // Highlights: follow-through, brightest month, a few remembered moments.
  if (m.goalsAchieved.length) {
    const few = m.goalsAchieved.slice(0, 3).join(', ');
    highlights.push(`You followed through on ${plural(m.goalsAchieved.length, 'goal')}: ${few}${m.goalsAchieved.length > 3 ? ', and more' : ''}.`);
  }
  if (m.brightestMonth) highlights.push(`${m.brightestMonth} shines brightest in your record.`);
  for (const h of m.highlights.slice(0, 3)) highlights.push(h);
  if (!highlights.length) highlights.push('Your record is just beginning. The first highlight is a single month away.');

  // Growth: the habit itself, trackers trending up, a life you can see.
  if (m.monthsJournaled) growth.push(`You've kept ${plural(m.monthsJournaled, 'month')} across ${plural(m.yearsTracked, 'year')}, a real habit of looking back.`);
  for (const t of m.trackerTotals.slice(0, 2)) {
    const unit = t.unit || t.name.toLowerCase();
    const target = t.target != null ? (t.total >= t.target ? `, past your target of ${t.target}` : `, on the way to ${t.target}`) : '';
    growth.push(`${t.total} ${unit} logged${target}.`);
  }
  if (m.photoCount) growth.push(`${plural(m.photoCount, 'photo')} kept: a life you can see, not just remember.`);
  if (growth.length < 2 && m.averageMood) growth.push(`Your months average ${m.averageMood.toFixed(1)} out of 5, steady ground to grow from.`);
  if (!growth.length) growth.push('Every entry you add makes the next reflection a little richer.');

  // To work on: unplaced goals, one in motion, a quiet month, named struggles.
  if (m.goalsUnplanned.length) {
    const one = m.goalsUnplanned.length === 1;
    workOn.push(`${plural(m.goalsUnplanned.length, 'goal')} ${one ? 'is' : 'are'} still waiting on the board. Give ${one ? 'it' : 'them'} a month to live in.`);
  }
  if (m.goalsActive.length) workOn.push(`"${m.goalsActive[0]}" is still in motion. One small step this month keeps it alive.`);
  if (m.quietestMonth && m.quietestMonth !== m.brightestMonth) workOn.push(`${m.quietestMonth} felt quieter. Worth a gentle look back at what it was asking for.`);
  if (m.struggles.length) workOn.push(`You named ${plural(m.struggles.length, 'struggle')}. Naming them is already the hard part.`);
  if (!workOn.length) workOn.push('Nothing pressing. Keep showing up once a month and let it compound.');

  return { highlights: highlights.slice(0, 4), growth: growth.slice(0, 4), workOn: workOn.slice(0, 4) };
}

function parseReflection(text: string): JourneyReflection {
  const out: JourneyReflection = { highlights: [], growth: [], workOn: [] };
  let cur: keyof JourneyReflection | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const head = line.toLowerCase().replace(/^[#*\s]+/, '');
    if (/^highlight/.test(head)) { cur = 'highlights'; continue; }
    if (/^(area|growth|grown)/.test(head)) { cur = 'growth'; continue; }
    if (/^(to work|work on|things to work|work\b)/.test(head)) { cur = 'workOn'; continue; }
    const bullet = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
    if (cur && bullet) out[cur].push(bullet);
  }
  return out;
}

export async function reflectOnJourney(provider: AIProvider, m: ReflectionMaterial): Promise<JourneyReflection> {
  if (!provider.available) return reflectOnJourneyMock(m);
  const material = [
    `Months journaled: ${m.monthsJournaled} across ${m.yearsTracked} year(s)`,
    m.goalsAchieved.length && `Goals achieved: ${m.goalsAchieved.join(', ')}`,
    m.goalsActive.length && `Goals in progress: ${m.goalsActive.join(', ')}`,
    m.goalsUnplanned.length && `Goals not yet scheduled: ${m.goalsUnplanned.join(', ')}`,
    m.highlights.length && `Highlights:\n${m.highlights.map((h) => `- ${h}`).join('\n')}`,
    m.recentReflections.length && `Recent months:\n${m.recentReflections.map((r) => `- ${r.label}: ${r.text}`).join('\n')}`,
    m.struggles.length && `Struggles: ${m.struggles.join('; ')}`,
    m.trackerTotals.length && `Trackers: ${m.trackerTotals.map((t) => `${t.total} ${t.unit || t.name}`).join(', ')}`,
    m.averageMood && `Average mood: ${m.averageMood.toFixed(1)}/5`,
    m.brightestMonth && `Brightest month: ${m.brightestMonth}`,
    m.quietestMonth && `Quietest month: ${m.quietestMonth}`,
  ].filter(Boolean).join('\n');

  const text = await provider.complete({
    system:
      'You are a calm, warm reflection companion for a monthly journal. From someone\'s months of entries you reflect back three short, specific, kind lists. Never nag, never moralize, never invent facts that are not in the notes. Use second person ("you"). Never use em dashes; prefer a comma, colon, or two short sentences. Output EXACTLY three sections, each header on its own line: "Highlights:", "Areas of growth:", "To work on:". Under each, 2-4 short bullet lines starting with "- ". No preamble and no closing remarks.',
    user: `Reflect on this person's journal:\n\n${material}`,
    maxTokens: 700,
  });

  const parsed = parseReflection(text);
  if (!parsed.highlights.length && !parsed.growth.length && !parsed.workOn.length) return reflectOnJourneyMock(m);
  const fallback = reflectOnJourneyMock(m);
  return {
    highlights: parsed.highlights.length ? parsed.highlights : fallback.highlights,
    growth: parsed.growth.length ? parsed.growth : fallback.growth,
    workOn: parsed.workOn.length ? parsed.workOn : fallback.workOn,
  };
}
