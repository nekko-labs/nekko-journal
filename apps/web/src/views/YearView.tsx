import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Target, Camera, Pencil } from 'lucide-react';
import {
  MONTH_ABBR,
  monthKey,
  yearMonthKeys,
  isMonthFilled,
  type Month,
  type Goal,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { PageHeader } from '../components/ui';

const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];
const NO_GOALS: Goal[] = []; // stable ref so the year-goals selector never loops

function MonthCell({ year, month }: { year: number; month: number }) {
  const key = monthKey(year, month);
  const m = useVault((s) => s.vault!.months[key]) as Month | undefined;
  const navigate = useNavigate();
  const filled = isMonthFilled(m);
  const today = useVault((s) => s.currentYear);
  const isCurrent = year === today && month === 6; // demo "current" month

  return (
    <button
      onClick={() => navigate(`/month/${key}`)}
      className="card group flex h-40 flex-col p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: isCurrent ? 'var(--accent)' : 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="serif text-lg font-semibold">{MONTH_ABBR[month - 1]}</span>
        {m?.mood ? <span className="text-lg">{MOODS[m.mood]}</span> : null}
      </div>
      {filled ? (
        <>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-snug" style={{ color: 'var(--text-soft)' }}>
            {m!.highlights[0] ?? m!.reflection.slice(0, 90) ?? '—'}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
            {m!.highlights.length > 0 && <span>★ {m!.highlights.length}</span>}
            {m!.photos.length > 0 && (
              <span className="flex items-center gap-1"><Camera size={12} /> {m!.photos.length}</span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-start justify-center" style={{ color: 'var(--text-faint)' }}>
          <span className="flex items-center gap-1.5 text-sm opacity-0 transition group-hover:opacity-100">
            <Pencil size={13} /> Reflect on {MONTH_ABBR[month - 1]}
          </span>
        </div>
      )}
    </button>
  );
}

function ThemeWord({ year }: { year: number }) {
  const theme = useVault((s) => s.vault!.years[year]?.theme ?? '');
  const mutate = useVault((s) => s.mutate);
  return (
    <input
      className="serif w-full bg-transparent text-center text-xl italic outline-none placeholder:not-italic"
      style={{ color: 'var(--text)' }}
      value={theme}
      placeholder="a word for the year…"
      onChange={(e) => mutate((v) => { (v.years[year] ??= { year, goals: [], createdAt: '', updatedAt: '' }).theme = e.target.value; })}
    />
  );
}

function GoalsPanel({ year }: { year: number }) {
  const goals = useVault((s) => s.vault!.years[year]?.goals) ?? NO_GOALS;
  const active = goals.filter((g) => g.status !== 'dropped');
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>
          <Target size={15} /> Goals for {year}
        </h2>
        <Link to={`/goals/${year}`} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Manage →</Link>
      </div>
      {active.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>No goals yet. <Link to={`/goals/${year}`} className="underline">Set a few →</Link></p>
      ) : (
        <ul className="space-y-2.5">
          {active.map((g) => (
            <li key={g.id} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
              <span className={`flex-1 text-sm ${g.status === 'done' ? 'line-through opacity-60' : ''}`}>{g.title}</span>
              {g.status === 'done' && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>done</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function YearView() {
  const { year: yearParam } = useParams();
  const currentYear = useVault((s) => s.currentYear);
  const year = Number(yearParam) || currentYear;
  const navigate = useNavigate();
  const months = useVault((s) => s.vault!.months);
  const journaled = yearMonthKeys(year).filter((k) => isMonthFilled(months[k])).length;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button className="btn !px-2" onClick={() => navigate(`/year/${year - 1}`)} aria-label="Previous year"><ChevronLeft size={18} /></button>
            {year}
            <button className="btn !px-2" onClick={() => navigate(`/year/${year + 1}`)} aria-label="Next year"><ChevronRight size={18} /></button>
          </span>
        }
        subtitle={`${journaled} of 12 months journaled · daily is too much, a year too long`}
      />

      <div className="mb-6 card px-5 py-4">
        <div className="text-center text-xs uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Theme of the year</div>
        <ThemeWord year={year} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <MonthCell key={i} year={year} month={i + 1} />
          ))}
        </div>
        <GoalsPanel year={year} />
      </div>
    </div>
  );
}
