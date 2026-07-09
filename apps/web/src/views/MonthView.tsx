import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Check, Lock } from 'lucide-react';
import {
  type Goal,
  MONTH_NAMES,
  monthKey,
  parseMonthKey,
  photoLimit,
  createMonth,
  updateMonth,
  updateGoal,
  ensureMonth,
  addGoalPhoto,
  removeGoalPhoto,
  setGoalPhotoCaption,
  setTrackerValue,
  activeTrackers,
  countMonthPhotos,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { Markdown, MarkdownEditor } from '../components/markdown';
import Lightbox from '../components/Lightbox';
import AIAssist from '../components/AIAssist';
import { processImageFile } from '../lib/image';

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
  // Which goal's photo set is open in the lightbox, and at what index.
  const [viewer, setViewer] = useState<{ goalId: string; index: number } | null>(null);

  // Reset transient UI when navigating between months.
  useEffect(() => { setEditing(false); setLimitHit(false); setViewer(null); }, [key]);

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
  const insertPrompt = (text: string) => {
    const base = reflection.trim();
    setReflection(base ? `${base}\n\n${text}\n` : `${text}\n`);
    setEditing(true);
  };
  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));

  const addPhoto = (goalId: string) => {
    // Gate on the per-month plan limit before opening the picker.
    if (countMonthPhotos(monthObj) >= limit) { setLimitHit(true); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      for (const file of files) {
        // Re-check the limit per file so a multi-select can't overshoot.
        if (countMonthPhotos(useVault.getState().vault?.months[key]) >= limit) { setLimitHit(true); break; }
        const { src, width, height } = await processImageFile(file);
        mutate((v) => {
          ensureMonth(v, key);
          addGoalPhoto(v, key, goalId, { id: photoId(), src, width, height }, limit);
        });
      }
    };
    input.click();
  };

  const delPhoto = (goalId: string, id: string) => mutate((v) => removeGoalPhoto(v, key, goalId, id));
  const setCaption = (goalId: string, id: string, caption: string) => mutate((v) => setGoalPhotoCaption(v, key, goalId, id, caption));

  const trackers = activeTrackers(vault);
  const setTracker = (id: string, value: number | boolean) => mutate((v) => { ensureMonth(v, key); setTrackerValue(v, key, id, value); });

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

        <AIAssist month={monthObj ?? createMonth(key)} goals={goals} onInsert={insertPrompt} />
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
                    {photos.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => setViewer({ goalId: g.id, index: i })}
                        className="group relative h-16 w-16 overflow-hidden rounded-xl transition active:scale-95"
                        style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-soft)' }}
                        aria-label={p.caption ? `View photo: ${p.caption}` : 'View photo'}
                      >
                        <img src={p.src} alt={p.caption ?? ''} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                        {p.caption && (
                          <span
                            className="absolute inset-x-0 bottom-0 truncate px-1.5 py-1 text-left text-[9px] font-medium leading-none"
                            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.6))', color: '#fff' }}
                          >
                            {p.caption}
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => addPhoto(g.id)}
                      className="grid h-16 w-16 place-items-center rounded-xl transition active:scale-95"
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

      {/* trackers — quiet monthly entry, only when any are defined */}
      {trackers.length > 0 && (
        <section className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-4 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>This month</div>
          <div className="flex flex-col gap-4">
            {trackers.map((t) => {
              const raw = monthObj?.trackers[t.id];
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color ?? 'var(--accent)' }} />
                  <span className="flex-1 text-[15px]" style={{ color: 'var(--text)' }}>
                    {t.name}
                    {t.target != null && <span className="ml-1.5 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>/ {t.target}{t.unit ? ` ${t.unit}` : ''}</span>}
                  </span>
                  {t.kind === 'boolean' ? (
                    <button
                      onClick={() => setTracker(t.id, !(raw === true))}
                      className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95"
                      style={{ background: raw === true ? 'var(--success)' : 'var(--surface-2)', color: raw === true ? '#fff' : 'var(--text-soft)' }}
                    >
                      {raw === true ? 'Yes' : 'No'}
                    </button>
                  ) : t.kind === 'rating' ? (
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const on = typeof raw === 'number' && raw >= n;
                        return (
                          <button
                            key={n}
                            onClick={() => setTracker(t.id, raw === n ? 0 : n)}
                            className="h-6 w-6 rounded-full text-[11px] font-semibold transition active:scale-90"
                            style={{ background: on ? (t.color ?? 'var(--accent)') : 'var(--surface-2)', color: on ? '#fff' : 'var(--text-faint)' }}
                            aria-label={`${t.name} ${n}`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setTracker(t.id, Math.max(0, (typeof raw === 'number' ? raw : 0) - 1))} className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none transition active:scale-90" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }} aria-label={`Decrease ${t.name}`}>−</button>
                      <input
                        value={typeof raw === 'number' ? String(raw) : ''}
                        onChange={(e) => setTracker(t.id, Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                        inputMode="decimal"
                        placeholder="0"
                        className="w-12 rounded-lg border-0 py-1.5 text-center text-[14px] font-semibold outline-none"
                        style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                      />
                      <button onClick={() => setTracker(t.id, (typeof raw === 'number' ? raw : 0) + 1)} className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none transition active:scale-90" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }} aria-label={`Increase ${t.name}`}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {viewer && (() => {
        const photos = monthObj?.goalCheckins[viewer.goalId]?.photos ?? [];
        if (photos.length === 0 || viewer.index >= photos.length) { setViewer(null); return null; }
        return (
          <Lightbox
            photos={photos}
            index={viewer.index}
            onIndexChange={(i) => setViewer({ ...viewer, index: i })}
            onClose={() => setViewer(null)}
            onCaption={(id, caption) => setCaption(viewer.goalId, id, caption)}
            onDelete={(id) => {
              delPhoto(viewer.goalId, id);
              const remaining = photos.length - 1;
              if (remaining <= 0) setViewer(null);
              else setViewer({ ...viewer, index: Math.min(viewer.index, remaining - 1) });
            }}
          />
        );
      })()}
    </div>
  );
}
