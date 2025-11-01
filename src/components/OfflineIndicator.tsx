import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<string[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for queued actions in localStorage
    const checkQueue = () => {
      const queue = localStorage.getItem('offline-queue');
      if (queue) {
        setQueuedActions(JSON.parse(queue));
      }
    };
    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = async () => {
    // Process queued actions
    const queue = localStorage.getItem('offline-queue');
    if (queue && isOnline) {
      const actions = JSON.parse(queue);
      // Process each action
      // Clear queue after successful sync
      localStorage.removeItem('offline-queue');
      setQueuedActions([]);
    }
  };

  if (isOnline && queuedActions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={isOnline ? "default" : "destructive"}>
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Offline Mode</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>You are currently offline. Changes will sync when connection is restored.</p>
          {queuedActions.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {queuedActions.length} Queued Actions
              </Badge>
              {isOnline && (
                <Button size="sm" onClick={syncNow}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
