import { create } from 'zustand';
import { type Vault, seedDemoVault } from '@nekko/journal-core';
import { loadVault, saveVault, clearVault } from '../lib/idb';

const CURRENT_YEAR = 2026; // app "today" — keeps the seeded demo aligned with the vault

interface VaultState {
  vault: Vault | null;
  loaded: boolean;
  currentYear: number;
  load: () => Promise<void>;
  /** Run a core mutation against the live vault, then re-render + persist. */
  mutate: (fn: (v: Vault) => void) => void;
  /** Replace the whole vault (e.g. a cloud pull); re-renders + persists. */
  setVault: (vault: Vault) => void;
  toggleTheme: () => void;
  resetDemo: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(vault: Vault) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveVault(vault), 400);
}

function applyTheme(vault: Vault | null) {
  const theme = vault?.settings.theme ?? 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

export const useVault = create<VaultState>((set, get) => ({
  vault: null,
  loaded: false,
  currentYear: CURRENT_YEAR,

  load: async () => {
    let vault = await loadVault();
    if (!vault) {
      vault = seedDemoVault(CURRENT_YEAR);
      await saveVault(vault);
    }
    applyTheme(vault);
    set({ vault, loaded: true });
  },

  mutate: (fn) => {
    const { vault } = get();
    if (!vault) return;
    fn(vault);
    const next = { ...vault }; // new top-level ref to trigger subscribers
    applyTheme(next);
    schedulePersist(next);
    set({ vault: next });
  },

  setVault: (vault) => {
    applyTheme(vault);
    schedulePersist(vault);
    set({ vault });
  },

  toggleTheme: () => {
    get().mutate((v) => {
      v.settings.theme = v.settings.theme === 'dark' ? 'light' : 'dark';
    });
  },

  resetDemo: async () => {
    await clearVault();
    const vault = seedDemoVault(CURRENT_YEAR);
    await saveVault(vault);
    applyTheme(vault);
    set({ vault });
  },
}));
