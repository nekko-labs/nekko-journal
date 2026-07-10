import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Star, History, Sparkles, Loader2 } from 'lucide-react';
import {
  monthLabel,
  monthKey,
  monthsNewestFirst,
  buildYearInReview,
  thisMonthLastYear,
  draftYearInReview,
  mockProvider,
  type Month,
} from '@getsu/core';
import { useVault } from '../state/store';
import { PageHeader, Section } from '../components/ui';
import { Markdown } from '../components/markdown';
import { getAIProvider } from '../lib/ai';
import { riseItem } from '../lib/motion';

const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'var(--surface-2)' }}>
      <div className="serif text-2xl font-semibold">{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</div>
    </div>
  );
}

function TimelineRow({ m }: { m: Month }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/month/${m.id}`)}
      className="card flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="w-24 shrink-0">
        <div className="serif text-base font-semibold">{monthLabel(m.id)}</div>
        {m.mood ? <div className="text-lg">{MOODS[m.mood]}</div> : null}
      </div>
      {m.photos[0] && (
        <img src={m.photos[0].src} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm" style={{ color: 'var(--text-soft)' }}>
          {m.highlights[0] ?? m.reflection.slice(0, 120) ?? '—'}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
          {m.highlights.length > 0 && <span className="flex items-center gap-1"><Star size={11} /> {m.highlights.length}</span>}
          {m.photos.length > 0 && <span className="flex items-center gap-1"><Camera size={11} /> {m.photos.length}</span>}
        </div>
      </div>
    </button>
  );
}

export default function LookbackView() {
  const navigate = useNavigate();
  const year = useVault((s) => s.currentYear);
  const vault = useVault((s) => s.vault!);
  const review = buildYearInReview(vault, year);
  const all = monthsNewestFirst(vault);

  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const writeReview = async () => {
    setDrafting(true);
    try {
      setDraft(await draftYearInReview(getAIProvider(), review));
    } catch {
      setDraft(await draftYearInReview(mockProvider, review));
    } finally {
      setDrafting(false);
    }
  };

  // demo "current" month is June; show last-year's same month as a callback
  const thisMonthKey = monthKey(year, 6);
  const lastYear = thisMonthLastYear(vault, thisMonthKey);
  const trackerName = (id: string) => vault.trackers.find((t) => t.id === id)?.name ?? id;
  const trackerUnit = (id: string) => vault.trackers.find((t) => t.id === id)?.unit ?? '';

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <PageHeader title="Look back" subtitle="The whole point — see what you actually did, at a month scale." />

      <div className="space-y-5">
        <Section title={`${year} in review`} hint={review.theme}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat label="months journaled" value={review.monthsJournaled} />
            <Stat label="highlights" value={review.highlights.length} />
            <Stat label="photos" value={review.photoCount} />
            <Stat label="avg mood" value={review.averageMood ? MOODS[Math.round(review.averageMood)] : '—'} />
          </div>
          {review.trackerTotals.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {review.trackerTotals.map((t) => (
                <span key={t.trackerId} className="rounded-full px-3 py-1 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {t.total} {trackerUnit(t.trackerId) || trackerName(t.trackerId).toLowerCase()}
                </span>
              ))}
            </div>
          )}
          {review.goalsAchieved.length > 0 && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-soft)' }}>
              🏆 Achieved: {review.goalsAchieved.map((g) => g.title).join(', ')}
            </p>
          )}

          <button
            onClick={writeReview}
            disabled={drafting}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {drafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Draft year-in-review
          </button>
          {draft && (
            <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
              <Markdown source={draft} />
            </div>
          )}
        </Section>

        {lastYear && (
          <Section title="This month, last year" hint={monthLabel(lastYear.id)}>
            <button onClick={() => navigate(`/month/${lastYear.id}`)} className="text-left">
              <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                {lastYear.highlights[0] ?? lastYear.reflection.slice(0, 140) ?? '—'}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                <History size={12} /> revisit {monthLabel(lastYear.id)}
              </span>
            </button>
          </Section>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>Timeline</h2>
          {all.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>Nothing yet — your months will appear here.</p>
          ) : (
            <div className="space-y-3">
              {all.map((m, i) => (
                <motion.div key={m.id} variants={riseItem} initial="hidden" animate="show" custom={i}>
                  <TimelineRow m={m} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
