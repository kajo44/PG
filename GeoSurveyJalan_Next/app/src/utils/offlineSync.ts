import { RoadLink, SurveyPhoto } from '../types/pkrms';

const STORAGE_KEYS = {
  PHOTOS: 'pkrms_photos_cache',
  ROADS: 'pkrms_roads_cache',
  PENDING_SYNC: 'pkrms_pending_sync_queue',
  SETTINGS: 'pkrms_user_settings',
};

export interface PendingSyncItem {
  id: string;
  type: 'PHOTO_EVALUATION' | 'TRACK_EDIT' | 'NEW_PHOTO';
  payload: any;
  timestamp: string;
}

export function savePhotosToLocal(photos: SurveyPhoto[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  } catch (e) {
    console.warn('LocalStorage limit reached or disabled', e);
  }
}

export function loadPhotosFromLocal(): SurveyPhoto[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function queueForCloudSync(item: PendingSyncItem): void {
  try {
    const existing: PendingSyncItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]'
    );
    existing.push(item);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to queue offline item', e);
  }
}

export function getPendingSyncCount(): number {
  try {
    const existing = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]'
    );
    return existing.length;
  } catch (e) {
    return 0;
  }
}

export function clearSyncQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  } catch (e) {
    console.error(e);
  }
}
