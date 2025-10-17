import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const channel = supabase.channel('connection-test');

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (status === 'CHANNEL_ERROR') {
        setStatus('disconnected');
      } else {
        setStatus('connecting');
      }
    });

    // Periodic connection check
    const interval = setInterval(() => {
      const currentStatus = channel.state;
      if (currentStatus === 'joined') {
        setStatus('connected');
      } else {
        setStatus('connecting');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Live</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <AlertCircle className="h-3 w-3" />
      <span>Offline</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2"
        onClick={() => window.location.reload()}
      >
        Reconnect
      </Button>
    </div>
  );
};
