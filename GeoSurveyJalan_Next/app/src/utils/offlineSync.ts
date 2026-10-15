import { SurveyPhoto } from '../types/pkrms';

const STORAGE_KEYS = {
  PHOTOS: 'pkrms_photos_cache',
  PENDING_SYNC: 'pkrms_pending_sync_queue',
};

const DB_NAME = 'geosurvey-jalan-next-local';
const DB_VERSION = 1;
const STORE_NAME = 'records';

export interface PendingSyncItem {
  id: string;
  type: 'PHOTO_EVALUATION' | 'TRACK_EDIT' | 'NEW_PHOTO';
  payload: unknown;
  timestamp: string;
}

interface StoredRecord<T> {
  key: string;
  value: T;
}

function openLocalDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB tidak tersedia di lingkungan ini.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka IndexedDB.'));
    request.onblocked = () => reject(new Error('Database lokal diblokir oleh tab aplikasi lain.'));
  });
}

async function readIndexedRecord<T>(key: string): Promise<T | null> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      const record = request.result as StoredRecord<T> | undefined;
      resolve(record?.value ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error('Gagal membaca IndexedDB.'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Transaksi baca IndexedDB gagal.'));
    };
  });
}

async function writeIndexedRecord<T>(key: string, value: T): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ key, value } satisfies StoredRecord<T>);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Transaksi tulis IndexedDB gagal.'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error('Transaksi tulis IndexedDB dibatalkan.'));
    };
  });
}

function readLegacyPhotos(): SurveyPhoto[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as SurveyPhoto[] : null;
  } catch {
    return null;
  }
}

/**
 * Loads photos from IndexedDB, migrating the previous localStorage cache once.
 * Returns null when no saved photo set exists.
 */
export async function loadPhotosFromLocal(): Promise<SurveyPhoto[] | null> {
  const legacyPhotos = readLegacyPhotos();

  try {
    const cached = await readIndexedRecord<SurveyPhoto[]>(STORAGE_KEYS.PHOTOS);
    if (cached !== null && Array.isArray(cached)) return cached;

    if (legacyPhotos !== null) {
      await writeIndexedRecord(STORAGE_KEYS.PHOTOS, legacyPhotos);
      try {
        localStorage.removeItem(STORAGE_KEYS.PHOTOS);
      } catch {
        // Migration is still valid in IndexedDB even if cleanup is blocked.
      }
      return legacyPhotos;
    }
    return null;
  } catch (error) {
    console.warn('IndexedDB tidak tersedia; mencoba cache localStorage lama.', error);
    return legacyPhotos;
  }
}

/**
 * Persists photo records in IndexedDB to avoid localStorage's small quota.
 * Falls back to localStorage for small datasets and reports whether saving worked.
 */
export async function savePhotosToLocal(photos: SurveyPhoto[]): Promise<boolean> {
  try {
    await writeIndexedRecord(STORAGE_KEYS.PHOTOS, photos);
    return true;
  } catch (indexedDbError) {
    try {
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
      console.warn('Foto disimpan di localStorage fallback; kapasitasnya terbatas.', indexedDbError);
      return true;
    } catch (localStorageError) {
      console.error('Gagal menyimpan foto ke IndexedDB maupun localStorage.', {
        indexedDbError,
        localStorageError,
      });
      return false;
    }
  }
}

export function queueForCloudSync(item: PendingSyncItem): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]';
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Format antrean sinkronisasi lokal tidak valid.');
    }
    const existing = parsed as PendingSyncItem[];
    existing.push(item);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Gagal menyimpan perubahan ke antrean lokal.', error);
    return false;
  }
}

export function getPendingSyncCount(): number {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Kept for explicit maintenance only. Do not call after a sync attempt unless
 * the backend has acknowledged the corresponding items.
 */
export function clearSyncQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  } catch (error) {
    console.error('Gagal membersihkan antrean lokal.', error);
  }
}
