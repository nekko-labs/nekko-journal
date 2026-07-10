import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import {
  type Tracker,
  type TrackerKind,
  GOAL_PALETTE,
  addTracker,
  updateTracker,
  removeTracker,
  archiveTracker,
} from '@getsu/core';
import { useVault } from '../state/store';

const KINDS: { kind: TrackerKind; label: string; hint: string }[] = [
  { kind: 'count', label: 'Count', hint: 'times something happened (runs, books)' },
  { kind: 'number', label: 'Number', hint: 'a measured value (weight, hours)' },
  { kind: 'rating', label: 'Rating', hint: '1–5 each month' },
  { kind: 'boolean', label: 'Yes / no', hint: 'did it happen at all' },
];

interface Draft {
  name: string;
  kind: TrackerKind;
  unit: string;
  target: string;
  color: string;
}

const blankDraft = (i: number): Draft => ({ name: '', kind: 'count', unit: '', target: '', color: GOAL_PALETTE[i % GOAL_PALETTE.length] });

export default function TrackersView() {
  const navigate = useNavigate();
  const vault = useVault((s) => s.vault)!;
  const mutate = useVault((s) => s.mutate);

  const trackers = vault.trackers;
  const active = trackers.filter((t) => t.active);
  const archived = trackers.filter((t) => !t.active);

  const [editing, setEditing] = useState<string | null>(null); // tracker id, or 'new'
  const [draft, setDraft] = useState<Draft>(blankDraft(0));

  const startNew = () => { setDraft(blankDraft(trackers.length)); setEditing('new'); };
  const startEdit = (t: Tracker) => {
    setDraft({ name: t.name, kind: t.kind, unit: t.unit ?? '', target: t.target != null ? String(t.target) : '', color: t.color ?? GOAL_PALETTE[0] });
    setEditing(t.id);
  };
  const cancel = () => setEditing(null);

  const save = () => {
    const name = draft.name.trim();
    if (!name) return;
    const showsUnit = draft.kind === 'count' || draft.kind === 'number';
    const patch: Partial<Tracker> = {
      name,
      kind: draft.kind,
      unit: showsUnit ? (draft.unit.trim() || undefined) : undefined,
      target: draft.target.trim() ? Number(draft.target) : undefined,
      color: draft.color,
    };
    mutate((v) => {
      if (editing === 'new') addTracker(v, { ...patch, name, active: true });
      else if (editing) updateTracker(v, editing, patch);
    });
    setEditing(null);
  };

  const meta = (t: Tracker) => {
    const bits = [KINDS.find((k) => k.kind === t.kind)?.label ?? t.kind];
    if (t.unit) bits.push(t.unit);
    if (t.target != null) bits.push(`target ${t.target}`);
    return bits.join(' · ');
  };

  // Rendered as plain functions (not nested components) so editing the draft
  // doesn't remount the inputs and drop focus mid-keystroke.
  const renderForm = () => {
    const showsUnit = draft.kind === 'count' || draft.kind === 'number';
    return (
      <div className="mt-3 rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Tracker name (e.g. Runs)"
          className="mb-3 w-full rounded-xl border-0 px-3.5 py-2.5 text-[15px] outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        />
        <div className="mb-3 grid grid-cols-2 gap-2">
          {KINDS.map((k) => {
            const on = draft.kind === k.kind;
            return (
              <button
                key={k.kind}
                onClick={() => setDraft({ ...draft, kind: k.kind })}
                className="rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition"
                style={{ background: on ? 'var(--accent-soft)' : 'var(--surface)', color: on ? 'var(--accent)' : 'var(--text-soft)', outline: on ? '1px solid var(--accent)' : 'none' }}
              >
                {k.label}
              </button>
            );
          })}
        </div>
        <div className="mb-3 flex gap-2">
          {showsUnit && (
            <input
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              placeholder="unit (books)"
              className="min-w-0 flex-1 rounded-xl border-0 px-3.5 py-2.5 text-[14px] outline-none"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}
            />
          )}
          <input
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value.replace(/[^0-9.]/g, '') })}
            inputMode="decimal"
            placeholder="target (optional)"
            className="min-w-0 flex-1 rounded-xl border-0 px-3.5 py-2.5 text-[14px] outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {GOAL_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setDraft({ ...draft, color: c })}
              className="h-7 w-7 rounded-full transition active:scale-90"
              style={{ background: c, outline: draft.color === c ? '2px solid var(--text)' : 'none', outlineOffset: 2 }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded-full py-2.5 text-[14px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>Save</button>
          <button onClick={cancel} className="rounded-full px-4 py-2.5 text-[14px] font-semibold" style={{ color: 'var(--text-soft)' }}>Cancel</button>
        </div>
      </div>
    );
  };

  const renderRow = (t: Tracker, first: boolean) => (
    <div key={t.id} style={{ borderTop: first ? 'none' : '1px solid var(--border)' }}>
      <div className="group flex items-center gap-3 py-3.5">
        <span className="h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: t.color ?? 'var(--accent)', opacity: t.active ? 1 : 0.4 }} />
        <button onClick={() => startEdit(t)} className="flex-1 text-left" disabled={!t.active}>
          <div className="text-[15px]" style={{ color: 'var(--text)', opacity: t.active ? 1 : 0.5 }}>{t.name}</div>
          <div className="text-[11.5px]" style={{ color: 'var(--text-faint)' }}>{meta(t)}</div>
        </button>
        {t.active ? (
          <button onClick={() => mutate((v) => archiveTracker(v, t.id))} className="opacity-0 transition group-hover:opacity-100" style={{ color: 'var(--text-faint)' }} aria-label="Archive tracker">
            <Archive size={16} />
          </button>
        ) : (
          <button onClick={() => mutate((v) => updateTracker(v, t.id, { active: true }))} style={{ color: 'var(--accent)' }} aria-label="Restore tracker">
            <ArchiveRestore size={16} />
          </button>
        )}
        <button
          onClick={() => { if (confirm(`Delete "${t.name}" and all its recorded values? This cannot be undone.`)) mutate((v) => removeTracker(v, t.id)); }}
          className="opacity-0 transition group-hover:opacity-100"
          style={{ color: 'var(--text-faint)' }}
          aria-label="Delete tracker"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {editing === t.id && <div className="pb-3">{renderForm()}</div>}
    </div>
  );

  return (
    // Page entrance comes from the route transition in App.tsx.
    <div>
      <button onClick={() => navigate('/you')} className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
        <ArrowLeft size={15} /> You
      </button>

      <h1 className="serif mb-1.5 text-3xl font-semibold tracking-tight">Trackers</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        Monthly totals and trends, never streaks. Chart them across the year in Insights.
      </p>

      {active.length === 0 && editing !== 'new' && (
        <p className="mb-4 text-sm italic" style={{ color: 'var(--text-faint)' }}>No trackers yet. Add one below.</p>
      )}
      <div className="flex flex-col">
        {active.map((t, i) => renderRow(t, i === 0))}
      </div>

      {editing === 'new' ? (
        renderForm()
      ) : (
        <button onClick={startNew} className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-95" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Plus size={16} /> Add tracker
        </button>
      )}

      {archived.length > 0 && (
        <>
          <div className="mb-2 mt-8 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Archived</div>
          <div className="flex flex-col">
            {archived.map((t, i) => renderRow(t, i === 0))}
          </div>
        </>
      )}
    </div>
  );
}
