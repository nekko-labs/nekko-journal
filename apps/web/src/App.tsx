import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { Calendar, Target, BarChart3, User, Sparkles } from 'lucide-react';
import { EASE_OUT } from './lib/motion';
import { useVault } from './state/store';
import { useCloud } from './state/cloud';
import { runMonthlyNudge } from './lib/nudge';
import Splash from './components/Splash';
import BrandMark from './components/BrandMark';
import OnboardingView, { ONBOARD_KEY } from './views/OnboardingView';
import YearView from './views/YearView';
import MonthView from './views/MonthView';
import GoalsView from './views/GoalsView';
import InsightsView from './views/InsightsView';
import YouView from './views/YouView';
import LookbackView from './views/LookbackView';
import YearsView from './views/YearsView';
import AccountView from './views/AccountView';
import PricingView from './views/PricingView';
import TrackersView from './views/TrackersView';
import AIView from './views/AIView';

function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARD_KEY) === '1'; } catch { return true; }
}

function RootGate() {
  const year = useVault((s) => s.currentYear);
  if (!hasOnboarded()) return <Navigate to="/welcome" replace />;
  return <Navigate to={`/year/${year}`} replace />;
}

const TAB_ICON_SIZE = 21;

/** The four primary surfaces. Bottom bar on mobile, top nav on desktop. */
function useTabs() {
  const year = useVault((s) => s.currentYear);
  return [
    { to: `/year/${year}`, match: '/year', label: 'Year', icon: <Calendar size={TAB_ICON_SIZE} strokeWidth={1.7} /> },
    { to: `/goals/${year}`, match: '/goals', label: 'Goals', icon: <Target size={TAB_ICON_SIZE} strokeWidth={1.7} /> },
    { to: '/insights', match: '/insights', label: 'Insights', icon: <BarChart3 size={TAB_ICON_SIZE} strokeWidth={1.7} /> },
    { to: '/you', match: '/you', label: 'You', icon: <User size={TAB_ICON_SIZE} strokeWidth={1.7} /> },
  ];
}

function TopNav() {
  const tabs = useTabs();
  const { pathname } = useLocation();
  return (
    <header className="hidden shrink-0 border-b md:block" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="serif text-lg font-semibold">Getsu</span>
        </div>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.match);
            return (
              <NavLink
                key={t.match}
                to={t.to}
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-soft)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {t.icon}
                {t.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function BottomTabs() {
  const tabs = useTabs();
  const { pathname } = useLocation();
  return (
    <nav
      className="shrink-0 border-t md:hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.match);
          return (
            <NavLink
              key={t.match}
              to={t.to}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-transform active:scale-95"
              style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }}
            >
              {t.icon}
              <span className="text-[10px] font-semibold">{t.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/** Chrome (nav bars) is hidden on the welcome + month surfaces, matching the design. */
function chromeVisible(pathname: string): boolean {
  return pathname !== '/welcome' && !pathname.startsWith('/month');
}

export default function App() {
  const loaded = useVault((s) => s.loaded);
  const load = useVault((s) => s.load);
  const initCloud = useCloud((s) => s.init);
  const location = useLocation();
  const { pathname } = location;
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void load().then(() => {
      initCloud();
      const v = useVault.getState().vault;
      if (v) runMonthlyNudge(v);
    });
  }, [load, initCloud]);

  // The scroll container persists across routes; start each surface at the top.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-faint)' }}>
        <Sparkles className="mr-2 animate-pulse" size={18} /> Opening your journal…
      </div>
    );
  }

  const showChrome = chromeVisible(pathname);

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex h-full flex-col">
      <Splash />
      {showChrome && <TopNav />}
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        {/* Gentle enter-only route transition: fade + small rise, never an exit. */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 pb-8 pt-4 sm:px-6"
        >
          <Routes location={location}>
            <Route path="/" element={<RootGate />} />
            <Route path="/welcome" element={<OnboardingView />} />
            <Route path="/year/:year" element={<YearView />} />
            <Route path="/month/:key" element={<MonthView />} />
            <Route path="/goals/:year" element={<GoalsView />} />
            <Route path="/insights" element={<InsightsView />} />
            <Route path="/you" element={<YouView />} />
            <Route path="/years" element={<YearsView />} />
            <Route path="/lookback" element={<LookbackView />} />
            <Route path="/account" element={<AccountView />} />
            <Route path="/pricing" element={<PricingView />} />
            <Route path="/trackers" element={<TrackersView />} />
            <Route path="/ai" element={<AIView />} />
            <Route path="*" element={<RootGate />} />
          </Routes>
        </motion.div>
      </main>
      {showChrome && <BottomTabs />}
    </div>
    </MotionConfig>
  );
}
