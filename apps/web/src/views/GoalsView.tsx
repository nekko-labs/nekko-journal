import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import {
  MONTH_ABBR,
  monthKey,
  addGoal,
  updateGoal,
  removeGoal,
  setMonthlyTarget,
  type Goal,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { PageHeader } from '../components/ui';

const COLORS = ['#7c83ff', '#34d399', '#60a5fa', '#f59e0b', '#ff7a59', '#ec4899', '#a78bfa'];
const NO_GOALS: Goal[] = []; // stable ref so the year-goals selector never loops

function GoalCard({ goal }: { goal: Goal }) {
  const mutate = useVault((s) => s.mutate);
  const navigate = useNavigate();
  const done = goal.status === 'done';
  return (
    <div className="card p-5" style={{ borderLeft: `4px solid ${goal.color ?? 'var(--accent)'}` }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          <input
            className={`serif w-full bg-transparent text-lg font-semibold outline-none ${done ? 'line-through opacity-60' : ''}`}
            value={goal.title}
            onChange={(e) => mutate((v) => updateGoal(v, goal.year, goal.id, { title: e.target.value }))}
          />
          <input
            className="mt-0.5 w-full bg-transparent text-sm italic outline-none"
            style={{ color: 'var(--text-soft)' }}
            placeholder="why does this matter?"
            value={goal.why ?? ''}
            onChange={(e) => mutate((v) => updateGoal(v, goal.year, goal.id, { why: e.target.value }))}
          />
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            className="btn !px-2 !py-1.5"
            title={done ? 'Reopen' : 'Mark done'}
            onClick={() => mutate((v) => updateGoal(v, goal.year, goal.id, { status: done ? 'active' : 'done' }))}
            style={done ? { background: '#34d399', color: 'white', borderColor: '#34d399' } : undefined}
          >
            {done ? <RotateCcw size={15} /> : <Check size={15} />}
          </button>
          <button
            className="btn !px-2 !py-1.5"
            title="Delete goal"
            onClick={() => { if (confirm(`Delete "${goal.title}"?`)) mutate((v) => removeGoal(v, goal.year, goal.id)); }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => mutate((v) => updateGoal(v, goal.year, goal.id, { color: c }))}
            className="h-4 w-4 rounded-full transition"
            style={{ background: c, outline: goal.color === c ? '2px solid var(--text)' : 'none', outlineOffset: 1 }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Break it down by month</div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => {
          const key = monthKey(goal.year, i + 1);
          return (
            <div key={key} className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>
              <button
                className="serif text-xs font-semibold hover:underline"
                style={{ color: 'var(--text-soft)' }}
                onClick={() => navigate(`/month/${key}`)}
              >
                {MONTH_ABBR[i]}
              </button>
              <input
                className="w-full bg-transparent text-xs outline-none"
                placeholder="—"
                value={goal.monthlyTargets?.[key] ?? ''}
                onChange={(e) => mutate((v) => setMonthlyTarget(v, goal.year, goal.id, key, e.target.value))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalsView() {
  const { year: yearParam } = useParams();
  const currentYear = useVault((s) => s.currentYear);
  const year = Number(yearParam) || currentYear;
  const navigate = useNavigate();
  const goals = useVault((s) => s.vault!.years[year]?.goals) ?? NO_GOALS;
  const mutate = useVault((s) => s.mutate);
  const [title, setTitle] = useState('');

  const add = () => {
    const t = title.trim();
    if (!t) return;
    mutate((v) => addGoal(v, year, { title: t, color: COLORS[goals.length % COLORS.length] }));
    setTitle('');
  };

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button className="btn !px-2" onClick={() => navigate(`/goals/${year - 1}`)} aria-label="Previous year"><ChevronLeft size={18} /></button>
            Goals · {year}
            <button className="btn !px-2" onClick={() => navigate(`/goals/${year + 1}`)} aria-label="Next year"><ChevronRight size={18} /></button>
          </span>
        }
        subtitle="Set the year, then plan each goal month by month so it actually happens."
      />

      <div className="mb-5 flex gap-2">
        <input
          className="input"
          placeholder="A goal for the year — e.g. “Run a half marathon”"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn-primary shrink-0" onClick={add}><Plus size={16} /> Add goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: 'var(--text-faint)' }}>
          <p className="serif text-xl">No goals yet for {year}.</p>
          <p className="mt-1 text-sm">Add a few above — the magic is breaking them into months.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  );
}
