import { MONTH_ABBR } from '@nekko/journal-core';

/** 12 vertical bars, one per month. `colors` optionally tints each bar. */
export function MonthBars({
  series,
  color = 'var(--accent)',
  colors,
  unit,
  height = 84,
}: {
  series: (number | undefined)[];
  color?: string;
  colors?: (string | undefined)[];
  unit?: string;
  height?: number;
}) {
  const max = Math.max(1, ...series.map((v) => (typeof v === 'number' ? v : 0)));
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 18 }}>
      {series.map((v, i) => {
        const has = typeof v === 'number';
        const h = has ? Math.max(3, (v! / max) * height) : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={has ? `${MONTH_ABBR[i]}: ${v}${unit ? ` ${unit}` : ''}` : `${MONTH_ABBR[i]}: —`}>
            {has ? (
              <div className="w-full rounded-md transition-all" style={{ height: h, background: colors?.[i] ?? color, minWidth: 6 }} />
            ) : (
              <div className="w-full rounded-md" style={{ height: 3, background: 'var(--border)' }} />
            )}
            <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{MONTH_ABBR[i][0]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** A labeled stat tile. */
export function StatTile({ value, label, accent }: { value: React.ReactNode; label: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="serif text-3xl font-semibold leading-none" style={{ color: accent ?? 'var(--text)' }}>{value}</div>
      <div className="mt-1.5 text-xs" style={{ color: 'var(--text-soft)' }}>{label}</div>
    </div>
  );
}

/** A horizontal progress bar (0–1). */
export function ProgressBar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  );
}
