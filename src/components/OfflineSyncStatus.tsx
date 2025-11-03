import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudOff, Cloud, RefreshCw, Database, Clock } from 'lucide-react';
import { getSyncStatus } from '@/lib/offline-storage';
import { syncOfflineData, isOffline } from '@/lib/offline-sync';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function OfflineSyncStatus() {
  const [offline, setOffline] = useState(isOffline());
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ lastSync: 0, pendingCount: 0 });

  useEffect(() => {
    loadSyncStatus();

    const handleOnline = () => {
      setOffline(false);
      loadSyncStatus();
    };

    const handleOffline = () => {
      setOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll for sync status every 10 seconds
    const interval = setInterval(loadSyncStatus, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleManualSync = async () => {
    if (offline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncOfflineData();
      
      if (result.success > 0) {
        toast.success(`Successfully synced ${result.success} item(s)`);
      } else if (result.failed === 0 && result.success === 0) {
        toast.info('No items to sync');
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to sync ${result.failed} item(s)`);
      }

      await loadSyncStatus();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (syncStatus.pendingCount === 0 && !offline) {
    return null; // Don't show if nothing to sync and online
  }

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {offline ? (
            <>
              <CloudOff className="h-4 w-4 text-destructive" />
              Offline Mode
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4 text-success" />
              Sync Status
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span>Pending Items:</span>
          </div>
          <Badge variant={syncStatus.pendingCount > 0 ? 'destructive' : 'secondary'}>
            {syncStatus.pendingCount}
          </Badge>
        </div>

        {syncStatus.lastSync > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last sync:</span>
            </div>
            <span>{formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })}</span>
          </div>
        )}

        {syncStatus.pendingCount > 0 && (
          <Button
            onClick={handleManualSync}
            disabled={syncing || offline}
            className="w-full"
            size="sm"
            variant={offline ? 'outline' : 'default'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : offline ? 'Sync When Online' : 'Sync Now'}
          </Button>
        )}

        {offline && (
          <p className="text-xs text-muted-foreground">
            You're working offline. Data will sync automatically when connection is restored.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
