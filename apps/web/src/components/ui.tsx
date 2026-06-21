import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function PageHeader({ title, subtitle, right }: { title: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="serif text-3xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({ title, hint, children, muted }: { title: string; hint?: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section className={`card p-5 ${muted ? 'opacity-90' : ''}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>{title}</h2>
        {hint && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** An add/remove list of short text items (highlights, struggles, gratitude). */
export function EditableList({
  items,
  onChange,
  placeholder,
  accent,
  emptyText,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  accent?: string;
  emptyText?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <div>
      <ul className="mb-2 space-y-1.5">
        {items.length === 0 && emptyText && (
          <li className="text-sm italic" style={{ color: 'var(--text-faint)' }}>{emptyText}</li>
        )}
        {items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2 rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent ?? 'var(--accent)' }} />
            <span className="flex-1 text-sm leading-snug">{item}</span>
            <button
              className="opacity-0 transition group-hover:opacity-100"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              style={{ color: 'var(--text-faint)' }}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn shrink-0" onClick={add} aria-label="Add">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
