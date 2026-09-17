/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';

interface ElectronAPI {
  getTransactions: () => Promise<Transaction[]>;
  saveTransactions: (txs: Transaction[]) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const DB_NAME = 'TransactionTrackerDB';
const STORE_NAME = 'transactions';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'transaction_tracker_backup_data';

let isIndexedDBSupported = true;

// Quick feature check
try {
  if (typeof window === 'undefined' || !window.indexedDB) {
    isIndexedDBSupported = false;
  }
} catch (e) {
  isIndexedDBSupported = false;
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported) {
      reject(new Error('IndexedDB is not supported or blocked in this environment.'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.warn('IndexedDB failed to open, using localStorage fallback.', event);
        isIndexedDBSupported = false;
        reject(new Error('IndexedDB failed to open'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch (err) {
      isIndexedDBSupported = false;
      reject(err);
    }
  });
}

/**
 * LocalStorage Fallback helper
 */
const fallbackStore = {
  getAll(): Transaction[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('LocalStorage failed to read:', e);
      return [];
    }
  },
  saveAll(txs: Transaction[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(txs));
    } catch (e) {
      console.error('LocalStorage failed to write:', e);
    }
  }
};

/**
 * Load all transactions from storage
 */
export async function getTransactions(): Promise<Transaction[]> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      return await window.electronAPI.getTransactions();
    } catch (e) {
      console.warn('Electron IPC getTransactions failed, falling back to local DB:', e);
    }
  }

  if (!isIndexedDBSupported) {
    return fallbackStore.getAll();
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by date or default order
        const data = request.result || [];
        resolve(data);
      };

      request.onerror = () => {
        console.warn('IndexedDB read failed, falling back to localStorage');
        resolve(fallbackStore.getAll());
      };
    });
  } catch (e) {
    console.warn('IndexedDB read crashed, falling back to localStorage', e);
    isIndexedDBSupported = false;
    return fallbackStore.getAll();
  }
}

/**
 * Save multiple transactions (bulk put)
 */
export async function saveTransactions(txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;

  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.saveTransactions(txs);
      return;
    } catch (e) {
      console.warn('Electron IPC saveTransactions failed, falling back to local DB:', e);
    }
  }

  if (!isIndexedDBSupported) {
    const existing = fallbackStore.getAll();
    const map = new Map(existing.map((t) => [t.id, t]));
    txs.forEach((t) => map.set(t.id, t));
    fallbackStore.saveAll(Array.from(map.values()));
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (e) => {
        console.error('IndexedDB write transaction failed:', e);
        reject(new Error('IndexedDB write error'));
      };

      txs.forEach((tx) => {
        store.put(tx);
      });
    });
  } catch (e) {
    console.warn('IndexedDB write crashed, falling back to localStorage', e);
    isIndexedDBSupported = false;
    // Fallback sync
    const existing = fallbackStore.getAll();
    const map = new Map(existing.map((t) => [t.id, t]));
    txs.forEach((t) => map.set(t.id, t));
    fallbackStore.saveAll(Array.from(map.values()));
  }
}

/**
 * Save / Update a single transaction
 */
export async function saveTransaction(tx: Transaction): Promise<void> {
  return saveTransactions([tx]);
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(id: string): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.deleteTransaction(id);
      return;
    } catch (e) {
      console.warn('Electron IPC deleteTransaction failed, falling back to local DB:', e);
    }
  }

  if (!isIndexedDBSupported) {
    const existing = fallbackStore.getAll();
    const filtered = existing.filter((t) => t.id !== id);
    fallbackStore.saveAll(filtered);
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Delete request failed'));
      };
    });
  } catch (e) {
    console.warn('IndexedDB delete crashed, falling back to localStorage', e);
    isIndexedDBSupported = false;
    const existing = fallbackStore.getAll();
    const filtered = existing.filter((t) => t.id !== id);
    fallbackStore.saveAll(filtered);
  }
}

/**
 * Clear all transactions
 */
export async function clearAllTransactions(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.clearAllTransactions();
      return;
    } catch (e) {
      console.warn('Electron IPC clearAllTransactions failed, falling back to local DB:', e);
    }
  }

  fallbackStore.saveAll([]);
  if (!isIndexedDBSupported) {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Clear request failed'));
      };
    });
  } catch (e) {
    isIndexedDBSupported = false;
  }
}
