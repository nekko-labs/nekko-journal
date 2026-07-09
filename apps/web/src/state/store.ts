import { create } from 'zustand';
import { type Vault, type Plan, seedDemoVault } from '@nekko/journal-core';
import { loadVault, saveVault, clearVault } from '../lib/idb';
import {
  type FsDirHandle,
  isFsSupported,
  pickVaultFolder,
  folderHasVault,
  readVaultFromFolder,
  writeVaultToFolder,
  rememberFolder,
  forgetFolder,
  restoreFolder,
} from '../lib/fsaccess';

const CURRENT_YEAR = 2026; // app "today"; keeps the seeded demo aligned with the vault
const CURRENT_MONTH = 6; // June, the month the seeded story culminates in

/** State of the optional connected local folder (File System Access). */
export type FolderStatus = 'none' | 'connected' | 'reconnect';

interface VaultState {
  vault: Vault | null;
  loaded: boolean;
  currentYear: number;
  currentMonth: number;
  /** File System Access folder support + connection. */
  fsSupported: boolean;
  folderName: string | null;
  folderStatus: FolderStatus;
  load: () => Promise<void>;
  /** Run a core mutation against the live vault, then re-render + persist. */
  mutate: (fn: (v: Vault) => void) => void;
  /** Replace the whole vault (e.g. a cloud pull); re-renders + persists. */
  setVault: (vault: Vault) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPlan: (plan: Plan) => void;
  resetDemo: () => Promise<void>;
  /** Pick a local folder to open/save the vault as a folder of files. */
  openFolder: () => Promise<{ ok: boolean; loaded: boolean } | undefined>;
  /** Re-grant permission to a remembered folder after a reload. */
  reconnectFolder: () => Promise<boolean>;
  /** Stop mirroring to the folder (keeps the IndexedDB copy). */
  disconnectFolder: () => Promise<void>;
}

// The connected folder handle lives outside React state (it isn't serializable
// into a render and never needs to trigger a re-render on its own).
let folderHandle: FsDirHandle | null = null;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let folderTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(vault: Vault) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveVault(vault), 400);
  if (folderHandle) {
    if (folderTimer) clearTimeout(folderTimer);
    const handle = folderHandle;
    folderTimer = setTimeout(() => void writeVaultToFolder(handle, vault).catch(() => {}), 800);
  }
}

function applyTheme(vault: Vault | null) {
  const theme = vault?.settings.theme ?? 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

export const useVault = create<VaultState>((set, get) => ({
  vault: null,
  loaded: false,
  currentYear: CURRENT_YEAR,
  currentMonth: CURRENT_MONTH,
  fsSupported: isFsSupported(),
  folderName: null,
  folderStatus: 'none',

  load: async () => {
    let vault = await loadVault();
    if (!vault) {
      vault = seedDemoVault(CURRENT_YEAR);
      await saveVault(vault);
    }
    applyTheme(vault);
    set({ vault, loaded: true });

    // A folder connected in a previous session needs a user gesture to
    // re-grant permission, so surface it as "reconnect" rather than auto-reading.
    if (isFsSupported()) {
      const handle = await restoreFolder();
      if (handle) set({ folderName: handle.name, folderStatus: 'reconnect' });
    }
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

  setTheme: (theme) => {
    get().mutate((v) => {
      v.settings.theme = theme;
    });
  },

  setPlan: (plan) => {
    get().mutate((v) => {
      v.settings.plan = plan;
    });
  },

  resetDemo: async () => {
    await clearVault();
    const vault = seedDemoVault(CURRENT_YEAR);
    await saveVault(vault);
    applyTheme(vault);
    set({ vault });
    if (folderHandle) schedulePersist(vault);
  },

  openFolder: async () => {
    const handle = await pickVaultFolder();
    if (!handle) return { ok: false, loaded: false };
    folderHandle = handle;
    await rememberFolder(handle);
    let loadedFromFolder = false;
    if (await folderHasVault(handle)) {
      // Adopt the folder's vault as the source of truth.
      const fromFolder = await readVaultFromFolder(handle);
      if (fromFolder) {
        applyTheme(fromFolder);
        await saveVault(fromFolder);
        set({ vault: fromFolder });
        loadedFromFolder = true;
      }
    } else {
      // Empty/new folder — seed it from the current vault.
      const current = get().vault;
      if (current) await writeVaultToFolder(handle, current).catch(() => {});
    }
    set({ folderName: handle.name, folderStatus: 'connected' });
    return { ok: true, loaded: loadedFromFolder };
  },

  reconnectFolder: async () => {
    const handle = folderHandle ?? (await restoreFolder());
    if (!handle) { set({ folderStatus: 'none', folderName: null }); return false; }
    // readVaultFromFolder re-requests permission via a user gesture.
    const fromFolder = await readVaultFromFolder(handle).catch(() => null);
    folderHandle = handle;
    if (fromFolder) {
      applyTheme(fromFolder);
      await saveVault(fromFolder);
      set({ vault: fromFolder });
    }
    set({ folderName: handle.name, folderStatus: 'connected' });
    return true;
  },

  disconnectFolder: async () => {
    folderHandle = null;
    await forgetFolder();
    set({ folderName: null, folderStatus: 'none' });
  },
}));
