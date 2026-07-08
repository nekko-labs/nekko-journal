import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Check, X, Lock } from 'lucide-react';
import {
  type Goal,
  MONTH_NAMES,
  monthKey,
  parseMonthKey,
  photoLimit,
  updateMonth,
  updateGoal,
  ensureMonth,
  addGoalPhoto,
  removeGoalPhoto,
  countMonthPhotos,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { Markdown, MarkdownEditor } from '../components/markdown';

function photoId() {
  return `p-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export default function MonthView() {
  const navigate = useNavigate();
  const { key = '' } = useParams();
  const vault = useVault((s) => s.vault)!;
  const mutate = useVault((s) => s.mutate);

  const { year, month } = parseMonthKey(key);
  const [editing, setEditing] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  // Reset transient UI when navigating between months.
  useEffect(() => { setEditing(false); setLimitHit(false); }, [key]);

  const monthObj = vault.months[key];
  const reflection = monthObj?.reflection ?? '';
  const plan = vault.settings.plan ?? 'free';
  const limit = photoLimit(plan);

  const goals: Goal[] = (vault.years[year]?.goals ?? []).filter((g) => g.plannedMonth === month);

  const gotoMonth = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    navigate(`/month/${monthKey(y, m)}`);
  };

  const setReflection = (md: string) => mutate((v) => updateMonth(v, key, { reflection: md }));
  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));

  const addPhoto = (goalId: string) => {
    // Gate on the per-month plan limit before opening the picker.
    if (countMonthPhotos(monthObj) >= limit) { setLimitHit(true); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        mutate((v) => {
          ensureMonth(v, key);
          addGoalPhoto(v, key, goalId, { id: photoId(), src, caption: file.name }, limit);
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const delPhoto = (goalId: string, id: string) => mutate((v) => removeGoalPhoto(v, key, goalId, id));

  const photoCount = countMonthPhotos(monthObj);

  return (
    <div className="animate-rise pb-4">
      {/* header */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate(`/year/${year}`)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <ArrowLeft size={15} /> {year}
        </button>
        <div className="flex gap-2.5">
          <button onClick={() => gotoMonth(-1)} className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text)' }} aria-label="Previous month">
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
          <button onClick={() => gotoMonth(1)} className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text)' }} aria-label="Next month">
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <h1 className="serif text-4xl font-semibold tracking-tight" style={{ letterSpacing: '-0.8px' }}>{MONTH_NAMES[month - 1]} {year}</h1>

      {/* journal */}
      <section className="mt-6">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Journal</span>
          <button onClick={() => setEditing((e) => !e)} className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <MarkdownEditor value={reflection} onChange={setReflection} autoFocus />
        ) : reflection.trim() ? (
          <div className="animate-rise"><Markdown source={reflection} /></div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>Nothing yet. Tap Edit to write this month's entry.</p>
        )}
      </section>

      {/* goals this month */}
      <section className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Goals this month</span>
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{photoCount}/{limit} photos</span>
        </div>

        {goals.length === 0 ? (
          <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            No goals here yet. Drag some in from the{' '}
            <button onClick={() => navigate(`/year/${year}`)} className="underline" style={{ color: 'var(--accent)' }}>year board</button>.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {goals.map((g) => {
              const photos = monthObj?.goalCheckins[g.id]?.photos ?? [];
              const done = g.status === 'done';
              return (
                <div key={g.id}>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
                    <span className="serif flex-1 text-[19px] font-semibold" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{g.title}</span>
                    <button
                      onClick={() => toggleDone(g)}
                      className="grid h-[30px] w-[30px] place-items-center rounded-full transition active:scale-95"
                      style={{
                        border: done ? '1px solid var(--success)' : '1px solid var(--border)',
                        background: done ? 'var(--success)' : 'transparent',
                        color: done ? '#fff' : 'var(--text-faint)',
                      }}
                      aria-label={done ? 'Mark not done' : 'Mark done'}
                    >
                      <Check size={14} strokeWidth={2.6} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pl-6">
                    {photos.map((p) => (
                      <div key={p.id} className="group relative h-14 w-14 overflow-hidden rounded-xl" style={{ background: `var(--surface-2)` }}>
                        <img src={p.src} alt={p.caption ?? ''} className="h-full w-full object-cover" />
                        <button
                          onClick={() => delPhoto(g.id, p.id)}
                          className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full opacity-0 transition group-hover:opacity-100"
                          style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}
                          aria-label="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addPhoto(g.id)}
                      className="grid h-14 w-14 place-items-center rounded-xl transition active:scale-95"
                      style={{ border: '1.5px dashed var(--border)', color: 'var(--text-faint)' }}
                      aria-label="Add photo"
                    >
                      <Plus size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {limitHit && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--accent-soft)' }}>
            <Lock size={16} style={{ color: 'var(--accent)' }} />
            <p className="flex-1 text-[13px]" style={{ color: 'var(--text)' }}>
              You've reached {limit} photos this month.{plan === 'free' ? ' Premium keeps up to 25 a month.' : ''}
            </p>
            {plan === 'free' && (
              <button onClick={() => navigate('/pricing')} className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>Upgrade</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
