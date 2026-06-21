import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, ImagePlus, X, Target } from 'lucide-react';
import {
  monthLabel,
  monthKey,
  parseMonthKey,
  updateMonth,
  setTrackerValue,
  setGoalCheckin,
  type Month,
  type PhotoRef,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { Section, EditableList } from '../components/ui';

const MOODS = [
  { v: 1, e: '😞' },
  { v: 2, e: '😕' },
  { v: 3, e: '😐' },
  { v: 4, e: '🙂' },
  { v: 5, e: '😄' },
];

function readImage(file: File): Promise<PhotoRef> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () =>
        resolve({ id: `${Date.now()}-${Math.round(performance.now())}`, src, width: img.width, height: img.height });
      img.onerror = () => resolve({ id: `${Date.now()}`, src });
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function MoodPicker({ mood, onPick }: { mood?: number; onPick: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {MOODS.map((m) => (
        <button
          key={m.v}
          onClick={() => onPick(mood === m.v ? 0 : m.v)}
          className="rounded-xl px-2.5 py-1.5 text-xl transition"
          style={{
            background: mood === m.v ? 'var(--accent-soft)' : 'var(--surface-2)',
            outline: mood === m.v ? '2px solid var(--accent)' : 'none',
          }}
          title={`Mood ${m.v}`}
        >
          {m.e}
        </button>
      ))}
    </div>
  );
}

function Trackers({ month }: { month: Month }) {
  const allTrackers = useVault((s) => s.vault!.trackers);
  const trackers = allTrackers.filter((t) => t.active);
  const mutate = useVault((s) => s.mutate);
  if (trackers.length === 0) return <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>No trackers yet.</p>;
  return (
    <div className="space-y-3">
      {trackers.map((t) => {
        const val = month.trackers[t.id];
        return (
          <div key={t.id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color ?? 'var(--accent)' }} />
              {t.name}
              {t.target != null && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>/ {t.target}{t.unit ? ` ${t.unit}` : ''}</span>}
            </span>
            {t.kind === 'boolean' ? (
              <button
                className="btn !py-1.5"
                onClick={() => mutate((v) => setTrackerValue(v, month.id, t.id, !(val === true)))}
                style={val === true ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : undefined}
              >
                {val === true ? 'Yes' : 'No'}
              </button>
            ) : t.kind === 'rating' ? (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => mutate((v) => setTrackerValue(v, month.id, t.id, n))}
                    className="text-lg" style={{ opacity: (typeof val === 'number' && val >= n) ? 1 : 0.3 }}>★</button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button className="btn !px-2.5 !py-1" onClick={() => mutate((v) => setTrackerValue(v, month.id, t.id, Math.max(0, (typeof val === 'number' ? val : 0) - 1)))}>−</button>
                <span className="w-9 text-center text-sm font-semibold tabular-nums">{typeof val === 'number' ? val : 0}</span>
                <button className="btn !px-2.5 !py-1" onClick={() => mutate((v) => setTrackerValue(v, month.id, t.id, (typeof val === 'number' ? val : 0) + 1))}>+</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoalCheckins({ month }: { month: Month }) {
  const yearGoals = useVault((s) => s.vault!.years[month.year]?.goals);
  const goals = (yearGoals ?? []).filter((g) => g.status !== 'dropped');
  const mutate = useVault((s) => s.mutate);
  if (goals.length === 0) return <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>No goals for {month.year} yet.</p>;
  return (
    <div className="space-y-4">
      {goals.map((g) => {
        const checkin = month.goalCheckins[g.id] ?? {};
        const target = g.monthlyTargets?.[month.id];
        return (
          <div key={g.id}>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
              {g.title}
            </div>
            {target && <div className="mb-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>This month's plan: {target}</div>}
            <textarea
              className="input min-h-[2.5rem] resize-y text-sm"
              placeholder={`How did this go in ${monthLabel(month.id).split(' ')[0]}?`}
              value={checkin.note ?? ''}
              onChange={(e) => mutate((v) => setGoalCheckin(v, month.id, g.id, { note: e.target.value }))}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function MonthView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const { year, month } = parseMonthKey(key);
  // Subscribe to the whole vault: core ops mutate month objects in place, so the vault's
  // top-level ref (replaced on every mutate) is what reliably re-renders this surface.
  const vault = useVault((s) => s.vault!);
  const m = vault.months[key] as Month | undefined;
  const mutate = useVault((s) => s.mutate);
  const fileRef = useRef<HTMLInputElement>(null);

  // A view-model month so the surface renders even before the month exists on disk.
  const view: Month = m ?? {
    id: key, year, month, reflection: '', highlights: [], struggles: [], gratitude: [],
    photos: [], trackers: {}, goalCheckins: {}, createdAt: '', updatedAt: '',
  };

  const prev = month === 1 ? monthKey(year - 1, 12) : monthKey(year, month - 1);
  const next = month === 12 ? monthKey(year + 1, 1) : monthKey(year, month + 1);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const refs = await Promise.all(Array.from(files).filter((f) => f.type.startsWith('image/')).map(readImage));
    if (refs.length) mutate((v) => updateMonth(v, key, { photos: [...view.photos, ...refs] }));
  };

  return (
    <div
      className="mx-auto max-w-3xl p-6 md:p-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); void addPhotos(e.dataTransfer.files); }}
    >
      <div className="mb-5 flex items-center justify-between">
        <button className="btn" onClick={() => navigate(`/year/${year}`)}><ArrowLeft size={16} /> {year}</button>
        <div className="flex gap-2">
          <button className="btn !px-2.5" onClick={() => navigate(`/month/${prev}`)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button className="btn !px-2.5" onClick={() => navigate(`/month/${next}`)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="serif text-4xl font-semibold">{monthLabel(key)}</h1>
        <MoodPicker mood={view.mood} onPick={(v) => mutate((vault) => updateMonth(vault, key, { mood: v || undefined }))} />
      </div>

      <div className="space-y-5">
        <Section title="Reflection" hint="the month at a glance">
          <textarea
            className="input min-h-[8rem] resize-y leading-relaxed"
            placeholder="What happened this month? What did it feel like? What changed?"
            value={view.reflection}
            onChange={(e) => mutate((v) => updateMonth(v, key, { reflection: e.target.value }))}
          />
        </Section>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="Highlights">
            <EditableList
              items={view.highlights}
              onChange={(next) => mutate((v) => updateMonth(v, key, { highlights: next }))}
              placeholder="a good thing this month…"
              accent="#34d399"
              emptyText="What went well?"
            />
          </Section>
          <Section title="Struggles" hint="optional" muted>
            <EditableList
              items={view.struggles}
              onChange={(next) => mutate((v) => updateMonth(v, key, { struggles: next }))}
              placeholder="something hard (only if you want)…"
              accent="#f59e0b"
              emptyText="Nothing to note — that's fine."
            />
          </Section>
        </div>

        <Section title="Photos" hint="drag & drop, or add">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {view.photos.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <img src={p.src} alt={p.caption ?? ''} className="h-full w-full object-cover" />
                <button
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => mutate((v) => updateMonth(v, key, { photos: view.photos.filter((x) => x.id !== p.id) }))}
                  aria-label="Remove photo"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs transition hover:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}
            >
              <ImagePlus size={20} /> Add
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />
        </Section>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="Trackers">
            <Trackers month={view} />
          </Section>
          <Section title="Goal check-in">
            <div className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>
              <Target size={13} /> How your year's goals went this month
            </div>
            <GoalCheckins month={view} />
          </Section>
        </div>
      </div>
    </div>
  );
}
