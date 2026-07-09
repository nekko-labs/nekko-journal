import { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { type Month, type Goal, reflectionPrompts, summarizeMonth, mockProvider } from '@nekko/journal-core';
import { getAIProvider, aiConfigured } from '../lib/ai';

/**
 * The journaling assistant on the Month surface. Works offline (heuristic mock
 * prompts/summary) and, when a Claude key is set, calls the model. Prompts are
 * insertable into the entry; the summary is read-only.
 */
export default function AIAssist({ month, goals, onInsert }: { month: Month; goals: Goal[]; onInsert: (text: string) => void }) {
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState<'prompts' | 'summary' | null>(null);

  const configured = aiConfigured();

  const run = async (which: 'prompts' | 'summary') => {
    setBusy(which);
    try {
      const provider = getAIProvider();
      if (which === 'prompts') setPrompts(await reflectionPrompts(provider, month, goals));
      else setSummary(await summarizeMonth(provider, month));
    } catch {
      // On any provider error, degrade to the offline mock silently.
      if (which === 'prompts') setPrompts(await reflectionPrompts(mockProvider, month, goals));
      else setSummary(await summarizeMonth(mockProvider, month));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6 rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} style={{ color: 'var(--accent)' }} />
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Journaling assist</span>
        <span className="ml-auto text-[10.5px]" style={{ color: 'var(--text-faint)' }}>{configured ? 'Claude' : 'Offline'}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run('prompts')}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95 disabled:opacity-60"
          style={{ background: 'var(--surface)', color: 'var(--accent)' }}
        >
          {busy === 'prompts' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest prompts
        </button>
        <button
          onClick={() => run('summary')}
          disabled={busy !== null || !month.reflection.trim()}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--surface)', color: 'var(--text-soft)' }}
          title={month.reflection.trim() ? 'Summarize this month' : 'Write something first'}
        >
          {busy === 'summary' ? <Loader2 size={13} className="animate-spin" /> : null} Summarize month
        </button>
      </div>

      {prompts && (
        <div className="mt-3 flex flex-col gap-1.5">
          {prompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onInsert(p)}
              className="group flex items-start gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] leading-snug transition hover:bg-[var(--surface)]"
              style={{ color: 'var(--text)' }}
            >
              <Plus size={14} className="mt-0.5 shrink-0 opacity-40 transition group-hover:opacity-100" style={{ color: 'var(--accent)' }} />
              {p}
            </button>
          ))}
        </div>
      )}

      {summary && (
        <p className="mt-3 rounded-xl px-3 py-2.5 text-[13.5px] leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          {summary}
        </p>
      )}
    </div>
  );
}
