import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Trash2, Sparkles, Loader2, MapPin } from 'lucide-react';
import {
  type Goal,
  type MonthlyStep,
  MONTH_ABBR,
  MONTH_NAMES,
  monthKey,
  updateGoal,
  removeGoal,
  setGoalPlannedMonth,
  setMonthlyTarget,
  suggestGoalBreakdown,
  mockProvider,
} from '@getsu/core';
import { useVault } from '../state/store';
import { getAIProvider } from '../lib/ai';
import { riseItem } from '../lib/motion';

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

  // AI "suggest a monthly plan" state, keyed by goal id.
  const [busyGoal, setBusyGoal] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<{ goalId: string; steps: MonthlyStep[] } | null>(null);

  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));
  const del = (g: Goal) => mutate((v) => removeGoal(v, year, g.id));

  const suggestPlan = async (g: Goal) => {
    setBusyGoal(g.id);
    try {
      const provider = getAIProvider();
      const steps = await suggestGoalBreakdown(provider, g.title, year, g.plannedMonth ?? 1);
      setPlanFor({ goalId: g.id, steps });
    } catch {
      const steps = await suggestGoalBreakdown(mockProvider, g.title, year, g.plannedMonth ?? 1);
      setPlanFor({ goalId: g.id, steps });
    } finally {
      setBusyGoal(null);
    }
  };

  // Apply a suggested plan: place the goal in the first month and record each
  // step as that month's intention note.
  const applyPlan = (g: Goal, steps: MonthlyStep[]) => {
    mutate((v) => {
      for (const s of steps) setMonthlyTarget(v, year, g.id, monthKey(year, s.month), s.note);
      setGoalPlannedMonth(v, year, g.id, steps[0]?.month ?? 1);
    });
    setPlanFor(null);
  };

  const Row = ({ g, first }: { g: Goal; first: boolean }) => {
    const done = g.status === 'done';
    const showPlan = planFor?.goalId === g.id;
    return (
      <div style={{ borderTop: first ? 'none' : '1px solid var(--border)' }}>
        <div className="group flex items-center gap-3 py-3.5">
          <span className="h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
          <span className="flex-1 text-[15px]" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{g.title}</span>
          <button
            onClick={() => suggestPlan(g)}
            disabled={busyGoal === g.id}
            className="opacity-0 transition group-hover:opacity-100"
            style={{ color: 'var(--accent)' }}
            aria-label="Suggest a monthly plan"
            title="Suggest a monthly plan"
          >
            {busyGoal === g.id ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          </button>
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

        {showPlan && planFor && (
          <div className="mb-3 rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
            <div className="mb-2.5 flex items-center gap-2">
              <Sparkles size={13} style={{ color: 'var(--accent)' }} />
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Suggested monthly plan</span>
            </div>
            <ul className="flex flex-col gap-2">
              {planFor.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-snug" style={{ color: 'var(--text)' }}>
                  <span className="mt-0.5 w-9 shrink-0 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>{MONTH_ABBR[s.month - 1]}</span>
                  <span>{s.note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3.5 flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => applyPlan(g, planFor.steps)} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                <MapPin size={13} /> Place in {MONTH_NAMES[(planFor.steps[0]?.month ?? 1) - 1]}
              </motion.button>
              <button onClick={() => setPlanFor(null)} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>Dismiss</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    // Page entrance comes from the route transition in App.tsx.
    <div>
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
            .map((g, i) => (
              <motion.div key={g.id} variants={riseItem} initial="hidden" animate="show" custom={i}>
                <Row g={g} first={i === 0} />
              </motion.div>
            ))}
        </div>
      )}

      {unplanned.length > 0 && (
        <>
          <div className="mb-3.5 mt-7 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Unplanned</div>
          <div className="flex flex-col">
            {unplanned.map((g, i) => (
              <motion.div key={g.id} variants={riseItem} initial="hidden" animate="show" custom={planned.length + i}>
                <Row g={g} first={i === 0} />
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-[12px] italic" style={{ color: 'var(--text-faint)' }}>
            Open the <button onClick={() => navigate(`/year/${year}`)} className="underline" style={{ color: 'var(--accent)' }}>year board</button> and drag these onto the months where they'll happen.
          </p>
        </>
      )}
    </div>
  );
}
