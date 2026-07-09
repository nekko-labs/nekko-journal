import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { getStoredKey, setStoredKey, getStoredModel, setStoredModel } from '../lib/ai';

const MODELS = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (faster, cheaper)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)' },
];

export default function AIView() {
  const navigate = useNavigate();
  const [key, setKey] = useState(getStoredKey());
  const [model, setModel] = useState(getStoredModel());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setStoredKey(key);
    setStoredModel(model);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const configured = getStoredKey().length > 0;

  return (
    <div className="animate-rise">
      <button onClick={() => navigate('/you')} className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
        <ArrowLeft size={15} /> You
      </button>

      <div className="mb-1.5 flex items-center gap-2">
        <Sparkles size={22} style={{ color: 'var(--accent)' }} />
        <h1 className="serif text-3xl font-semibold tracking-tight">Journaling assist</h1>
      </div>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        Nekko can suggest reflection prompts, summarize a month, and draft a year-in-review. It works offline with simple built-in prompts. Add your own Claude API key to make it smarter — the key stays on this device and is never synced or exported.
      </p>

      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Claude API key</div>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-ant-…"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border-0 px-3.5 py-2.5 font-mono text-[13px] outline-none"
        style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
      />
      <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>
        Get a key at console.anthropic.com. Calls go straight from your browser to Anthropic; usage is billed to your key.
      </p>

      <div className="mb-3.5 mt-6 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Model</div>
      <div className="flex flex-col gap-2">
        {MODELS.map((m) => {
          const on = model === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className="flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-[14px] transition"
              style={{ background: on ? 'var(--accent-soft)' : 'var(--surface-2)', color: on ? 'var(--accent)' : 'var(--text)', outline: on ? '1px solid var(--accent)' : 'none' }}
            >
              {m.label}
              {on && <Check size={16} />}
            </button>
          );
        })}
      </div>

      <button
        onClick={save}
        className="mt-6 w-full rounded-full py-3 text-[15px] font-semibold transition active:scale-[.98]"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {saved ? 'Saved' : 'Save'}
      </button>
      <p className="mt-3 text-center text-[12px]" style={{ color: 'var(--text-faint)' }}>
        {configured ? 'Claude is connected.' : 'Running in offline mode — no key set.'}
      </p>
    </div>
  );
}
