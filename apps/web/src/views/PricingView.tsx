import { Link } from 'react-router-dom';
import { Check, Cloud, HardDrive, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui';

const FREE = [
  'Unlimited months, years, goals & trackers',
  'Every surface: Year, All Years, Month, Goals, Insights, Look back',
  'Photos stored on your device',
  'Mood, highlights, struggles & reflections',
  'Full analytics & year-in-review',
  'Local backup & export (JSON)',
  'Light / dark, fully offline',
  'No account required',
];

const CLOUD = [
  'Everything in Free, plus:',
  'Sync across all your devices',
  'Automatic encrypted cloud backup',
  'Cloud photo storage',
  'Web access from any browser',
  '“On this day” across devices',
  'Early access to new cloud features',
];

function PlanCard({
  name, price, blurb, items, highlight, cta,
}: {
  name: string; price: string; blurb: string; items: string[]; highlight?: boolean; cta: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col p-6" style={highlight ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent), var(--shadow-lift)' } : undefined}>
      <div className="flex items-center gap-2">
        {highlight ? <Cloud size={18} style={{ color: 'var(--accent)' }} /> : <HardDrive size={18} style={{ color: 'var(--text-soft)' }} />}
        <h2 className="serif text-xl font-semibold">{name}</h2>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="serif text-3xl font-semibold">{price}</span>
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{blurb}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: i === 0 && highlight ? 'var(--text-soft)' : 'var(--text)' }}>
            <Check size={15} className="mt-0.5 shrink-0" style={{ color: highlight ? 'var(--accent)' : 'var(--mood-4)' }} />
            {it}
          </li>
        ))}
      </ul>
      <div className="mt-5">{cta}</div>
    </div>
  );
}

export default function PricingView() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <PageHeader
        title="Simple, fair pricing"
        subtitle="The whole journal is free, forever. You only pay if you want it everywhere."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          blurb="A complete, private, local-first journal."
          items={FREE}
          cta={<Link to="/year/2026" className="btn w-full justify-center">Start journaling</Link>}
        />
        <PlanCard
          name="Cloud"
          price="$2/mo"
          blurb="Your journal, everywhere — safe and synced."
          items={CLOUD}
          highlight
          cta={<Link to="/account" className="btn btn-primary w-full justify-center"><Sparkles size={15} /> Get Cloud</Link>}
        />
      </div>
      <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
        Free is never crippled — sync is a convenience, not a hostage. Self-host the whole thing if you like; it's open source.
      </p>
    </div>
  );
}
