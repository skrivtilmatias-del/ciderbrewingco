import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Activity } from '@/types/activity.types';

const ACTIVITIES_PER_PAGE = 20;

export const useBatchActivities = (batchId?: string) => {
  return useInfiniteQuery({
    queryKey: ['batch-activities', batchId],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('batch_activities')
        .select(`
          *,
          comments:activity_comments(
            id,
            comment,
            created_at,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * ACTIVITIES_PER_PAGE, (pageParam + 1) * ACTIVITIES_PER_PAGE - 1);

      // Filter by batch if provided
      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        activities: data as Activity[],
        nextPage: data.length === ACTIVITIES_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get activity statistics
export const useActivityStats = (batchId?: string) => {
  return useQuery({
    queryKey: ['activity-stats', batchId],
    queryFn: async () => {
      let query = supabase
        .from('batch_activities')
        .select('activity_type');

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by activity type
      const stats = data.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return stats;
    },
  });
};
