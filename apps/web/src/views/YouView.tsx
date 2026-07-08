import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ChevronRight, Sparkles, Cloud, Bell, Download, Upload, RotateCcw } from 'lucide-react';
import { isMonthFilled } from '@nekko/journal-core';
import { useVault } from '../state/store';
import { useCloud } from '../state/cloud';

export default function YouView() {
  const navigate = useNavigate();
  const vault = useVault((s) => s.vault)!;
  const setTheme = useVault((s) => s.setTheme);
  const setVault = useVault((s) => s.setVault);
  const mutate = useVault((s) => s.mutate);
  const resetDemo = useVault((s) => s.resetDemo);
  const cloud = useCloud();

  const theme = vault.settings.theme;
  const plan = vault.settings.plan ?? 'free';
  const notify = vault.settings.notify ?? 'monthly';

  const filledMonths = Object.values(vault.months).filter(isMonthFilled).length;
  const years = Object.keys(vault.years).map(Number);
  const sinceYear = years.length ? Math.min(...years) : new Date().getFullYear();

  const exportVault = () => {
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nekko-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importVault = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (parsed && parsed.years && parsed.months) setVault(parsed);
        } catch { /* ignore malformed */ }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const syncValue = !cloud.configured ? 'Local only' : cloud.session ? (plan === 'premium' ? 'On' : 'Sign-in only') : 'Off';

  const rows = [
    { icon: <Sparkles size={17} />, label: 'Plan', value: plan === 'premium' ? 'Premium' : 'Free', onClick: () => navigate('/pricing') },
    { icon: <Cloud size={17} />, label: 'Sync & account', value: syncValue, onClick: () => navigate('/account') },
    { icon: <Bell size={17} />, label: 'Monthly nudge', value: notify === 'monthly' ? 'On' : 'Off', onClick: () => mutate((v) => { v.settings.notify = notify === 'monthly' ? 'off' : 'monthly'; }) },
    { icon: <Download size={17} />, label: 'Export vault', value: '', onClick: exportVault },
    { icon: <Upload size={17} />, label: 'Import data', value: '', onClick: importVault },
    { icon: <RotateCcw size={17} />, label: 'Reset to demo', value: '', onClick: () => { if (confirm('Replace your vault with the demo data? This cannot be undone.')) void resetDemo(); } },
  ];

  return (
    <div className="animate-rise">
      {/* profile */}
      <div className="flex items-center gap-4 pt-2">
        <div className="grid h-14 w-14 place-items-center rounded-full text-2xl" style={{ background: 'var(--surface-2)' }}>🌙</div>
        <div>
          <div className="serif text-2xl font-semibold leading-tight">Your journal</div>
          <div className="text-[13px]" style={{ color: 'var(--text-soft)' }}>{filledMonths} months · since {sinceYear}</div>
        </div>
      </div>

      {/* theme */}
      <div className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-3.5 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Theme</div>
        <div className="flex gap-2 rounded-2xl p-1.5" style={{ background: 'var(--surface-2)' }}>
          {(['light', 'dark'] as const).map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition"
                style={{
                  background: active ? 'var(--surface)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-faint)',
                  boxShadow: active ? 'var(--shadow-soft)' : 'none',
                }}
              >
                {t === 'light' ? <Sun size={15} /> : <Moon size={15} />}
                {t === 'light' ? 'Light' : 'Dark'}
              </button>
            );
          })}
        </div>
      </div>

      {/* settings */}
      <div className="mt-7 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[1.6px]" style={{ color: 'var(--text-faint)' }}>Settings</div>
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <button
              key={r.label}
              onClick={r.onClick}
              className="flex items-center justify-between rounded-lg px-1 py-3.5 text-left transition hover:bg-[var(--surface-2)]"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
            >
              <span className="flex items-center gap-3 text-[15px]" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-soft)' }}>{r.icon}</span>
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                {r.value && <span className="text-[13px]" style={{ color: 'var(--text-faint)' }}>{r.value}</span>}
                <ChevronRight size={17} style={{ color: 'var(--text-faint)' }} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-[12px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        Local-first · your data stays yours<br />Nekko Journal v1.0
      </div>
    </div>
  );
}
