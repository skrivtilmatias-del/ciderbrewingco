import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryConfig';

/**
 * Activity type definitions
 */
export type ActivityType =
  | 'stage_change'
  | 'measurement'
  | 'note'
  | 'blend_created'
  | 'label_printed'
  | 'qr_scanned'
  | 'export'
  | 'user_assigned'
  | 'batch_created'
  | 'batch_updated';

/**
 * Activity item with normalized structure
 */
export interface ActivityItem {
  id: string;
  batchId: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  attachments?: string[];
}

/**
 * Filter options for activity feed
 */
export interface ActivityFilters {
  types: ActivityType[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  userId?: string;
  searchQuery: string;
}

/**
 * useBatchActivityFeed - Fetch and manage batch activity data
 * 
 * Features:
 * - Combines data from multiple sources (logs, history, blends)
 * - Real-time updates via Supabase subscriptions
 * - Infinite scroll pagination
 * - Advanced filtering and search
 * - Activity type categorization
 * 
 * @param batchId - Batch to fetch activities for (null = all batches)
 * @param filters - Activity filters
 * @param pageSize - Number of items per page (default: 20)
 * 
 * @returns Activity data and control functions
 */
export const useBatchActivityFeed = (
  batchId: string | null,
  filters: ActivityFilters,
  pageSize: number = 20
) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  
  // Debounce search query for performance
  const debouncedSearch = useDebounce(filters.searchQuery, 300);

  /**
   * Fetch batch logs (measurements, notes, observations)
   */
  const { data: logs = [] } = useQuery({
    queryKey: queryKeys.batchLogs.byBatch(batchId || 'all'),
    queryFn: async () => {
      let query = supabase
        .from('batch_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  /**
   * Fetch batch history (stage changes)
   */
  const { data: history = [] } = useQuery({
    queryKey: ['batch-history', batchId],
    queryFn: async () => {
      let query = supabase
        .from('batch_history')
        .select(`
          *,
          batches!inner (
            id,
            name,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  /**
   * Fetch blend components (when batch is used in blends)
   */
  const { data: blendComponents = [] } = useQuery({
    queryKey: ['blend-components', batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from('blend_components')
        .select(`
          *,
          blend_batches!inner (
            id,
            name,
            user_id,
            created_at
          )
        `)
        .eq('source_batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!batchId,
  });

  /**
   * Transform and combine all activities into unified format
   */
  const allActivities = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Transform batch logs
    logs.forEach(log => {
      const hasMeasurements = log.og || log.ph || log.temp_c || log.fg || log.ta_gpl;
      
      activities.push({
        id: log.id,
        batchId: log.batch_id,
        type: hasMeasurements ? 'measurement' : 'note',
        userId: log.user_id,
        userName: (log.profiles as any)?.full_name || 'Unknown User',
        userEmail: (log.profiles as any)?.email || '',
        timestamp: log.created_at,
        title: log.title || (hasMeasurements ? 'Measurement Added' : 'Note Added'),
        description: log.content || '',
        metadata: {
          role: log.role,
          stage: log.stage,
          og: log.og,
          fg: log.fg,
          ph: log.ph,
          temp_c: log.temp_c,
          ta_gpl: log.ta_gpl,
          tags: log.tags,
        },
        attachments: log.attachments,
      });
    });

    // Transform batch history (stage changes)
    history.forEach(item => {
      activities.push({
        id: item.id,
        batchId: item.batch_id,
        type: 'stage_change',
        userId: (item.batches as any)?.user_id || '',
        userName: 'System',
        userEmail: '',
        timestamp: item.created_at,
        title: 'Stage Changed',
        description: item.notes || `Stage changed to ${item.stage}`,
        metadata: {
          stage: item.stage,
        },
      });
    });

    // Transform blend components
    blendComponents.forEach(component => {
      const blend = component.blend_batches as any;
      activities.push({
        id: component.id,
        batchId: batchId!,
        type: 'blend_created',
        userId: blend.user_id,
        userName: 'System',
        userEmail: '',
        timestamp: component.created_at,
        title: 'Used in Blend',
        description: `Batch was used in blend "${blend.name}"`,
        metadata: {
          blendId: blend.id,
          blendName: blend.name,
          percentage: component.percentage,
          volume: component.volume_liters,
        },
      });
    });

    return activities;
  }, [logs, history, blendComponents, batchId]);

  /**
   * Apply filters to activities
   */
  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

    // Filter by activity types
    if (filters.types.length > 0) {
      filtered = filtered.filter(activity => filters.types.includes(activity.type));
    }

    // Filter by date range
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        
        if (filters.dateRange.from && activityDate < filters.dateRange.from) {
          return false;
        }
        
        if (filters.dateRange.to) {
          const endOfDay = new Date(filters.dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (activityDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Filter by user
    if (filters.userId) {
      filtered = filtered.filter(activity => activity.userId === filters.userId);
    }

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.userName.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [allActivities, filters, debouncedSearch]);

  /**
   * Paginate activities
   */
  const paginatedActivities = useMemo(() => {
    const start = 0;
    const end = (page + 1) * pageSize;
    return filteredActivities.slice(start, end);
  }, [filteredActivities, page, pageSize]);

  /**
   * Check if there are more activities to load
   */
  const hasMore = paginatedActivities.length < filteredActivities.length;

  /**
   * Load next page
   */
  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore]);

  /**
   * Reset pagination when filters change
   */
  useEffect(() => {
    setPage(0);
  }, [filters, debouncedSearch]);

  /**
   * Set up real-time subscriptions for updates
   */
  useEffect(() => {
    if (!batchId) return;

    const channel = supabase
      .channel(`batch-activity-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_logs',
          filter: `batch_id=eq.${batchId}`,
        },
        () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.byBatch(batchId) });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_history',
          filter: `batch_id=eq.${batchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['batch-history', batchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, queryClient]);

  return {
    /** Paginated activities to display */
    activities: paginatedActivities,
    /** Total number of filtered activities */
    totalCount: filteredActivities.length,
    /** Whether there are more activities to load */
    hasMore,
    /** Load next page of activities */
    loadMore,
    /** Current page number */
    page,
    /** Reset pagination */
    reset: () => setPage(0),
    /** Whether data is loading */
    isLoading: false, // Queries handle their own loading states
  };
};

/**
 * Get unique users from activities for filtering
 */
export const getUniqueUsers = (activities: ActivityItem[]) => {
  const userMap = new Map<string, { id: string; name: string; email: string }>();
  
  activities.forEach(activity => {
    if (!userMap.has(activity.userId)) {
      userMap.set(activity.userId, {
        id: activity.userId,
        name: activity.userName,
        email: activity.userEmail,
      });
    }
  });
  
  return Array.from(userMap.values());
};
