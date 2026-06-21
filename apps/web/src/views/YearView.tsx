import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Target, Camera, Star, Pencil } from 'lucide-react';
import {
  MONTH_NAMES,
  MONTH_ABBR,
  MOOD_EMOJI,
  moodVar,
  monthKey,
  yearMonthKeys,
  isMonthFilled,
  type Month,
  type Goal,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { PageHeader } from '../components/ui';

const NO_GOALS: Goal[] = []; // stable ref so the year-goals selector never loops

function MonthCell({ year, month, isCurrent }: { year: number; month: number; isCurrent: boolean }) {
  const key = monthKey(year, month);
  const m = useVault((s) => s.vault!.months[key]) as Month | undefined;
  const navigate = useNavigate();
  const filled = isMonthFilled(m);
  const photo = m?.photos[0];

  return (
    <button
      onClick={() => navigate(`/month/${key}`)}
      className="card group relative flex h-56 flex-col overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
        boxShadow: isCurrent ? '0 0 0 1px var(--accent), var(--shadow-soft)' : undefined,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-lift)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = isCurrent ? '0 0 0 1px var(--accent), var(--shadow-soft)' : '')}
    >
      {/* mood color stripe along the top */}
      <div className="h-1.5 w-full shrink-0" style={{ background: filled ? moodVar(m?.mood) : 'transparent' }} />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="serif text-xl font-semibold">{MONTH_NAMES[month - 1]}</span>
            {isCurrent && <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>now</span>}
          </div>
          {m?.mood ? <span className="text-2xl leading-none">{MOOD_EMOJI[m.mood]}</span> : null}
        </div>

        {filled ? (
          <>
            <div className="mt-2.5 flex flex-1 gap-3 overflow-hidden">
              <ul className="flex-1 space-y-1">
                {m!.highlights.slice(0, 2).map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm leading-snug" style={{ color: 'var(--text-soft)' }}>
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: moodVar(m?.mood) }} />
                    <span className="line-clamp-2">{h}</span>
                  </li>
                ))}
                {m!.highlights.length === 0 && (
                  <li className="line-clamp-3 text-sm leading-snug" style={{ color: 'var(--text-soft)' }}>{m!.reflection.slice(0, 100)}</li>
                )}
              </ul>
              {photo && (
                <img src={photo.src} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
              {m!.highlights.length > 0 && <span className="flex items-center gap-1"><Star size={11} /> {m!.highlights.length}</span>}
              {m!.photos.length > 0 && <span className="flex items-center gap-1"><Camera size={11} /> {m!.photos.length}</span>}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-start justify-end" style={{ color: 'var(--text-faint)' }}>
            <span className="flex items-center gap-1.5 text-sm transition-opacity duration-200 group-hover:text-[color:var(--accent)]">
              <Pencil size={14} /> Reflect on {MONTH_ABBR[month - 1]}
            </span>
          </div>
        )}
      </div>
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
  const currentMonth = year === currentYear ? 6 : 0; // demo "current" month is June

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button className="btn !px-2.5" onClick={() => navigate(`/year/${year - 1}`)} aria-label="Previous year"><ChevronLeft size={18} /></button>
            {year}
            <button className="btn !px-2.5" onClick={() => navigate(`/year/${year + 1}`)} aria-label="Next year"><ChevronRight size={18} /></button>
          </span>
        }
        subtitle={`${journaled} of 12 months journaled · daily is too much, a year too long`}
        right={
          <Link to="/years" className="btn">All years →</Link>
        }
      />

      <div className="mb-6 card px-5 py-4">
        <div className="text-center text-xs uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Theme of the year</div>
        <ThemeWord year={year} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="animate-rise" style={{ animationDelay: `${i * 18}ms` }}>
              <MonthCell year={year} month={i + 1} isCurrent={i + 1 === currentMonth} />
            </div>
          ))}
        </div>
        <GoalsPanel year={year} />
      </div>
    </div>
  );
}
