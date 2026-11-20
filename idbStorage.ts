import { PerformanceRecord } from '../types/athletics';

const DB_NAME = 'AthleticsDatabase_v2';
const DB_VERSION = 1;
const STORE_CHUNKS = 'chunks';
const CHUNK_SIZE = 5000;

interface ChunkRecord {
  id: number;
  count: number;
  data: PerformanceRecord[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
        db.createObjectStore(STORE_CHUNKS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IDBStorage {
  /**
   * Sauvegarde l'ensemble des performances par blocs dans IndexedDB
   */
  static async saveLargePerformances(records: PerformanceRecord[]): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CHUNKS, 'readwrite');
        const store = tx.objectStore(STORE_CHUNKS);
        store.clear();

        let chunkId = 0;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
          const slice = records.slice(i, i + CHUNK_SIZE);
          store.put({
            id: chunkId++,
            count: slice.length,
            data: slice,
          });
        }

        tx.oncomplete = () => {
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IDB save error:', e);
      return false;
    }
  }

  /**
   * Récupère l'ensemble des performances stockées
   */
  static async getLargePerformances(): Promise<PerformanceRecord[] | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CHUNKS, 'readonly');
        const store = tx.objectStore(STORE_CHUNKS);
        const request = store.getAll();

        request.onsuccess = () => {
          const chunks = request.result as ChunkRecord[];
          if (chunks && chunks.length > 0) {
            chunks.sort((a, b) => a.id - b.id);
            const flat = chunks.flatMap(c => c.data);
            resolve(flat);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IDB read error:', e);
      return null;
    }
  }

  /**
   * Vérifie si des données officielles volumineuses sont déjà présentes
   */
  static async hasLargePerformances(): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CHUNKS, 'readonly');
        const store = tx.objectStore(STORE_CHUNKS);
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result > 0);
        countReq.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Efface le stockage IndexedDB
   */
  static async clearLargePerformances(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CHUNKS, 'readwrite');
      tx.objectStore(STORE_CHUNKS).clear();
    } catch (e) {
      console.warn('IDB clear error:', e);
    }
  }
}
