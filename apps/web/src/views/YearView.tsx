import { useState, type CSSProperties, type DragEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Plus, Camera } from 'lucide-react';
import {
  type Goal,
  type Month,
  MONTH_NAMES,
  monthKey,
  goalColor,
  countMonthPhotos,
  isMonthFilled,
  addGoal as addGoalCore,
  updateGoal,
  setGoalPlannedMonth,
  setYearTheme,
} from '@getsu/core';
import { useVault } from '../state/store';
import { riseItem } from '../lib/motion';

const EMPTY_GOALS: Goal[] = [];
type Zoom = 'years' | 'grid' | 'list';
const ZOOM_ORDER: Zoom[] = ['years', 'grid', 'list'];

export default function YearView() {
  const navigate = useNavigate();
  const { year: yearParam } = useParams();
  const vault = useVault((s) => s.vault)!;
  const currentYear = useVault((s) => s.currentYear);
  const currentMonth = useVault((s) => s.currentMonth);
  const mutate = useVault((s) => s.mutate);

  const year = Number(yearParam) || currentYear;
  const yearObj = vault.years[year];
  const goals = yearObj?.goals ?? EMPTY_GOALS;
  const themeWord = yearObj?.theme ?? '';

  // Timeline is the calm default: a clean, journaling-first scroll of the year.
  const [zoom, setZoom] = useState<Zoom>('list');
  const [zoomDir, setZoomDir] = useState<'in' | 'out'>('in');
  // 0 until the user first changes zoom level; the initial mount plays the
  // month-cell cascade instead of the semantic-zoom animation, which only
  // makes sense once an actual zoom has happened.
  const [zoomCount, setZoomCount] = useState(0);
  const [draft, setDraft] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overMonth, setOverMonth] = useState<number | null>(null);
  const dragActive = dragId != null;

  const changeZoom = (z: Zoom) => {
    if (z === zoom) return;
    setZoomDir(ZOOM_ORDER.indexOf(z) > ZOOM_ORDER.indexOf(zoom) ? 'in' : 'out');
    setZoomCount((n) => n + 1);
    setZoom(z);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const i = ZOOM_ORDER.indexOf(zoom);
    const next = Math.max(0, Math.min(ZOOM_ORDER.length - 1, i + (e.deltaY < 0 ? -1 : 1)));
    if (ZOOM_ORDER[next] !== zoom) changeZoom(ZOOM_ORDER[next]);
  };

  const openMonth = (m: number) => navigate(`/month/${monthKey(year, m)}`);
  const isCurrent = (m: number) => year === currentYear && m === currentMonth;

  const addGoal = () => {
    const t = draft.trim();
    if (!t) return;
    mutate((v) => addGoalCore(v, year, { title: t, color: goalColor(goals.length), metricKind: 'milestone' }));
    setDraft('');
  };
  const place = (id: string, month: number | null) => mutate((v) => setGoalPlannedMonth(v, year, id, month));
  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));

  // ── drag & drop ──
  const onDragStart = (id: string) => (e: DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch { /* ignore */ }
  };
  const onDragEnd = () => { setDragId(null); setOverMonth(null); };
  const allowDrop = (e: DragEvent) => e.preventDefault();
  const dropOnMonth = (m: number) => (e: DragEvent) => { e.preventDefault(); if (dragId) place(dragId, m); onDragEnd(); };
  const dropOnTray = (e: DragEvent) => { e.preventDefault(); if (dragId) place(dragId, null); onDragEnd(); };

  const zoomClass = zoomDir === 'out' ? 'animate-zoom-out' : 'animate-zoom-in';

  return (
    <div onWheel={onWheel}>
      {/* zoom control */}
      <div className="flex justify-center pb-3 pt-1">
        <div className="inline-flex gap-0.5 rounded-full p-1" style={{ background: 'var(--surface-2)' }}>
          {ZOOM_ORDER.map((z) => (
            <button
              key={z}
              onClick={() => changeZoom(z)}
              className="rounded-full px-3.5 py-1 text-xs font-semibold transition"
              style={{
                background: zoom === z ? 'var(--surface)' : 'transparent',
                color: zoom === z ? 'var(--text)' : 'var(--text-faint)',
                boxShadow: zoom === z ? 'var(--shadow-soft)' : 'none',
              }}
            >
              {z === 'years' ? 'Years' : z === 'grid' ? 'Year' : 'Timeline'}
            </button>
          ))}
        </div>
      </div>

      {zoom === 'years' && <YearsOverview key={`years-${year}`} className={zoomClass} />}

      {zoom === 'grid' && (
        <div key={`grid-${year}`} className={zoomCount > 0 ? zoomClass : undefined}>
          {/* year header + editable theme word */}
          <div className="pb-6 text-center">
            <div className="serif text-3xl font-semibold tracking-tight">{year}</div>
            <input
              value={themeWord}
              onChange={(e) => mutate((v) => setYearTheme(v, year, e.target.value))}
              placeholder="a word for the year"
              className="serif mt-1 w-full bg-transparent text-center text-[15px] italic outline-none"
              style={{ color: 'var(--text-soft)' }}
            />
          </div>

          {/* two-column month grid */}
          <div className="grid grid-cols-2 gap-3">
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const mg = goals.filter((g) => g.plannedMonth === month);
              const over = overMonth === month;
              const cellStyle: CSSProperties = {
                borderRadius: 16,
                padding: '10px 8px 11px',
                minHeight: 92,
                background: over ? 'var(--accent-soft)' : dragActive ? 'var(--surface-2)' : 'transparent',
                border: over
                  ? '1.5px solid var(--accent)'
                  : dragActive
                    ? '1.5px dashed var(--border)'
                    : '1.5px solid transparent',
                transition: 'background .18s, border-color .18s',
              };
              return (
                <motion.div
                  key={month}
                  variants={riseItem}
                  initial={zoomCount === 0 ? 'hidden' : false}
                  animate="show"
                  custom={i}
                  style={cellStyle}
                  onDragOver={allowDrop}
                  onDrop={dropOnMonth(month)}
                  onDragEnter={() => dragActive && setOverMonth(month)}
                >
                  <button
                    onClick={() => openMonth(month)}
                    className="flex w-full items-center justify-between px-0.5 pb-2 transition hover:opacity-70"
                  >
                    <span className="serif text-[19px] font-semibold" style={{ color: 'var(--text)' }}>{name}</span>
                    <ChevronRight size={17} style={{ color: 'var(--text-faint)' }} />
                  </button>
                  {isCurrent(month) && (
                    <span className="block px-0.5 pb-1.5 text-[9px] font-bold uppercase tracking-[1.2px]" style={{ color: 'var(--accent)' }}>this month</span>
                  )}
                  <div className="flex flex-wrap gap-1.5 px-0.5">
                    {mg.map((g) => (
                      <GoalChip key={g.id} goal={g} onDragStart={onDragStart(g.id)} onDragEnd={onDragEnd} />
                    ))}
                    {mg.length === 0 && (
                      <span className="py-0.5 text-[11.5px] italic" style={{ color: 'var(--text-faint)' }}>＋ drop a goal</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* yearly goals: draggable list + inline add + drop-back tray */}
          <div className="mt-9" onDragOver={allowDrop} onDrop={dropOnTray}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Goals for {year}</span>
              <button onClick={() => navigate(`/goals/${year}`)} className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>Manage →</button>
            </div>
            <div className="flex flex-col gap-0.5">
              {goals.map((g) => (
                <div
                  key={g.id}
                  draggable
                  onDragStart={onDragStart(g.id)}
                  onDragEnd={onDragEnd}
                  title="Drag into a month"
                  className="-mx-2 flex cursor-grab items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[var(--surface-2)]"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
                  <span
                    className="flex-1 text-[14.5px]"
                    style={{ color: 'var(--text)', textDecoration: g.status === 'done' ? 'line-through' : 'none', opacity: g.status === 'done' ? 0.5 : 1 }}
                  >
                    {g.title}
                  </span>
                  <button
                    onClick={() => toggleDone(g)}
                    className="text-[11px]"
                    style={{ color: 'var(--text-faint)' }}
                    title="Toggle done"
                  >
                    {g.status === 'done' ? 'done' : g.plannedMonth ? MONTH_NAMES[g.plannedMonth - 1].slice(0, 3) : 'on the board'}
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 pb-0.5 pt-2.5">
                <button
                  onClick={addGoal}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                  style={{ border: '1.5px dashed var(--border)', color: 'var(--text-faint)' }}
                  aria-label="Add goal"
                >
                  <Plus size={12} strokeWidth={2.6} />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  placeholder="Add a goal for the year…"
                  className="flex-1 bg-transparent text-[14.5px] outline-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {zoom === 'list' && (
        <div key={`list-${year}`} className={zoomCount > 0 ? zoomClass : undefined}>
          {/* year header + editable theme word */}
          <div className="pb-12 pt-2 text-center">
            <div className="serif text-[34px] font-semibold tracking-tight">{year}</div>
            <input
              value={themeWord}
              onChange={(e) => mutate((v) => setYearTheme(v, year, e.target.value))}
              placeholder="a word for the year"
              className="serif mt-1.5 w-full bg-transparent text-center text-[15px] italic outline-none"
              style={{ color: 'var(--text-soft)' }}
            />
          </div>

          <div className="flex flex-col gap-[28vh]">
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const m = vault.months[monthKey(year, month)];
              const mg = goals.filter((g) => g.plannedMonth === month);
              return (
                <motion.div key={month} variants={riseItem} initial={zoomCount === 0 ? 'hidden' : false} animate="show" custom={i}>
                  <TimelineRow
                    name={name}
                    monthNum={month}
                    month={m}
                    current={isCurrent(month)}
                    future={isFuture(year, month, currentYear, currentMonth)}
                    goals={mg}
                    onOpen={() => openMonth(month)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-[11px]" style={{ color: 'var(--text-faint)' }}>
        Tip: ctrl + scroll to zoom Years ⇄ Year ⇄ Timeline · drag a goal onto a month to plan it
      </p>
    </div>
  );
}

// A month sits in the future when it hasn't happened yet in the current year, or
// belongs to any year past the current one. Future/empty months read faint.
function isFuture(year: number, month: number, curYear: number, curMonth: number): boolean {
  return year > curYear || (year === curYear && month > curMonth);
}

/** A plain-text lead of a month's journal for the timeline preview. */
function snippet(md: string, n = 104): string {
  const clean = md.replace(/[#>*`_]/g, ' ').replace(/^\s*[-*]\s*/gm, '').replace(/\s+/g, ' ').trim();
  return clean.length > n ? `${clean.slice(0, n).trimEnd()}…` : clean;
}

// A calm, journaling-first timeline row: a large month title, then its journal
// lead line, then the month's goals as small dot + title subtext. Generous
// whitespace; future/empty months fade back so the written ones carry the eye.
function TimelineRow({
  name,
  monthNum,
  month,
  current,
  future,
  goals,
  onOpen,
}: {
  name: string;
  monthNum: number;
  month: Month | undefined;
  current: boolean;
  future: boolean;
  goals: Goal[];
  onOpen: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const filled = isMonthFilled(month);
  const preview = month?.reflection ? snippet(month.reflection) : '';
  const photos = countMonthPhotos(month);
  const dim = future && !filled;
  // The months that hold something get the pearlescent sheen; empty ones stay quiet.
  const pearl = filled || current;

  return (
    <button
      onClick={onOpen}
      className="group -mx-3 block w-full rounded-3xl px-3 py-3 text-left transition hover:bg-[var(--surface-2)]"
      style={{ opacity: dim ? 0.4 : 1 }}
    >
      <div className="flex items-baseline gap-3.5">
        <h3
          onClick={(e) => { e.stopPropagation(); setRevealed((r) => !r); }}
          className={`serif text-[56px] font-semibold leading-none tracking-tight ${pearl ? 'pearl-text' : ''}`}
          style={pearl ? { letterSpacing: '-1px' } : { color: 'var(--text-faint)', letterSpacing: '-1px' }}
        >
          {monthNum}
        </h3>
        {/* The month name is a quiet subtext that fades in on hover (desktop) or tap (touch). */}
        <span
          className={`serif text-[16px] italic transition-opacity duration-300 group-hover:opacity-60 ${revealed ? 'opacity-60' : 'opacity-0'}`}
          style={{ color: 'var(--text-soft)' }}
        >
          {name}
        </span>
        {current && <span className="text-[9.5px] font-bold uppercase tracking-[1.3px]" style={{ color: 'var(--accent)' }}>this month</span>}
      </div>

      {preview ? (
        <p className="mt-3.5 line-clamp-2 text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>{preview}</p>
      ) : (
        <p className="mt-3.5 text-[14px] italic" style={{ color: 'var(--text-faint)' }}>{future ? 'yet to come' : 'nothing written yet'}</p>
      )}

      {goals.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {goals.map((g) => (
            <span key={g.id} className="inline-flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: g.color ?? 'var(--accent)' }} />
              <span
                className="text-[12.5px]"
                style={{ color: 'var(--text-soft)', textDecoration: g.status === 'done' ? 'line-through' : 'none', opacity: g.status === 'done' ? 0.6 : 1 }}
              >
                {g.title}
              </span>
            </span>
          ))}
          {photos > 0 && (
            <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>
              <Camera size={12} /> {photos}
            </span>
          )}
        </div>
      )}
      {goals.length === 0 && photos > 0 && (
        <div className="mt-4 inline-flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>
          <Camera size={12} /> {photos}
        </div>
      )}
    </button>
  );
}

function GoalChip({ goal, onDragStart, onDragEnd }: { goal: Goal; onDragStart: (e: DragEvent) => void; onDragEnd: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={goal.title}
      className="inline-flex max-w-[130px] shrink-0 cursor-grab items-center gap-1.5 py-0.5"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: goal.color ?? 'var(--accent)' }} />
      <span
        className="truncate text-[12.5px] font-medium"
        style={{ color: 'var(--text)', textDecoration: goal.status === 'done' ? 'line-through' : 'none', opacity: goal.status === 'done' ? 0.6 : 1 }}
      >
        {goal.title}
      </span>
    </div>
  );
}

// ── Years overview (multi-year placement strips) ──
function YearsOverview({ className }: { className?: string }) {
  const navigate = useNavigate();
  const vault = useVault((s) => s.vault)!;
  const currentYear = useVault((s) => s.currentYear);

  const present = Object.keys(vault.years).map(Number);
  const years = Array.from(new Set([currentYear + 1, currentYear, ...present])).sort((a, b) => b - a);

  return (
    <div className={className}>
      <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Your years</div>
      <div className="flex flex-col gap-1.5">
        {years.map((y) => {
          const yearObj = vault.years[y];
          const goals = yearObj?.goals ?? [];
          const placed = goals.filter((g) => g.plannedMonth != null).length;
          return (
            <button
              key={y}
              onClick={() => navigate(`/year/${y}`)}
              className="-mx-2 rounded-xl px-2 py-4 text-left transition hover:bg-[var(--surface-2)]"
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span
                  className="serif text-[26px] font-semibold tracking-tight"
                  style={{ color: y === currentYear ? 'var(--text)' : 'var(--text-soft)' }}
                >
                  {y}
                </span>
                <span className="serif text-sm italic" style={{ color: 'var(--text-soft)' }}>{yearObj?.theme ?? 'the year ahead'}</span>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 12 }, (_, k) => {
                  const filled = goals.some((g) => g.plannedMonth === k + 1);
                  return <div key={k} className="h-2.5 flex-1 rounded-[3px]" style={{ background: filled ? 'var(--accent)' : 'var(--surface-2)', opacity: filled ? 0.9 : 1 }} />;
                })}
              </div>
              <div className="mt-2 text-[11.5px]" style={{ color: 'var(--text-faint)' }}>{placed ? `${placed} goals` : '—'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
