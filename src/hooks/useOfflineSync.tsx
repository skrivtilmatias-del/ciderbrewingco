import { useEffect, useState } from 'react';
import { enqueueMutation } from '@/offline/queue';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const queueMutation = async (
    url: string,
    method: string,
    body: any
  ) => {
    if (!isOnline) {
      await enqueueMutation(
        url,
        method,
        {
          'Content-Type': 'application/json',
        },
        body
      );
      return { queued: true };
    }
    return null;
  };

  return { isOnline, queueMutation };
};
