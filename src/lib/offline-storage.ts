import { openDB, IDBPDatabase } from 'idb';
import { EvidenceBag, ChainOfCustodyLog } from './supabase';

let db: IDBPDatabase | null = null;

export async function initOfflineDB() {
  if (db) return db;

  db = await openDB('evidence-offline', 1, {
    upgrade(database) {
      // Store for pending evidence bags
      if (!database.objectStoreNames.contains('pendingEvidenceBags')) {
        const evidenceStore = database.createObjectStore('pendingEvidenceBags', { keyPath: 'id' });
        evidenceStore.createIndex('timestamp', 'timestamp');
        evidenceStore.createIndex('synced', 'synced');
      }

      // Store for pending custody logs
      if (!database.objectStoreNames.contains('pendingCustodyLogs')) {
        const custodyStore = database.createObjectStore('pendingCustodyLogs', { keyPath: 'id' });
        custodyStore.createIndex('timestamp', 'timestamp');
        custodyStore.createIndex('synced', 'synced');
      }

      // Store for pending photos
      if (!database.objectStoreNames.contains('pendingPhotos')) {
        const photoStore = database.createObjectStore('pendingPhotos', { keyPath: 'id' });
        photoStore.createIndex('bagId', 'bagId');
        photoStore.createIndex('timestamp', 'timestamp');
        photoStore.createIndex('synced', 'synced');
      }

      // Store for sync status
      if (!database.objectStoreNames.contains('syncStatus')) {
        database.createObjectStore('syncStatus', { keyPath: 'key' });
      }
    },
  });

  return db;
}

// Evidence Bag Operations
export async function saveOfflineEvidenceBag(data: Omit<EvidenceBag, 'id' | 'created_at' | 'updated_at'>) {
  const database = await initOfflineDB();
  const id = `offline-bag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await database.add('pendingEvidenceBags', {
    id,
    data,
    timestamp: Date.now(),
    synced: false,
  });

  await updateSyncStatus();
  return id;
}

export async function getPendingEvidenceBags() {
  const database = await initOfflineDB();
  return await database.getAllFromIndex('pendingEvidenceBags', 'synced', IDBKeyRange.only(0));
}

export async function markEvidenceBagSynced(id: string) {
  const database = await initOfflineDB();
  const item = await database.get('pendingEvidenceBags', id);
  if (item) {
    item.synced = true;
    await database.put('pendingEvidenceBags', item);
    await updateSyncStatus();
  }
}

export async function deleteEvidenceBag(id: string) {
  const database = await initOfflineDB();
  await database.delete('pendingEvidenceBags', id);
  await updateSyncStatus();
}

// Custody Log Operations
export async function saveOfflineCustodyLog(data: Omit<ChainOfCustodyLog, 'id' | 'created_at'>) {
  const database = await initOfflineDB();
  const id = `offline-custody-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await database.add('pendingCustodyLogs', {
    id,
    data,
    timestamp: Date.now(),
    synced: false,
  });

  await updateSyncStatus();
  return id;
}

export async function getPendingCustodyLogs() {
  const database = await initOfflineDB();
  return await database.getAllFromIndex('pendingCustodyLogs', 'synced', IDBKeyRange.only(0));
}

export async function markCustodyLogSynced(id: string) {
  const database = await initOfflineDB();
  const item = await database.get('pendingCustodyLogs', id);
  if (item) {
    item.synced = true;
    await database.put('pendingCustodyLogs', item);
    await updateSyncStatus();
  }
}

export async function deleteCustodyLog(id: string) {
  const database = await initOfflineDB();
  await database.delete('pendingCustodyLogs', id);
  await updateSyncStatus();
}

// Photo Operations
export async function saveOfflinePhoto(bagId: string, file: Blob, notes?: string) {
  const database = await initOfflineDB();
  const id = `offline-photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await database.add('pendingPhotos', {
    id,
    bagId,
    file,
    notes,
    timestamp: Date.now(),
    synced: false,
  });

  await updateSyncStatus();
  return id;
}

export async function getPendingPhotos() {
  const database = await initOfflineDB();
  return await database.getAllFromIndex('pendingPhotos', 'synced', IDBKeyRange.only(0));
}

export async function markPhotoSynced(id: string) {
  const database = await initOfflineDB();
  const item = await database.get('pendingPhotos', id);
  if (item) {
    item.synced = true;
    await database.put('pendingPhotos', item);
    await updateSyncStatus();
  }
}

export async function deletePhoto(id: string) {
  const database = await initOfflineDB();
  await database.delete('pendingPhotos', id);
  await updateSyncStatus();
}

// Sync Status
export async function updateSyncStatus() {
  const database = await initOfflineDB();
  
  const pendingBags = await database.countFromIndex('pendingEvidenceBags', 'synced', IDBKeyRange.only(0));
  const pendingLogs = await database.countFromIndex('pendingCustodyLogs', 'synced', IDBKeyRange.only(0));
  const pendingPhotos = await database.countFromIndex('pendingPhotos', 'synced', IDBKeyRange.only(0));
  
  await database.put('syncStatus', {
    key: 'main',
    lastSync: Date.now(),
    pendingCount: pendingBags + pendingLogs + pendingPhotos,
  });
}

export async function getSyncStatus() {
  const database = await initOfflineDB();
  const status = await database.get('syncStatus', 'main');
  return status as { key: string; lastSync: number; pendingCount: number } || { key: 'main', lastSync: 0, pendingCount: 0 };
}

// Clear all synced items
export async function clearSyncedItems() {
  const database = await initOfflineDB();
  
  const syncedBags = await database.getAllFromIndex('pendingEvidenceBags', 'synced', IDBKeyRange.only(1));
  for (const bag of syncedBags) {
    await database.delete('pendingEvidenceBags', bag.id);
  }
  
  const syncedLogs = await database.getAllFromIndex('pendingCustodyLogs', 'synced', IDBKeyRange.only(1));
  for (const log of syncedLogs) {
    await database.delete('pendingCustodyLogs', log.id);
  }
  
  const syncedPhotos = await database.getAllFromIndex('pendingPhotos', 'synced', IDBKeyRange.only(1));
  for (const photo of syncedPhotos) {
    await database.delete('pendingPhotos', photo.id);
  }
  
  await updateSyncStatus();
}
