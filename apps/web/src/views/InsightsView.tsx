import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Flame, Star, Camera, PenLine, Trophy } from 'lucide-react';
import {
  moodVar,
  MOOD_EMOJI,
  lifetimeStats,
  moodSeries,
  trackerSeries,
  trackerTotal,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { PageHeader, Section } from '../components/ui';
import { MonthBars, StatTile, ProgressBar } from '../components/charts';

export default function InsightsView() {
  const currentYear = useVault((s) => s.currentYear);
  const vault = useVault((s) => s.vault!);
  const [year, setYear] = useState(currentYear);

  const life = lifetimeStats(vault);
  const moods = moodSeries(vault, year);
  const moodColors = moods.map((m) => moodVar(m));
  const validMoods = moods.filter((m): m is number => typeof m === 'number');
  const avgMood = validMoods.length ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : 0;

  const trackers = vault.trackers.filter((t) => t.active);
  const goals = vault.years[year]?.goals ?? [];
  const goalsDone = goals.filter((g) => g.status === 'done').length;

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <PageHeader
        title="Insights"
        subtitle="Progress, trends, and everything you've done — at a month scale."
      />

      {/* Lifetime — everything you've done */}
      <Section title="All time">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile value={life.monthsJournaled} label="months journaled" accent="var(--accent)" />
          <StatTile value={<span className="flex items-center gap-1.5"><Flame size={22} style={{ color: 'var(--mood-5)' }} /> {life.longestRun}</span>} label="longest monthly run" />
          <StatTile value={life.yearsTracked} label="years tracked" />
          <StatTile value={<span className="flex items-center gap-1.5"><Star size={20} style={{ color: 'var(--mood-5)' }} /> {life.totalHighlights}</span>} label="highlights captured" />
          <StatTile value={<span className="flex items-center gap-1.5"><Camera size={20} style={{ color: 'var(--accent)' }} /> {life.totalPhotos}</span>} label="photos kept" />
          <StatTile value={<span className="flex items-center gap-1.5"><PenLine size={20} style={{ color: 'var(--text-soft)' }} /> {life.totalWords.toLocaleString()}</span>} label="words reflected" />
        </div>
        {life.goalsAchieved > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            <Trophy size={15} style={{ color: 'var(--mood-5)' }} /> {life.goalsAchieved} {life.goalsAchieved === 1 ? 'goal' : 'goals'} achieved across the years
          </p>
        )}
      </Section>

      {/* Year switcher */}
      <div className="my-5 flex items-center justify-center gap-3">
        <button className="btn !px-2.5" onClick={() => setYear(year - 1)} aria-label="Previous year"><ChevronLeft size={18} /></button>
        <span className="serif text-2xl font-semibold tabular-nums">{year}</span>
        <button className="btn !px-2.5" onClick={() => setYear(year + 1)} aria-label="Next year"><ChevronRight size={18} /></button>
      </div>

      <div className="space-y-5">
        <Section title="Mood trend" hint={avgMood ? `avg ${MOOD_EMOJI[Math.round(avgMood)]} ${avgMood.toFixed(1)}` : 'no moods yet'}>
          {validMoods.length ? (
            <MonthBars series={moods} colors={moodColors} height={90} />
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>No moods recorded in {year} yet.</p>
          )}
        </Section>

        {trackers.length > 0 && (
          <Section title="Trackers" hint={`${year} totals`}>
            <div className="space-y-5">
              {trackers.map((t) => {
                const total = trackerTotal(vault, year, t.id);
                const series = trackerSeries(vault, year, t.id);
                return (
                  <div key={t.id}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color ?? 'var(--accent)' }} />
                        {t.name}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-soft)' }}>
                        <span className="serif text-lg font-semibold" style={{ color: 'var(--text)' }}>{total}</span> {t.unit ?? ''} this year
                      </span>
                    </div>
                    <MonthBars series={series} color={t.color ?? 'var(--accent)'} unit={t.unit} height={64} />
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Goals" hint={`${year}`}>
          {goals.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>No goals set for {year}.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-soft)' }}>
                <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                {goalsDone} of {goals.length} achieved
              </div>
              <ProgressBar value={goals.length ? goalsDone / goals.length : 0} />
              <ul className="mt-4 space-y-2">
                {goals.map((g) => (
                  <li key={g.id} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
                    <span className={`flex-1 ${g.status === 'done' ? 'line-through opacity-60' : ''}`}>{g.title}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{g.status}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      </div>
    </div>
  );
}
