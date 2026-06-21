import { useNavigate } from 'react-router-dom';
import {
  MONTH_ABBR,
  moodVar,
  monthKey,
  isMonthFilled,
  journaledYears,
  buildYearStrip,
  type YearStrip,
} from '@nekko/journal-core';
import { useVault } from '../state/store';
import { PageHeader } from '../components/ui';

function YearRow({ strip }: { strip: YearStrip }) {
  const navigate = useNavigate();
  return (
    <div className="card p-5 transition-all duration-300 hover:-translate-y-0.5" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <button onClick={() => navigate(`/year/${strip.year}`)} className="serif text-3xl font-semibold hover:underline">
          {strip.year}
        </button>
        {strip.theme && <span className="serif text-lg italic" style={{ color: 'var(--text-soft)' }}>{strip.theme}</span>}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
        <span>{strip.monthsJournaled}/12 months</span>
        {strip.photoCount > 0 && <span>{strip.photoCount} photos</span>}
        {strip.goalsActive > 0 && <span>{strip.goalsActive} goals</span>}
        {strip.goalsDone > 0 && <span>🏆 {strip.goalsDone} achieved</span>}
      </div>

      {/* 12-month mood strip */}
      <div className="mt-3 grid grid-cols-12 gap-1.5">
        {strip.months.map((m, i) => {
          const month = i + 1;
          const key = monthKey(strip.year, month);
          const filled = isMonthFilled(m);
          return (
            <button
              key={i}
              onClick={() => navigate(`/month/${key}`)}
              title={`${MONTH_ABBR[i]} ${strip.year}${filled ? '' : ' · empty'}`}
              className="group/cell flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-transform hover:scale-110"
              style={{
                background: filled ? moodVar(m?.mood) : 'var(--surface-2)',
                color: filled ? '#2b2724' : 'var(--text-faint)',
                border: filled ? 'none' : '1px dashed var(--border)',
              }}
            >
              {MONTH_ABBR[i][0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function YearsView() {
  const currentYear = useVault((s) => s.currentYear);
  const vault = useVault((s) => s.vault!);
  const years = journaledYears(vault, currentYear);

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <PageHeader
        title="Your years"
        subtitle="The long view — every year at a glance, each month a dab of color for how it felt."
      />
      <div className="space-y-4">
        {years.map((y, i) => (
          <div key={y} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
            <YearRow strip={buildYearStrip(vault, y)} />
          </div>
        ))}
      </div>
    </div>
  );
}
