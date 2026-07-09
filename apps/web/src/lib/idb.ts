import { openDB, type IDBPDatabase } from 'idb';
import { type Vault } from '@nekko/journal-core';

const DB_NAME = 'nekko-journal';
const STORE = 'vault';
const HANDLE_STORE = 'handles';
const KEY = 'main';
const FOLDER_KEY = 'vault-folder';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
        if (!database.objectStoreNames.contains(HANDLE_STORE)) {
          database.createObjectStore(HANDLE_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Persist the connected vault-folder handle so it survives reloads. */
export async function saveFolderHandle(handle: unknown): Promise<void> {
  const d = await db();
  await d.put(HANDLE_STORE, handle, FOLDER_KEY);
}

export async function loadFolderHandle<T = unknown>(): Promise<T | null> {
  try {
    const d = await db();
    return ((await d.get(HANDLE_STORE, FOLDER_KEY)) as T) ?? null;
  } catch {
    return null;
  }
}

export async function clearFolderHandle(): Promise<void> {
  const d = await db();
  await d.delete(HANDLE_STORE, FOLDER_KEY);
}

export async function loadVault(): Promise<Vault | null> {
  try {
    const d = await db();
    return (await d.get(STORE, KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveVault(vault: Vault): Promise<void> {
  const d = await db();
  await d.put(STORE, vault, KEY);
}

export async function clearVault(): Promise<void> {
  const d = await db();
  await d.delete(STORE, KEY);
}
