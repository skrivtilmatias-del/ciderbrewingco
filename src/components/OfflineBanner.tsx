import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPendingMutations, processPendingMutations } from '@/offline/queue';
import { toast } from 'sonner';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const checkPending = async () => {
      const mutations = await getPendingMutations();
      setPendingCount(mutations.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const results = await processPendingMutations();
      if (results.success.length > 0) {
        toast.success(`Synced ${results.success.length} changes`);
      }
      if (results.failed.length > 0) {
        toast.error(`Failed to sync ${results.failed.length} changes`);
      }
      const mutations = await getPendingMutations();
      setPendingCount(mutations.length);
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <Alert className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg">
      <div className="flex items-center gap-3">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        <AlertDescription className="flex items-center gap-2">
          <span>
            {isOnline ? 'Online' : 'Offline mode'}
          </span>
          {pendingCount > 0 && (
            <>
              <Badge variant="secondary">
                {pendingCount} pending
              </Badge>
              {isOnline && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              )}
            </>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};
