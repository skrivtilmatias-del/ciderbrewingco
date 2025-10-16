import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';
import type { Batch } from '@/components/BatchCard';

/**
 * Smart Prefetching Utilities
 * 
 * Strategy: Stay one step ahead of user actions
 * - Prefetch on hover (batch cards, tabs)
 * - Prefetch adjacent items (next 3 batches)
 * - Use React Query's built-in deduplication
 * 
 * Benefits:
 * - Instant navigation feeling
 * - Reduced perceived latency
 * - Better UX without wasting bandwidth
 */

/**
 * Prefetch batch details on hover
 * Only fetches if data is not already fresh in cache
 * 
 * @param queryClient - React Query client
 * @param batchId - ID of batch to prefetch
 */
export const prefetchBatchDetails = async (
  queryClient: QueryClient,
  batchId: string
) => {
  // React Query automatically checks if data is fresh
  // If it's already in cache and not stale, this is a no-op
  await queryClient.prefetchQuery({
    queryKey: queryKeys.batches.byId(batchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        variety: data.variety,
        apple_origin: data.apple_origin || undefined,
        volume: parseFloat(data.volume.toString()),
        startDate: data.started_at,
        currentStage: data.current_stage as Batch['currentStage'],
        progress: data.progress,
        notes: data.notes || undefined,
        attachments: data.attachments || undefined,
        yeast_type: data.yeast_type || undefined,
        target_og: data.target_og ? parseFloat(data.target_og.toString()) : undefined,
        target_fg: data.target_fg ? parseFloat(data.target_fg.toString()) : undefined,
        target_ph: data.target_ph ? parseFloat(data.target_ph.toString()) : undefined,
        target_end_ph: data.target_end_ph ? parseFloat(data.target_end_ph.toString()) : undefined,
      } as Batch;
    },
    staleTime: queryConfigs.batches.staleTime,
  });
};

/**
 * Prefetch batch logs for a specific batch
 * Called when hovering over batch card or navigating to production view
 * 
 * @param queryClient - React Query client
 * @param batchId - ID of batch whose logs to prefetch
 */
export const prefetchBatchLogs = async (
  queryClient: QueryClient,
  batchId: string
) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.batchLogs.byBatch(batchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_logs')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: queryConfigs.batchLogs.staleTime,
  });
};

/**
 * Prefetch adjacent batches for smooth scrolling experience
 * Strategy: When user views/selects a batch, prefetch the next 3
 * 
 * @param queryClient - React Query client
 * @param batches - All available batches
 * @param currentIndex - Index of current batch
 * @param count - Number of adjacent batches to prefetch (default: 3)
 */
export const prefetchAdjacentBatches = async (
  queryClient: QueryClient,
  batches: Batch[],
  currentIndex: number,
  count: number = 3
) => {
  // Prefetch next N batches (anticipate scrolling down)
  const nextBatches = batches.slice(currentIndex + 1, currentIndex + 1 + count);
  
  // Prefetch in parallel - React Query deduplicates automatically
  await Promise.all(
    nextBatches.map((batch) => 
      Promise.all([
        prefetchBatchDetails(queryClient, batch.id),
        prefetchBatchLogs(queryClient, batch.id),
      ])
    )
  );
};

/**
 * Prefetch blend data for smooth tab navigation
 * Called on tab hover to load data before user clicks
 * 
 * @param queryClient - React Query client
 */
export const prefetchBlendData = async (queryClient: QueryClient) => {
  // Check if data is already fresh - if so, skip
  const cachedData = queryClient.getQueryData(queryKeys.blends.all());
  const queryState = queryClient.getQueryState(queryKeys.blends.all());
  
  // Only prefetch if data is stale or doesn't exist
  // Check if data is older than staleTime
  const isStale = queryState 
    ? Date.now() - queryState.dataUpdatedAt > (queryConfigs.blends.staleTime || 0)
    : true;
  
  if (!cachedData || isStale) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.blends.all(),
      queryFn: async () => {
        const { data: blendsData, error: blendsError } = await supabase
          .from('blend_batches')
          .select('*')
          .order('created_at', { ascending: false });

        if (blendsError) throw blendsError;

        // Simplified fetch without components for faster prefetch
        // Full data loads on actual navigation
        return blendsData;
      },
      staleTime: queryConfigs.blends.staleTime,
    });
  }
};

/**
 * Prefetch analytics data for smooth tab navigation
 * Analytics are expensive to compute, so we prefetch early
 * 
 * @param queryClient - React Query client
 */
export const prefetchAnalyticsData = async (queryClient: QueryClient) => {
  // Analytics data is already loaded via batches and blends
  // This is a lightweight check to ensure both are ready
  const batchesReady = queryClient.getQueryData(queryKeys.batches.all());
  const blendsReady = queryClient.getQueryData(queryKeys.blends.all());
  
  if (!batchesReady) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.batches.all(),
      staleTime: queryConfigs.batches.staleTime,
    });
  }
  
  if (!blendsReady) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.blends.all(),
      staleTime: queryConfigs.blends.staleTime,
    });
  }
};

/**
 * Prefetch supplier data for smooth tab navigation
 * 
 * @param queryClient - React Query client
 */
export const prefetchSupplierData = async (queryClient: QueryClient) => {
  const cachedData = queryClient.getQueryData(queryKeys.suppliers.all());
  const queryState = queryClient.getQueryState(queryKeys.suppliers.all());
  
  // Check if data is older than staleTime
  const isStale = queryState 
    ? Date.now() - queryState.dataUpdatedAt > (queryConfigs.suppliers.staleTime || 0)
    : true;
  
  if (!cachedData || isStale) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.suppliers.all(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return data;
      },
      staleTime: queryConfigs.suppliers.staleTime,
    });
  }
};

/**
 * Prefetch tasting data for a blend
 * Called when hovering over blend card
 * 
 * @param queryClient - React Query client
 * @param blendId - ID of blend to prefetch tasting data for
 */
export const prefetchTastingData = async (
  queryClient: QueryClient,
  blendId: string
) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.tasting.byBlend(blendId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasting_analysis')
        .select('*')
        .eq('blend_batch_id', blendId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: queryConfigs.tastingNotes.staleTime,
  });
};

/**
 * Request deduplication is handled automatically by React Query
 * 
 * How it works:
 * - Multiple components can call the same query
 * - React Query deduplicates requests with identical queryKeys
 * - Only one network request fires, all components share the result
 * 
 * Example:
 * - User hovers BatchCard (triggers prefetch)
 * - User clicks BatchCard (triggers actual query)
 * - Only ONE request is made because queryKey is identical
 * - Second call returns cached result instantly
 * 
 * No additional code needed - it's built into React Query!
 */
