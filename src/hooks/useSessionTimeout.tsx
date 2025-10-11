import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Monitor session expiration and warn users before timeout
 * Default warning: 5 minutes before expiration
 */
export function useSessionTimeout(warningMinutes: number = 5) {
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.expires_at) {
        const expiryDate = new Date(session.expires_at * 1000);
        setSessionExpiry(expiryDate);
        
        const now = new Date();
        const timeUntilExpiry = expiryDate.getTime() - now.getTime();
        const warningTime = warningMinutes * 60 * 1000;
        
        // Clear existing warning
        if (warningTimeout) clearTimeout(warningTimeout);
        
        // Set warning if expiry is in the future
        if (timeUntilExpiry > warningTime) {
          warningTimeout = setTimeout(() => {
            toast.warning('Your session will expire in 5 minutes. Please save your work.', {
              duration: 10000,
              action: {
                label: 'Refresh Session',
                onClick: async () => {
                  const { error } = await supabase.auth.refreshSession();
                  if (!error) {
                    toast.success('Session refreshed successfully');
                  }
                },
              },
            });
          }, timeUntilExpiry - warningTime);
        } else if (timeUntilExpiry > 0 && timeUntilExpiry <= warningTime) {
          // Already in warning period
          toast.warning(`Your session will expire in ${Math.ceil(timeUntilExpiry / 60000)} minutes. Please save your work.`, {
            duration: 10000,
            action: {
              label: 'Refresh Session',
              onClick: async () => {
                const { error } = await supabase.auth.refreshSession();
                if (!error) {
                  toast.success('Session refreshed successfully');
                }
              },
            },
          });
        }
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    checkInterval = setInterval(checkSession, 60000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        checkSession();
      }
    });

    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (checkInterval) clearInterval(checkInterval);
      subscription.unsubscribe();
    };
  }, [warningMinutes]);

  return sessionExpiry;
}
