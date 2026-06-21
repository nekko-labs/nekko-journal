import { openDB, type IDBPDatabase } from 'idb';
import { type Vault } from '@nekko/journal-core';

const DB_NAME = 'nekko-journal';
const STORE = 'vault';
const KEY = 'main';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
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
