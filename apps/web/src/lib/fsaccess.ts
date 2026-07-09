import {
  type Vault,
  type VaultFile,
  serializeVaultToFiles,
  parseVaultFromFiles,
  VAULT_MARKER,
} from '@nekko/journal-core';
import { saveFolderHandle, loadFolderHandle, clearFolderHandle } from './idb';

// File System Access glue: open a real local folder as the vault and read/write
// the human-browsable folder-of-files layout (see core/vaultfiles.ts). The
// format lives in DOM-free core; this file only does the I/O. Everything here
// degrades gracefully: on browsers without the API, isFsSupported() is false and
// the app stays on its IndexedDB snapshot.

// The API is Chromium-only and not yet in every TS lib; keep the surface local.
interface FsWritable {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}
interface FsFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FsWritable>;
}
interface FsDirHandle {
  name: string;
  kind: 'directory';
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FsDirHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle>;
  removeEntry?(name: string, opts?: { recursive?: boolean }): Promise<void>;
  values(): AsyncIterable<FsDirHandle | FsFileHandle>;
  queryPermission?(opts?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(opts?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  entries?(): AsyncIterable<[string, FsDirHandle | FsFileHandle]>;
}

type WindowWithFs = Window & {
  showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FsDirHandle>;
};

export function isFsSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** Prompt the user to pick a folder. Returns null if they cancel. */
export async function pickVaultFolder(): Promise<FsDirHandle | null> {
  const w = window as WindowWithFs;
  if (!w.showDirectoryPicker) return null;
  try {
    return await w.showDirectoryPicker({ mode: 'readwrite' });
  } catch {
    return null; // user cancelled
  }
}

async function ensurePermission(handle: FsDirHandle): Promise<boolean> {
  if (!handle.queryPermission) return true; // older impls grant implicitly
  const opts = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (handle.requestPermission && (await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/** Walk a directory tree into a flat VaultFile list (only the folders we own). */
async function readTree(dir: FsDirHandle, prefix = ''): Promise<VaultFile[]> {
  const out: VaultFile[] = [];
  for await (const entry of dir.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      out.push(...(await readTree(entry as FsDirHandle, path)));
    } else {
      const file = await (entry as FsFileHandle).getFile();
      out.push({ path, content: await file.text() });
    }
  }
  return out;
}

async function writeFile(root: FsDirHandle, path: string, content: string): Promise<void> {
  const parts = path.split('/');
  const name = parts.pop()!;
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/** Does this folder already contain a Nekko Journal vault? */
export async function folderHasVault(handle: FsDirHandle): Promise<boolean> {
  try {
    const nekko = await handle.getDirectoryHandle('.nekko');
    await nekko.getFileHandle('vault.json');
    return true;
  } catch {
    return false;
  }
}

export async function readVaultFromFolder(handle: FsDirHandle): Promise<Vault | null> {
  if (!(await ensurePermission(handle))) return null;
  const files = await readTree(handle);
  if (!files.some((f) => f.path.replace(/\\/g, '/') === VAULT_MARKER)) return null;
  return parseVaultFromFiles(files);
}

export async function writeVaultToFolder(handle: FsDirHandle, vault: Vault): Promise<void> {
  if (!(await ensurePermission(handle))) throw new Error('Folder permission denied');
  const files = serializeVaultToFiles(vault);
  // Write sequentially — a folder handle isn't safe for heavy parallel writes.
  for (const f of files) await writeFile(handle, f.path, f.content);
}

// --- persisted handle across reloads -------------------------------------

export async function rememberFolder(handle: FsDirHandle): Promise<void> {
  await saveFolderHandle(handle);
}

export async function forgetFolder(): Promise<void> {
  await clearFolderHandle();
}

/**
 * The previously-connected folder, if the browser still has (or will re-grant)
 * permission. Returns null when there's no saved folder or access is gone.
 */
export async function restoreFolder(): Promise<FsDirHandle | null> {
  const handle = await loadFolderHandle<FsDirHandle>();
  if (!handle) return null;
  if (!handle.queryPermission) return handle;
  try {
    const state = await handle.queryPermission({ mode: 'readwrite' });
    return state === 'granted' ? handle : handle; // keep handle; re-request on first use
  } catch {
    return null;
  }
}

export type { FsDirHandle };
