import { type Month, type Goal, MONTH_NAMES, monthLabel } from '@nekko/journal-shared';
import { type YearInReview } from './lookback.js';

// Provider-agnostic AI assistant for Nekko Journal. The default is Claude, but
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
