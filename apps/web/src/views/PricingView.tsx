import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, HardDrive } from 'lucide-react';
import { PHOTO_LIMIT_FREE, PHOTO_LIMIT_PREMIUM } from '@nekko/journal-core';
import { useVault } from '../state/store';

// Pricing, honestly framed: the free app is complete. Premium is reach & safety.
// Regular price $6/mo; a $3 intro for the first 3 months, and an occasional $3 sale.
const PRICE = 6;
const INTRO_PRICE = 3;
const INTRO_MONTHS = 3;

const FREE = [
  'All four surfaces: Year, Month, Goals, Insights',
  'Unlimited goals, entries & years',
  'Monthly markdown journal',
  'Full insights & year-in-review',
  `Up to ${PHOTO_LIMIT_FREE} photos a month`,
  'Local-first, fully offline, JSON export',
  'No account required',
];

const PREMIUM = [
  'Everything in Free, plus:',
  'Sync across your devices (iCloud, or Google Drive on Android)',
  'Siri & agent integration (add goals and entries by voice)',
  `Up to ${PHOTO_LIMIT_PREMIUM} photos a month`,
  'Encrypted cloud backup & web access',
  'Early access to new features',
];

function PlanCard({
  name, price, sub, items, highlight, cta,
}: {
  name: string; price: React.ReactNode; sub?: string; items: string[]; highlight?: boolean; cta: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col p-6" style={highlight ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent), var(--shadow-lift)' } : undefined}>
      <div className="flex items-center gap-2">
        {highlight ? <Sparkles size={18} style={{ color: 'var(--accent)' }} /> : <HardDrive size={18} style={{ color: 'var(--text-soft)' }} />}
        <h2 className="serif text-xl font-semibold">{name}</h2>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="serif text-3xl font-semibold">{price}</span>
      </div>
      {sub && <p className="mt-1 text-sm" style={{ color: 'var(--accent)' }}>{sub}</p>}
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
  const navigate = useNavigate();
  const plan = useVault((s) => s.vault?.settings.plan ?? 'free');
  const setPlan = useVault((s) => s.setPlan);

  const btn = 'inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]';

  return (
    <div className="animate-rise py-2">
      <h1 className="serif text-3xl font-semibold tracking-tight">Plans</h1>
      <p className="mb-6 mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        The whole journal is free, forever. Premium adds sync, voice, and more photos, never a paywall on writing.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          sub="The complete journal."
          items={FREE}
          cta={
            plan === 'free' ? (
              <span className={btn} style={{ border: '1px solid var(--border)', color: 'var(--text-faint)' }}>Your current plan</span>
            ) : (
              <button className={btn} style={{ border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setPlan('free')}>Switch to Free</button>
            )
          }
        />
        <PlanCard
          name="Premium"
          price={<>${PRICE}<span className="text-base font-normal" style={{ color: 'var(--text-soft)' }}>/month</span></>}
          sub={`First ${INTRO_MONTHS} months $${INTRO_PRICE}/mo · sometimes on sale for $${INTRO_PRICE}/mo`}
          items={PREMIUM}
          highlight
          cta={
            plan === 'premium' ? (
              <span className={btn} style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Check size={15} /> You're on Premium
              </span>
            ) : (
              <button className={btn} style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => setPlan('premium')}>
                <Sparkles size={15} /> Start Premium
              </button>
            )
          }
        />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        Free is never crippled; sync is a convenience, not a hostage.<br />
        Payment runs through the App Store / Play Store on mobile and Stripe on the web. This build flips the plan locally so you can preview premium features.
      </p>

      <div className="mt-5 text-center">
        <button onClick={() => navigate('/you')} className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>← Back to You</button>
      </div>
    </div>
  );
}
