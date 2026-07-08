import { useParams, useNavigate } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import {
  type Goal,
  MONTH_ABBR,
  monthKey,
  updateGoal,
  removeGoal,
} from '@nekko/journal-core';
import { useVault } from '../state/store';

const EMPTY_GOALS: Goal[] = [];

export default function GoalsView() {
  const navigate = useNavigate();
  const { year: yearParam } = useParams();
  const vault = useVault((s) => s.vault)!;
  const currentYear = useVault((s) => s.currentYear);
  const mutate = useVault((s) => s.mutate);
  const year = Number(yearParam) || currentYear;

  const goals = vault.years[year]?.goals ?? EMPTY_GOALS;
  const planned = goals.filter((g) => g.plannedMonth != null);
  const unplanned = goals.filter((g) => g.plannedMonth == null);

  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));
  const del = (g: Goal) => mutate((v) => removeGoal(v, year, g.id));

  const Row = ({ g, first }: { g: Goal; first: boolean }) => {
    const done = g.status === 'done';
    return (
      <div
        className="group flex items-center gap-3 py-3.5"
        style={{ borderTop: first ? 'none' : '1px solid var(--border)' }}
      >
        <span className="h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
        <span className="flex-1 text-[15px]" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{g.title}</span>
        {g.plannedMonth != null ? (
          <button
            onClick={() => navigate(`/month/${monthKey(year, g.plannedMonth!)}`)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
          >
            {MONTH_ABBR[g.plannedMonth - 1]}
          </button>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>on the board</span>
        )}
        <button
          onClick={() => toggleDone(g)}
          className="grid h-[26px] w-[26px] place-items-center rounded-full transition active:scale-95"
          style={{
            border: done ? '1px solid var(--success)' : '1px solid var(--border)',
            background: done ? 'var(--success)' : 'transparent',
            color: done ? '#fff' : 'var(--text-faint)',
          }}
          aria-label={done ? 'Mark active' : 'Mark done'}
        >
          <Check size={13} strokeWidth={2.6} />
        </button>
        <button
          onClick={() => del(g)}
          className="opacity-0 transition group-hover:opacity-100"
          style={{ color: 'var(--text-faint)' }}
          aria-label="Delete goal"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  return (
    <div className="animate-rise">
      <h1 className="serif mb-1.5 mt-1.5 text-3xl font-semibold tracking-tight">Goals · {year}</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        Every goal for the year, planned into a month or waiting on the board.
      </p>

      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>In the calendar</div>
      {planned.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>
          Nothing planned yet. Drag goals onto months from the{' '}
          <button onClick={() => navigate(`/year/${year}`)} className="underline" style={{ color: 'var(--accent)' }}>year board</button>.
        </p>
      ) : (
        <div className="flex flex-col">
          {planned
            .slice()
            .sort((a, b) => (a.plannedMonth ?? 0) - (b.plannedMonth ?? 0))
            .map((g, i) => <Row key={g.id} g={g} first={i === 0} />)}
        </div>
      )}

      {unplanned.length > 0 && (
        <>
          <div className="mb-3.5 mt-7 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Unplanned</div>
          <div className="flex flex-col">
            {unplanned.map((g, i) => <Row key={g.id} g={g} first={i === 0} />)}
          </div>
          <p className="mt-4 text-[12px] italic" style={{ color: 'var(--text-faint)' }}>
            Open the <button onClick={() => navigate(`/year/${year}`)} className="underline" style={{ color: 'var(--accent)' }}>year board</button> and drag these onto the months where they'll happen.
          </p>
        </>
      )}
    </div>
  );
}
