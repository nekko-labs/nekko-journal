import { create } from 'zustand';
import { type Session } from '@supabase/supabase-js';
import { reconcileVaults } from '@nekko/journal-core';
import {
  isCloudConfigured,
  getSession,
  onAuthChange,
  fetchPlan,
  pullVault,
  pushVault,
  signOut as sbSignOut,
  type Plan,
} from '../lib/supabase';
import { useVault } from './store';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface CloudState {
  configured: boolean;
  session: Session | null;
  plan: Plan;
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  init: () => Promise<void>;
  sync: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Debounced push triggered by local edits (cloud plan only). */
  notifyLocalChange: () => void;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export const useCloud = create<CloudState>((set, get) => ({
  configured: isCloudConfigured(),
  session: null,
  plan: 'free',
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  init: async () => {
    if (!isCloudConfigured()) return;
    const session = await getSession();
    set({ session });
    if (session) {
      const plan = await fetchPlan(session.user.id);
      set({ plan });
      if (plan === 'cloud') await get().sync();
    }
    onAuthChange(async (s) => {
      set({ session: s });
      if (s) {
        const plan = await fetchPlan(s.user.id);
        set({ plan });
        if (plan === 'cloud') await get().sync();
      } else {
        set({ plan: 'free', status: 'idle' });
      }
    });
  },

  sync: async () => {
    const { session, plan } = get();
    if (!session || plan !== 'cloud') return;
    set({ status: 'syncing', error: null });
    try {
      const local = useVault.getState().vault!;
      const remote = await pullVault(session.user.id);
      const { winner, action } = reconcileVaults(local, remote);
      if (action === 'pull') {
        useVault.getState().setVault(winner);
      } else if (action === 'push') {
        const { error } = await pushVault(session.user.id, winner);
        if (error) throw new Error(error);
      }
      set({ status: 'synced', lastSyncedAt: Date.now() });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Sync failed' });
    }
  },

  signOut: async () => {
    await sbSignOut();
    set({ session: null, plan: 'free', status: 'idle' });
  },

  notifyLocalChange: () => {
    const { session, plan } = get();
    if (!session || plan !== 'cloud') return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void get().sync(), 1500);
  },
}));

// Auto-push local edits when on the cloud plan. Subscribing here keeps the vault
// store unaware of the cloud layer (free tier has zero cloud coupling).
useVault.subscribe((state, prev) => {
  if (state.vault !== prev.vault) useCloud.getState().notifyLocalChange();
});
