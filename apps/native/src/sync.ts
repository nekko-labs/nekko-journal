import { type Vault } from '@nekko/journal-core';

/**
 * Cross-device sync (Premium). Design goal: NO backend of our own — write the
 * vault snapshot to the *user's* cloud and read it back. Reconciliation reuses
 * core's `reconcileVaults` (whole-vault last-write-wins), exactly like the web.
 *
 * Providers, by platform:
 *  - iOS/macOS: **iCloud** (`NSUbiquitousKeyValueStore` for the snapshot, or an
 *    iCloud Drive document). Needs a small native module / Expo config plugin
 *    (declared in app.json → ios.infoPlist.NSUbiquitousContainers). Handoff.
 *  - Android: **Google Drive `appDataFolder`** via the Drive REST API + Google
 *    Sign-In. Hidden per-app folder, no server. Handoff (needs OAuth client).
 *  - Web/desktop/any: an optional **Supabase** whole-vault snapshot. Implemented
 *    below with plain `fetch` (PostgREST) — no native module — so it works in
 *    RN today when configured. Mirrors the web Supabase path.
 *
 * This module is the seam: callers use `getSyncProvider()` and don't care which
 * cloud backs it.
 */
export interface SyncProvider {
  readonly id: 'icloud' | 'gdrive' | 'supabase' | 'none';
  readonly label: string;
  available(): Promise<boolean>;
  pull(): Promise<Vault | null>;
  push(vault: Vault): Promise<void>;
}

const noopProvider: SyncProvider = {
  id: 'none',
  label: 'Off',
  available: async () => false,
  pull: async () => null,
  push: async () => {},
};

// --- Supabase snapshot (fetch/PostgREST; no native module) ------------------
//
// Configure with EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY.
// Storage is a single row per device in a `vaults` table:
//   create table vaults (device_id text primary key, data jsonb, updated_at timestamptz default now());
// (See repo supabase/schema.sql for the web path's authenticated, RLS-guarded
// table; this device-scoped snapshot is the simplest no-auth MVP and should be
// promoted to the authenticated path before shipping to real users.)

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function supabaseProvider(deviceId: string): SyncProvider {
  const base = `${SUPABASE_URL}/rest/v1/vaults`;
  const headers = {
    apikey: SUPABASE_ANON as string,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
  };
  return {
    id: 'supabase',
    label: 'Cloud (Supabase)',
    available: async () => Boolean(SUPABASE_URL && SUPABASE_ANON),
    async pull() {
      const res = await fetch(`${base}?device_id=eq.${encodeURIComponent(deviceId)}&select=data`, { headers });
      if (!res.ok) throw new Error(`sync pull failed: ${res.status}`);
      const rows = (await res.json()) as { data: Vault }[];
      return rows[0]?.data ?? null;
    },
    async push(vault: Vault) {
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ device_id: deviceId, data: vault, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
    },
  };
}

/**
 * Pick the active sync provider. Returns the Supabase snapshot when configured
 * (works cross-platform via fetch); iCloud/Drive slot in here once their native
 * modules are added (T22 native handoff). `deviceId` should be a stable id you
 * persist (e.g. in AsyncStorage) so a device keeps talking to its own snapshot.
 */
export function getSyncProvider(deviceId: string): SyncProvider {
  if (SUPABASE_URL && SUPABASE_ANON) return supabaseProvider(deviceId);
  // TODO(native-sync): return an iCloud provider on Apple and a Google Drive
  // appData provider on Android once the native modules land.
  return noopProvider;
}
