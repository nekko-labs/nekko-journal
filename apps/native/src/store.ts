import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Vault, type Plan, seedDemoVault } from '@nekko/journal-core';
import { LIGHT, DARK, type Tokens } from './theme';

const STORAGE_KEY = 'nekko.journal.vault.v1';
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 6;

interface State {
  vault: Vault | null;
  loaded: boolean;
  currentYear: number;
  currentMonth: number;
  load: () => Promise<void>;
  mutate: (fn: (v: Vault) => void) => void;
  setVault: (v: Vault) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setPlan: (p: Plan) => void;
  tokens: () => Tokens;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(v: Vault) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(v)), 400);
}

export const useVault = create<State>((set, get) => ({
  vault: null,
  loaded: false,
  currentYear: CURRENT_YEAR,
  currentMonth: CURRENT_MONTH,

  load: async () => {
    let vault: Vault | null = null;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) vault = JSON.parse(raw) as Vault;
    } catch {
      vault = null;
    }
    if (!vault) {
      vault = seedDemoVault(CURRENT_YEAR);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    }
    set({ vault, loaded: true });
  },

  mutate: (fn) => {
    const { vault } = get();
    if (!vault) return;
    fn(vault);
    const next = { ...vault };
    persist(next);
    set({ vault: next });
  },

  setVault: (vault) => {
    persist(vault);
    set({ vault });
  },

  setTheme: (t) => get().mutate((v) => { v.settings.theme = t; }),
  setPlan: (p) => get().mutate((v) => { v.settings.plan = p; }),

  tokens: () => (get().vault?.settings.theme === 'dark' ? DARK : LIGHT),
}));
