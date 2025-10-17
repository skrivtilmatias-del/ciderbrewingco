import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Activity } from '@/types/activity.types';

const getActivityTitle = (type: string): string => {
  switch (type) {
    case 'created':
      return 'created batch';
    case 'stage_changed':
      return 'changed stage';
    case 'measurement_added':
      return 'added measurement';
    case 'note_added':
      return 'added note';
    case 'photo_uploaded':
      return 'uploaded photo';
    case 'label_printed':
      return 'printed labels';
    case 'qr_scanned':
      return 'scanned QR code';
    case 'exported':
      return 'exported data';
    case 'archived':
      return 'archived batch';
    case 'deleted':
      return 'deleted batch';
    case 'restored':
      return 'restored batch';
    case 'updated':
      return 'updated batch';
    default:
      return 'performed action';
  }
};

export const useRealtimeActivities = (batchId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to activity changes
    const channel = supabase
      .channel(`activities${batchId ? `:${batchId}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'batch_activities',
          ...(batchId && { filter: `batch_id=eq.${batchId}` }),
        },
        (payload) => {
          // Add new activity to cache
          queryClient.setQueryData(
            ['batch-activities', batchId],
            (old: any) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page: any, index: number) => {
                  // Add to first page only
                  if (index === 0) {
                    return {
                      ...page,
                      activities: [payload.new, ...page.activities],
                    };
                  }
                  return page;
                }),
              };
            }
          );

          // Show toast notification for new activity
          const activity = payload.new as Activity;
          if (activity.user_id !== user?.id) {
            toast({
              title: "New activity",
              description: getActivityTitle(activity.activity_type),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, queryClient, user?.id, toast]);
};
