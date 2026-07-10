import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Sprout, Compass, Sparkles, Loader2, Camera, History } from 'lucide-react';
import {
  buildReflectionMaterial,
  reflectOnJourneyMock,
  reflectOnJourney,
  photoMemories,
  type JourneyReflection,
} from '@getsu/core';
import { useVault } from '../state/store';
import { aiConfigured, getAIProvider } from '../lib/ai';
import { riseItem } from '../lib/motion';

/** The three reflection groups, each with its own quiet accent + icon. */
const GROUPS: { key: keyof JourneyReflection; label: string; icon: typeof Star; color: string }[] = [
  { key: 'highlights', label: 'Highlights', icon: Star, color: 'var(--accent)' },
  { key: 'growth', label: 'Areas of growth', icon: Sprout, color: '#7aa889' },
  { key: 'workOn', label: 'To work on', icon: Compass, color: '#cc7f6a' },
];

export default function ReflectView() {
  const navigate = useNavigate();
  const vault = useVault((s) => s.vault)!;

  const material = useMemo(() => buildReflectionMaterial(vault), [vault]);
  const memories = useMemo(() => photoMemories(vault), [vault]);

  // Always start with the instant, offline heuristic so the surface is alive on
  // arrival. A Claude key lets the user deepen it on demand (a real API call).
  const [reflection, setReflection] = useState<JourneyReflection>(() => reflectOnJourneyMock(material));
  const [loading, setLoading] = useState(false);
  const [deepened, setDeepened] = useState(false);
  const aiOn = aiConfigured();

  const deepen = async () => {
    setLoading(true);
    try {
      setReflection(await reflectOnJourney(getAIProvider(), material));
      setDeepened(true);
    } catch {
      /* keep the offline reflection on any error */
    } finally {
      setLoading(false);
    }
  };

  return (
    // Page entrance comes from the route transition in App.tsx.
    <div>
      <h1 className="serif mb-1.5 mt-1.5 text-3xl font-semibold tracking-tight">Reflect</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        Your memories, and what they add up to.
      </p>

      {/* memories */}
      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Memories</div>
      {memories.length > 0 ? (
        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6" style={{ scrollbarWidth: 'none' }}>
          {memories.map((m, i) => (
            <motion.button
              key={m.photo.id}
              variants={riseItem}
              initial="hidden"
              animate="show"
              custom={i}
              onClick={() => navigate(`/month/${m.key}`)}
              className="group relative h-52 w-40 shrink-0 snap-start overflow-hidden rounded-2xl text-left transition active:scale-[.98]"
              style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-soft)' }}
            >
              <img src={m.photo.src} alt={m.photo.caption ?? ''} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.04]" />
              <div className="absolute inset-x-0 bottom-0 p-2.5" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.62))' }}>
                <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">{m.label}</div>
                {m.photo.caption && <div className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-snug text-white">{m.photo.caption}</div>}
              </div>
            </motion.button>
          ))}
        </div>
      ) : material.recentReflections.length > 0 ? (
        // No photos yet: surface remembered moments from the journal instead.
        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6" style={{ scrollbarWidth: 'none' }}>
          {material.recentReflections.map((r, i) => (
            <motion.div
              key={i}
              variants={riseItem}
              initial="hidden"
              animate="show"
              custom={i}
              className="flex h-52 w-56 shrink-0 snap-start flex-col justify-between rounded-2xl p-4"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--text-faint)' }}>{r.label}</div>
              <p className="serif text-[15px] italic leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                “{r.text}”
              </p>
              <div />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-5" style={{ background: 'var(--surface-2)' }}>
          <Camera size={18} style={{ color: 'var(--text-faint)' }} />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            Photos you add to your months show up here as memories.
          </p>
        </div>
      )}

      {/* reflection */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Reflection</div>
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            {deepened ? 'by Claude' : `${material.monthsJournaled} months`}
          </span>
        </div>
        <p className="mb-6 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
          A gentle read of everything you've written so far.
        </p>

        <div className="flex flex-col gap-8">
          {GROUPS.map((g) => {
            const items = reflection[g.key];
            if (!items.length) return null;
            const Icon = g.icon;
            return (
              <div key={g.key}>
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                  <Icon size={15} style={{ color: g.color }} strokeWidth={1.9} />
                  {g.label}
                </div>
                <ul className="flex flex-col gap-3">
                  {items.map((t, i) => (
                    <motion.li
                      key={i}
                      variants={riseItem}
                      initial="hidden"
                      animate="show"
                      custom={i}
                      className="flex gap-3"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: g.color }} />
                      <span className="text-[14.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>{t}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {aiOn ? (
          <button
            onClick={deepen}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {deepened ? 'Reflect again' : 'Go deeper with Claude'}
          </button>
        ) : (
          <p className="mt-7 text-[12px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            Reflected offline. Add a Claude key under{' '}
            <button onClick={() => navigate('/ai')} className="font-semibold underline" style={{ color: 'var(--accent)' }}>You → Journaling assist</button>{' '}
            for a deeper read.
          </p>
        )}
      </div>

      <button onClick={() => navigate('/lookback')} className="mt-8 inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
        <History size={13} /> Look back through the year →
      </button>
    </div>
  );
}
