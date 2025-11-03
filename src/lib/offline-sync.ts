import { createEvidenceBag, addChainOfCustodyEntry, uploadEvidencePhoto } from './supabase';
import {
  getPendingEvidenceBags,
  getPendingCustodyLogs,
  getPendingPhotos,
  markEvidenceBagSynced,
  markCustodyLogSynced,
  markPhotoSynced,
  clearSyncedItems,
  updateSyncStatus,
} from './offline-storage';
import { toast } from 'sonner';

export async function syncOfflineData(): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  try {
    // Sync evidence bags first
    const pendingBags = await getPendingEvidenceBags();
    for (const bag of pendingBags) {
      try {
        await createEvidenceBag(bag.data);
        await markEvidenceBagSynced(bag.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync evidence bag:', error);
        failedCount++;
      }
    }

    // Sync custody logs
    const pendingLogs = await getPendingCustodyLogs();
    for (const log of pendingLogs) {
      try {
        await addChainOfCustodyEntry(log.data);
        await markCustodyLogSynced(log.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync custody log:', error);
        failedCount++;
      }
    }

    // Sync photos
    const pendingPhotos = await getPendingPhotos();
    for (const photo of pendingPhotos) {
      try {
        const file = new File([photo.file], `evidence-${Date.now()}.jpg`, { type: photo.file.type });
        await uploadEvidencePhoto(photo.bagId, file, photo.notes);
        await markPhotoSynced(photo.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync photo:', error);
        failedCount++;
      }
    }

    // Clean up synced items
    if (successCount > 0) {
      await clearSyncedItems();
    }

    await updateSyncStatus();

    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: successCount, failed: failedCount };
  }
}

// Auto-sync when connection is restored
export function setupAutoSync() {
  if (typeof window === 'undefined') return;

  // Listen for online event
  window.addEventListener('online', async () => {
    toast.info('Connection restored. Syncing offline data...');
    
    const result = await syncOfflineData();
    
    if (result.success > 0) {
      toast.success(`Successfully synced ${result.success} item(s)`);
    }
    
    if (result.failed > 0) {
      toast.error(`Failed to sync ${result.failed} item(s)`);
    }
  });

  // Initial sync if online
  if (navigator.onLine) {
    syncOfflineData().then(result => {
      if (result.success > 0) {
        console.log(`Auto-synced ${result.success} offline items`);
      }
    });
  }
}

// Check if device is offline
export function isOffline(): boolean {
  return !navigator.onLine;
}
