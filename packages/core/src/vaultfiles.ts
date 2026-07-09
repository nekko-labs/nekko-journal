import {
  type Vault,
  type Year,
  type Tracker,
  type Settings,
  parseMonthKey,
} from '@nekko/journal-shared';
import { serializeMonth, parseMonth } from './frontmatter.js';
import { createEmptyVault, VAULT_VERSION } from './vault.js';

// The on-disk vault is a human-browsable folder of files (see SPEC "Vault file
// layout"). This module owns the folder <-> Vault mapping so it stays DOM-free
// and unit-testable; the web layer (File System Access) and any native layer
// only do the actual I/O against the {@link VaultFile} list this produces.
//
//   years/YYYY.json      — the Year record (theme + goals)
//   months/YYYY-MM.md    — one Markdown file per month (frontmatter + reflection)
//   .nekko/settings.json — app settings (theme, plan, notify)
//   .nekko/trackers.json — tracker definitions
//   .nekko/vault.json     — a marker holding the vault version
//
// Photos live inline as data URLs inside each month's frontmatter, so a folder
// is fully self-contained and round-trips losslessly.

export interface VaultFile {
  /** POSIX-style path relative to the vault root, e.g. "months/2026-06.md". */
  path: string;
  content: string;
}

/** A marker file that lets us recognize a folder as a Nekko Journal vault. */
export const VAULT_MARKER = '.nekko/vault.json';

/** Serialize a whole vault into the folder-of-files layout. */
export function serializeVaultToFiles(vault: Vault): VaultFile[] {
  const files: VaultFile[] = [];

  files.push({
    path: VAULT_MARKER,
    content: JSON.stringify({ version: vault.version ?? VAULT_VERSION, app: 'nekko-journal' }, null, 2),
  });
  files.push({ path: '.nekko/settings.json', content: JSON.stringify(vault.settings, null, 2) });
  files.push({ path: '.nekko/trackers.json', content: JSON.stringify(vault.trackers, null, 2) });

  for (const year of Object.values(vault.years)) {
    files.push({ path: `years/${year.year}.json`, content: JSON.stringify(year, null, 2) });
  }

  for (const month of Object.values(vault.months)) {
    files.push({ path: `months/${month.id}.md`, content: serializeMonth(month) });
  }

  return files;
}

/** Rebuild a vault from the folder-of-files layout. Tolerant of missing pieces. */
export function parseVaultFromFiles(files: VaultFile[]): Vault {
  const vault = createEmptyVault();
  const byPath = new Map(files.map((f) => [normalize(f.path), f.content]));

  const settings = readJson<Settings>(byPath.get('.nekko/settings.json'));
  if (settings && typeof settings === 'object') vault.settings = { ...settings, theme: settings.theme ?? 'light' };

  const trackers = readJson<Tracker[]>(byPath.get('.nekko/trackers.json'));
  if (Array.isArray(trackers)) vault.trackers = trackers;

  const marker = readJson<{ version?: number }>(byPath.get(VAULT_MARKER));
  if (marker?.version) vault.version = marker.version;

  for (const [path, content] of byPath) {
    if (path.startsWith('years/') && path.endsWith('.json')) {
      const year = readJson<Year>(content);
      if (year && typeof year.year === 'number') vault.years[year.year] = year;
    } else if (path.startsWith('months/') && path.endsWith('.md')) {
      const key = path.slice('months/'.length, -'.md'.length);
      if (/^\d{4}-\d{2}$/.test(key)) {
        const month = parseMonth(key, content);
        vault.months[key] = month;
        const { year } = parseMonthKey(key);
        if (!vault.years[year]) {
          const ts = month.createdAt;
          vault.years[year] = { year, goals: [], createdAt: ts, updatedAt: ts };
        }
      }
    }
  }

  return vault;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function readJson<T>(text: string | undefined): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
