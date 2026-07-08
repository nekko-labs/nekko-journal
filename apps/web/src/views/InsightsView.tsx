import { useNavigate } from 'react-router-dom';
import { MONTH_ABBR, isMonthFilled, countMonthPhotos } from '@nekko/journal-core';
import { useVault } from '../state/store';

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function InsightsView() {
  const navigate = useNavigate();
  const vault = useVault((s) => s.vault)!;
  const currentYear = useVault((s) => s.currentYear);

  const months = Object.values(vault.months);
  const allGoals = Object.values(vault.years).flatMap((y) => y.goals);

  const monthsJournaled = months.filter((m) => isMonthFilled(m)).length;
  const goalsAchieved = allGoals.filter((g) => g.status === 'done').length;
  const yearsTracked = Object.keys(vault.years).length;
  const goalsSet = allGoals.length;
  const photosKept = months.reduce((n, m) => n + countMonthPhotos(m), 0);
  const wordsWritten = months.reduce((n, m) => n + (m.reflection.trim() ? m.reflection.trim().split(/\s+/).length : 0), 0);

  const tiles = [
    { value: fmt(monthsJournaled), label: 'months journaled', accent: true },
    { value: fmt(goalsAchieved), label: 'goals achieved' },
    { value: fmt(yearsTracked), label: 'years tracked' },
    { value: fmt(goalsSet), label: 'goals set' },
    { value: fmt(photosKept), label: 'photos kept' },
    { value: fmt(wordsWritten), label: 'words written' },
  ];

  // Goals placed per month, current year → bar chart.
  const yearGoals = vault.years[currentYear]?.goals ?? [];
  const counts = MONTH_ABBR.map((_, i) => yearGoals.filter((g) => g.plannedMonth === i + 1).length);
  const max = Math.max(1, ...counts);

  const planned = yearGoals.filter((g) => g.plannedMonth != null);
  const doneCount = planned.filter((g) => g.status === 'done').length;
  const pct = planned.length ? (doneCount / planned.length) * 100 : 0;

  return (
    <div className="animate-rise">
      <h1 className="serif mb-1.5 mt-1.5 text-3xl font-semibold tracking-tight">Insights</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>Everything you've done, at a month scale.</p>

      {/* all-time stat tiles */}
      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>All time</div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-6">
        {tiles.map((t, i) => (
          <div key={i} className="animate-rise" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="serif text-3xl font-semibold leading-none" style={{ color: t.accent ? 'var(--accent)' : 'var(--text)' }}>{t.value}</div>
            <div className="mt-1.5 text-[11px] leading-tight" style={{ color: 'var(--text-soft)' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* goals across the year */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-4 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Goals across {currentYear}</div>
        <div className="flex h-[104px] items-end gap-1.5">
          {counts.map((c, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className="animate-grow-y w-full rounded-md"
                style={{ height: c ? Math.max(10, (c / max) * 90) : 3, background: c ? 'var(--grad)' : 'var(--border)', animationDelay: `${i * 0.04}s` }}
              />
              <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{MONTH_ABBR[i][0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* progress */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Progress</div>
          <span className="text-xs" style={{ color: 'var(--text-soft)' }}>{doneCount} of {planned.length} achieved</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--grad)', transition: 'width .5s var(--ease-out-quint)' }} />
        </div>
        <div className="mt-5 flex flex-col gap-3.5">
          {planned.map((g) => (
            <div key={g.id} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
              <span className="flex-1 text-[14.5px]" style={{ color: 'var(--text)', textDecoration: g.status === 'done' ? 'line-through' : 'none', opacity: g.status === 'done' ? 0.55 : 1 }}>{g.title}</span>
              <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{g.status === 'done' ? 'done' : 'active'}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => navigate('/lookback')} className="mt-8 text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
        Look back through the year →
      </button>
    </div>
  );
}
