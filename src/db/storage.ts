import type {
  BackupPayload,
  Client,
  PreDrillingPoint,
  Well,
  WellAction,
} from '../types/models';

const DB_NAME = 'well_management_offline_db';
const DB_VERSION = 1;

const STORES = {
  clients: 'clients',
  wells: 'wells',
  actions: 'actions',
  surveyPoints: 'surveyPoints',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

const LS_FALLBACK_KEY = 'well_management_offline_snapshot_v1';

export interface AppDatabaseState {
  clients: Client[];
  wells: Well[];
  actions: WellAction[];
  surveyPoints: PreDrillingPoint[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.clients)) {
        db.createObjectStore(STORES.clients, {keyPath: 'id'});
      }
      if (!db.objectStoreNames.contains(STORES.wells)) {
        const wellStore = db.createObjectStore(STORES.wells, {keyPath: 'id'});
        wellStore.createIndex('clientId', 'clientId', {unique: false});
      }
      if (!db.objectStoreNames.contains(STORES.actions)) {
        const actionStore = db.createObjectStore(STORES.actions, {keyPath: 'id'});
        actionStore.createIndex('wellId', 'wellId', {unique: false});
        actionStore.createIndex('clientId', 'clientId', {unique: false});
      }
      if (!db.objectStoreNames.contains(STORES.surveyPoints)) {
        const pointStore = db.createObjectStore(STORES.surveyPoints, {keyPath: 'id'});
        pointStore.createIndex('clientId', 'clientId', {unique: false});
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function readAllFromStore<T>(db: IDBDatabase, storeName: StoreName): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error(`Failed reading ${storeName}`));
  });
}

function saveSnapshotFallback(state: AppDatabaseState): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors on fallback mirror
  }
}

function loadSnapshotFallback(): AppDatabaseState {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) {
      return {clients: [], wells: [], actions: [], surveyPoints: []};
    }
    const parsed = JSON.parse(raw) as Partial<AppDatabaseState>;
    return {
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      wells: Array.isArray(parsed.wells) ? parsed.wells : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      surveyPoints: Array.isArray(parsed.surveyPoints) ? parsed.surveyPoints : [],
    };
  } catch {
    return {clients: [], wells: [], actions: [], surveyPoints: []};
  }
}

export async function loadAllData(): Promise<AppDatabaseState> {
  try {
    const db = await openDB();
    const [clients, wells, actions, surveyPoints] = await Promise.all([
      readAllFromStore<Client>(db, STORES.clients),
      readAllFromStore<Well>(db, STORES.wells),
      readAllFromStore<WellAction>(db, STORES.actions),
      readAllFromStore<PreDrillingPoint>(db, STORES.surveyPoints),
    ]);
    db.close();
    const state = {clients, wells, actions, surveyPoints};
    saveSnapshotFallback(state);
    return state;
  } catch {
    return loadSnapshotFallback();
  }
}

export async function putRecord<T extends {id: string}>(
  storeName: StoreName,
  record: T,
  nextSnapshot: AppDatabaseState
): Promise<void> {
  saveSnapshotFallback(nextSnapshot);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Already persisted in localStorage fallback
  }
}

export async function deleteRecord(
  storeName: StoreName,
  id: string,
  nextSnapshot: AppDatabaseState
): Promise<void> {
  saveSnapshotFallback(nextSnapshot);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Already persisted in localStorage fallback
  }
}

export async function replaceAllData(state: AppDatabaseState): Promise<void> {
  saveSnapshotFallback(state);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [STORES.clients, STORES.wells, STORES.actions, STORES.surveyPoints],
        'readwrite'
      );

      const clientStore = tx.objectStore(STORES.clients);
      const wellStore = tx.objectStore(STORES.wells);
      const actionStore = tx.objectStore(STORES.actions);
      const pointStore = tx.objectStore(STORES.surveyPoints);

      clientStore.clear();
      wellStore.clear();
      actionStore.clear();
      pointStore.clear();

      for (const c of state.clients) clientStore.put(c);
      for (const w of state.wells) wellStore.put(w);
      for (const a of state.actions) actionStore.put(a);
      for (const p of state.surveyPoints) pointStore.put(p);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Already persisted in localStorage fallback
  }
}

export function buildBackupPayload(state: AppDatabaseState): BackupPayload {
  return {
    app: 'well-management',
    version: 1,
    exportedAt: new Date().toISOString(),
    clients: state.clients,
    wells: state.wells,
    actions: state.actions,
    surveyPoints: state.surveyPoints,
  };
}

export function parseAndValidateBackup(rawJson: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('الملف غير صالح ولا يحتوي على صيغة JSON صحيحة.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('بنية ملف النسخة الاحتياطية غير صالحة.');
  }

  const data = parsed as Partial<BackupPayload>;
  if (
    !Array.isArray(data.clients) ||
    !Array.isArray(data.wells) ||
    !Array.isArray(data.actions) ||
    !Array.isArray(data.surveyPoints)
  ) {
    throw new Error('ملف النسخة الاحتياطية يفتقد أحد الجداول الأساسية (العملاء، الآبار، الأجراءات، أو النقاط).');
  }

  // Basic structural checks on records
  for (const c of data.clients) {
    if (!c || typeof c.id !== 'string' || typeof c.name !== 'string' || typeof c.phone !== 'string') {
      throw new Error('بيانات أحد العملاء غير مكتملة في ملف النسخة الاحتياطية.');
    }
  }
  for (const w of data.wells) {
    if (!w || typeof w.id !== 'string' || typeof w.clientId !== 'string' || typeof w.name !== 'string') {
      throw new Error('بيانات أحد الآبار غير مكتملة في ملف النسخة الاحتياطية.');
    }
  }
  for (const a of data.actions) {
    if (!a || typeof a.id !== 'string' || typeof a.wellId !== 'string') {
      throw new Error('بيانات أحد الأجراءات غير مكتملة في ملف النسخة الاحتياطية.');
    }
  }
  for (const p of data.surveyPoints) {
    if (!p || typeof p.id !== 'string' || typeof p.clientId !== 'string') {
      throw new Error('بيانات إحدى نقاط المسح غير مكتملة في ملف النسخة الاحتياطية.');
    }
  }

  return {
    app: 'well-management',
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    clients: data.clients,
    wells: data.wells,
    actions: data.actions,
    surveyPoints: data.surveyPoints,
  };
}
