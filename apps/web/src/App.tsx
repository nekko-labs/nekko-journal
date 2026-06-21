import { useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, Target, BarChart3, Clock, Cloud, Moon, Sun, Sparkles } from 'lucide-react';
import { useVault } from './state/store';
import { useCloud } from './state/cloud';
import YearView from './views/YearView';
import MonthView from './views/MonthView';
import GoalsView from './views/GoalsView';
import LookbackView from './views/LookbackView';
import YearsView from './views/YearsView';
import InsightsView from './views/InsightsView';
import AccountView from './views/AccountView';
import PricingView from './views/PricingView';

function ThemeToggle() {
  const theme = useVault((s) => s.vault?.settings.theme ?? 'light');
  const toggle = useVault((s) => s.toggleTheme);
  return (
    <button className="btn !px-2.5" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Sidebar() {
  const year = useVault((s) => s.currentYear);
  const link = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-soft)] hover:bg-[var(--surface-2)]'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-5 flex items-center gap-2 px-2">
        <span className="text-2xl">🌙</span>
        <div>
          <div className="serif text-lg font-semibold leading-none">Nekko Journal</div>
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>a month at a time</div>
        </div>
      </div>
      {link(`/year/${year}`, <CalendarDays size={17} />, 'Year')}
      {link('/years', <CalendarRange size={17} />, 'All years')}
      {link(`/goals/${year}`, <Target size={17} />, 'Goals')}
      {link('/insights', <BarChart3 size={17} />, 'Insights')}
      {link('/lookback', <Clock size={17} />, 'Look back')}
      <div className="mt-4 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        {link('/account', <Cloud size={17} />, 'Account & sync')}
      </div>
      <div className="mt-auto flex items-center justify-between px-1 pt-4">
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Local-first · your data</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

function RedirectToCurrentYear() {
  const year = useVault((s) => s.currentYear);
  return <Navigate to={`/year/${year}`} replace />;
}

// Mobile top bar — sidebar is hidden below md.
function MobileBar() {
  const year = useVault((s) => s.currentYear);
  const item = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium ${
          isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-soft)]'
        }`
      }
    >
      {label}
    </NavLink>
  );
  return (
    <div className="flex items-center gap-1 border-b px-3 py-2 md:hidden" style={{ borderColor: 'var(--border)' }}>
      <span className="mr-1 text-lg">🌙</span>
      {item(`/year/${year}`, 'Year')}
      {item('/years', 'Years')}
      {item(`/goals/${year}`, 'Goals')}
      {item('/insights', 'Insights')}
      {item('/lookback', 'Back')}
      <ThemeToggle />
    </div>
  );
}

export default function App() {
  const loaded = useVault((s) => s.loaded);
  const load = useVault((s) => s.load);
  const initCloud = useCloud((s) => s.init);

  useEffect(() => {
    void load().then(() => initCloud());
  }, [load, initCloud]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-faint)' }}>
        <Sparkles className="mr-2 animate-pulse" size={18} /> Opening your journal…
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <MobileBar />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<RedirectToCurrentYear />} />
            <Route path="/year/:year" element={<YearView />} />
            <Route path="/years" element={<YearsView />} />
            <Route path="/month/:key" element={<MonthView />} />
            <Route path="/goals/:year" element={<GoalsView />} />
            <Route path="/insights" element={<InsightsView />} />
            <Route path="/lookback" element={<LookbackView />} />
            <Route path="/account" element={<AccountView />} />
            <Route path="/pricing" element={<PricingView />} />
            <Route path="*" element={<RedirectToCurrentYear />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
