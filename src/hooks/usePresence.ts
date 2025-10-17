import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PresenceUser {
  user_id: string;
  name: string;
  online_at: string;
  viewing_batch?: string;
}

export const usePresence = () => {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [myPresence, setMyPresence] = useState<PresenceUser | null>(null);

  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .filter((u: any) => u.user_id) as unknown as PresenceUser[];
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New users joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const presence: PresenceUser = {
              user_id: user.id,
              name: user.user_metadata?.full_name || user.email || 'Anonymous',
              online_at: new Date().toISOString(),
            };

            await channel.track(presence);
            setMyPresence(presence);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updatePresence = async (updates: Partial<PresenceUser>) => {
    if (!myPresence) return;

    const channel = supabase.channel('online-users');
    const updatedPresence = { ...myPresence, ...updates };
    await channel.track(updatedPresence);
    setMyPresence(updatedPresence);
  };

  return { activeUsers, myPresence, updatePresence };
};
