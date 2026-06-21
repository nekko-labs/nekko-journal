import { type Vault } from '@nekko/journal-shared';

// Sync support. The MVP cloud-sync strategy is a whole-vault snapshot with
// last-write-wins at the vault level: simple, correct for a single user across
// their own devices, and easy to reason about. (Upgrade path: per-record sync
// with `updated_at` columns per table — documented in DEPLOY.md.)

/** The most recent edit timestamp anywhere in the vault (ISO string). */
export function vaultTouchedAt(vault: Vault): string {
  let max = '1970-01-01T00:00:00.000Z';
  for (const m of Object.values(vault.months)) {
    if (m.updatedAt > max) max = m.updatedAt;
  }
  for (const y of Object.values(vault.years)) {
    if (y.updatedAt > max) max = y.updatedAt;
  }
  return max;
}

/**
 * Pick the vault to keep when reconciling a local and a remote snapshot.
 * Last-write-wins by `vaultTouchedAt`. Returns which side won so callers know
 * whether they need to push, pull, or do nothing.
 */
export function reconcileVaults(
  local: Vault,
  remote: Vault | null,
): { winner: Vault; action: 'push' | 'pull' | 'in-sync' } {
  if (!remote) return { winner: local, action: 'push' };
  const l = vaultTouchedAt(local);
  const r = vaultTouchedAt(remote);
  if (l > r) return { winner: local, action: 'push' };
  if (r > l) return { winner: remote, action: 'pull' };
  return { winner: local, action: 'in-sync' };
}
