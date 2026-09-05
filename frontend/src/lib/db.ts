import { CitizenReport } from '@/types';

const DB_NAME = 'landsight_offline_db';
const STORE_NAME = 'citizen_reports';
const DB_VERSION = 1;

export class OfflineStorageManager {
  private isBrowser = typeof window !== 'undefined';

  private openDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sync_status', 'sync_status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to LocalStorage');
        resolve(null);
      };
    });
  }

  public async saveReport(report: CitizenReport): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const db = await this.openDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(report);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB save failed, using localStorage', e);
    }

    // LocalStorage Fallback
    const existing = this.getLocalStorageReports();
    const filtered = existing.filter((r) => r.id !== report.id);
    filtered.unshift(report);
    localStorage.setItem(STORE_NAME, JSON.stringify(filtered));
  }

  public async getAllReports(): Promise<CitizenReport[]> {
    if (!this.isBrowser) return [];

    try {
      const db = await this.openDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.getAll();
          request.onsuccess = () => {
            const results = (request.result as CitizenReport[]) || [];
            results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            resolve(results);
          };
          request.onerror = () => reject(request.error);
        });
      }
    } catch (e) {
      console.warn('IndexedDB read failed, reading from localStorage', e);
    }

    return this.getLocalStorageReports();
  }

  public async getPendingSyncReports(): Promise<CitizenReport[]> {
    const all = await this.getAllReports();
    return all.filter((r) => r.sync_status === 'pending_sync');
  }

  public async markReportAsSynced(reportId: string): Promise<void> {
    const all = await this.getAllReports();
    const target = all.find((r) => r.id === reportId);
    if (target) {
      target.sync_status = 'synced';
      target.status = 'Verified & Dispatched';
      await this.saveReport(target);
    }
  }

  private getLocalStorageReports(): CitizenReport[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORE_NAME);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CitizenReport[];
      return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
