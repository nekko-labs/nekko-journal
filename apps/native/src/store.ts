import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Vault, type Plan, seedDemoVault, reconcileVaults } from '@nekko/journal-core';
import { LIGHT, DARK, type Tokens } from './theme';
import { getSyncProvider } from './sync';

const STORAGE_KEY = 'nekko.journal.vault.v1';
const DEVICE_KEY = 'nekko.journal.device.v1';
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 6;

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'synced' | 'error';

let deviceId = 'device';
async function ensureDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      await AsyncStorage.setItem(DEVICE_KEY, id);
    }
    deviceId = id;
  } catch { /* keep default */ }
  return deviceId;
}

interface State {
  vault: Vault | null;
  loaded: boolean;
  currentYear: number;
  currentMonth: number;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  load: () => Promise<void>;
  mutate: (fn: (v: Vault) => void) => void;
  setVault: (v: Vault) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setPlan: (p: Plan) => void;
  /** Reconcile the local vault with the user's cloud snapshot (Premium). */
  syncNow: () => Promise<void>;
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
  syncStatus: 'off',
  lastSyncedAt: null,

  load: async () => {
    await ensureDeviceId();
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
    const provider = getSyncProvider(deviceId);
    set({ vault, loaded: true, syncStatus: (await provider.available()) ? 'idle' : 'off' });
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

  syncNow: async () => {
    const { vault } = get();
    if (!vault) return;
    if ((vault.settings.plan ?? 'free') !== 'premium') { set({ syncStatus: 'off' }); return; }
    const provider = getSyncProvider(deviceId);
    if (!(await provider.available())) { set({ syncStatus: 'off' }); return; }
    set({ syncStatus: 'syncing' });
    try {
      const remote = await provider.pull();
      const { winner, action } = reconcileVaults(vault, remote);
      if (action === 'pull') { persist(winner); set({ vault: winner }); }
      else if (action === 'push') { await provider.push(winner); }
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
    } catch {
      set({ syncStatus: 'error' });
    }
  },

  tokens: () => (get().vault?.settings.theme === 'dark' ? DARK : LIGHT),
}));
