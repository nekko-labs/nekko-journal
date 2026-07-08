import { useNavigate } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { useVault } from '../state/store';

export const ONBOARD_KEY = 'nekko.onboarded';

/**
 * The first screen. Deliberately minimal: the title, one line of subtext, and a
 * single inspirational call to action. The CTA is a teal underline under the
 * label that flows to the right into a long arrow, so the underline and the
 * arrow read as one continuous stroke. Everything animates in gently, in order.
 */
export default function OnboardingView() {
  const navigate = useNavigate();
  const year = useVault((s) => s.currentYear);

  const begin = () => {
    try { localStorage.setItem(ONBOARD_KEY, '1'); } catch { /* ignore */ }
    navigate(`/year/${year}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <h1
        className="serif animate-rise text-5xl font-semibold leading-none tracking-tight sm:text-6xl"
        style={{ color: 'var(--text)' }}
      >
        Nekko Journal
      </h1>

      <p
        className="serif animate-rise mt-4 text-xl italic sm:text-2xl"
        style={{ color: 'var(--text-soft)', animationDelay: '0.12s' }}
      >
        one month at a time
      </p>

      <button
        onClick={begin}
        className="onboard-cta group mt-14 inline-flex items-end gap-3"
        aria-label="Begin your year"
      >
        <span
          className="pb-1.5 text-lg font-medium sm:text-xl"
          style={{ color: 'var(--text)', borderBottom: '2px solid var(--accent)' }}
        >
          Begin your year
        </span>
        <span className="cta-arrow mb-1 inline-flex">
          <MoveRight
            className="transition-transform duration-300 group-hover:translate-x-1.5"
            size={30}
            strokeWidth={2}
            style={{ color: 'var(--accent)' }}
          />
        </span>
      </button>
    </div>
  );
}
