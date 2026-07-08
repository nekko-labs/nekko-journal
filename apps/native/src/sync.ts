import { type Vault } from '@nekko/journal-core';

/**
 * Cross-device sync (Premium). The design goal is NO backend of our own: write
 * the vault snapshot to the *user's* cloud and read it back.
 *
 *  - iOS/macOS: iCloud. Either `NSUbiquitousKeyValueStore` (simple, ~1MB, great
 *    for the snapshot minus photos) or an iCloud Drive document in the app's
 *    ubiquity container (declared in app.json → ios.infoPlist.NSUbiquitousContainers).
 *    Reach it from RN via a small native module / config plugin (e.g.
 *    `react-native-icloudstore` or a custom Expo module).
 *  - Android: Google Drive `appDataFolder` (hidden per-app folder, no Drive UI
 *    clutter, no server) via the Drive REST API with Google Sign-In.
 *
 * Reconciliation reuses core's `reconcileVaults` (whole-vault last-write-wins),
 * exactly like the web Supabase path. If client-to-cloud proves too flaky for
 * conflicts, fall back to the optional Supabase snapshot (already in core).
 *
 * This module is the seam: the screens call `getSyncProvider()` and don't care
 * which cloud backs it. The stub below is a no-op so the app runs locally today.
 */
export interface SyncProvider {
  readonly id: 'icloud' | 'gdrive' | 'none';
  available(): Promise<boolean>;
  pull(): Promise<Vault | null>;
  push(vault: Vault): Promise<void>;
}

const noopProvider: SyncProvider = {
  id: 'none',
  available: async () => false,
  pull: async () => null,
  push: async () => {},
};

/**
 * Returns the platform sync provider when Premium + a native module is wired.
 * Today it returns the no-op provider so the free, local-first app is complete.
 */
export function getSyncProvider(): SyncProvider {
  // TODO(native-sync): return an iCloud provider on Apple and a Google Drive
  // appData provider on Android once the native modules are added (T22).
  return noopProvider;
}
