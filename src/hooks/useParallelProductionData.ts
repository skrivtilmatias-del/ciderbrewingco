import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';
import type { Batch } from '@/components/BatchCard';
import type { Supplier } from '@/types/supplier.types';

interface ParallelProductionDataResult {
  batches: Batch[];
  blends: any[];
  suppliers: Supplier[];
  isLoading: boolean;
  isLoadingAnyResource: boolean;
  hasError: boolean;
  errors: {
    batches?: Error;
    blends?: Error;
    suppliers?: Error;
  };
  retry: () => void;
  loadingStates: {
    batches: boolean;
    blends: boolean;
    suppliers: boolean;
  };
}

export const useParallelProductionData = (): ParallelProductionDataResult => {
  const queryClient = useQueryClient();

  const queries = useQueries({
    queries: [
      // Batches query
      {
        queryKey: queryKeys.batches.all(),
        ...queryConfigs.batches,
        queryFn: async () => {
          const { data, error } = await supabase
            .from('batches')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Map database response to Batch type
          const formattedBatches: Batch[] = data.map((batch) => ({
            id: batch.id,
            userId: batch.user_id,
            name: batch.name,
            variety: batch.variety,
            volume: parseFloat(batch.volume.toString()),
            currentStage: batch.current_stage as Batch['currentStage'],
            progress: batch.progress,
            startDate: batch.started_at,
            completedAt: batch.completed_at,
            createdAt: batch.created_at,
            updatedAt: batch.updated_at,
            appleOrigin: batch.apple_origin || undefined,
            yeastType: batch.yeast_type || undefined,
            notes: batch.notes || undefined,
            attachments: batch.attachments || undefined,
            targetOg: batch.target_og ? parseFloat(batch.target_og.toString()) : undefined,
            targetFg: batch.target_fg ? parseFloat(batch.target_fg.toString()) : undefined,
            targetPh: batch.target_ph ? parseFloat(batch.target_ph.toString()) : undefined,
            targetEndPh: batch.target_end_ph ? parseFloat(batch.target_end_ph.toString()) : undefined,
          }));

          return formattedBatches;
        },
      },
      // Blends query
      {
        queryKey: queryKeys.blends.all(),
        ...queryConfigs.blends,
        queryFn: async () => {
          const { data: blendsData, error: blendsError } = await supabase
            .from('blend_batches')
            .select('*')
            .order('created_at', { ascending: false });

          if (blendsError) throw blendsError;

          // Fetch components and tasting data for each blend in parallel
          const blendsWithData = await Promise.all(
            blendsData.map(async (blend) => {
              // Fetch components and tasting data in parallel for each blend
              const [componentsResult, tastingResult] = await Promise.all([
                supabase
                  .from('blend_components')
                  .select(`
                    id,
                    source_batch_id,
                    percentage,
                    volume_liters,
                    spillage,
                    batches:source_batch_id (
                      name,
                      variety
                    )
                  `)
                  .eq('blend_batch_id', blend.id),
                supabase
                  .from('tasting_analysis')
                  .select('overall_score, notes, created_at')
                  .eq('blend_batch_id', blend.id)
                  .order('created_at', { ascending: false }),
              ]);

              if (componentsResult.error) throw componentsResult.error;
              if (tastingResult.error) throw tastingResult.error;

              const componentsData = componentsResult.data;
              const tastingData = tastingResult.data;

              // Calculate average score
              const average_score = tastingData.length > 0
                ? tastingData.reduce((sum, t) => sum + (t.overall_score || 0), 0) / tastingData.length
                : null;

              // Get latest tasting note
              const latest_tasting = tastingData.length > 0 && tastingData[0].notes
                ? tastingData[0].notes
                : null;

              return {
                ...blend,
                components: componentsData.map((comp: any) => ({
                  id: comp.id,
                  source_batch_id: comp.source_batch_id,
                  batch_name: comp.batches?.name || 'Unknown',
                  batch_variety: comp.batches?.variety || '',
                  percentage: comp.percentage,
                  volume_liters: comp.volume_liters,
                  spillage: comp.spillage || 0,
                })),
                average_score,
                tasting_count: tastingData.length,
                latest_tasting,
              };
            })
          );

          return blendsWithData;
        },
      },
      // Suppliers query
      {
        queryKey: queryKeys.suppliers.all(),
        ...queryConfigs.suppliers,
        queryFn: async () => {
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

          if (error) throw error;
          return data as Supplier[];
        },
      },
    ],
  });

  const [batchesQuery, blendsQuery, suppliersQuery] = queries;

  // Determine overall loading state - only true if ALL are loading initially
  const isLoading = queries.every((query) => query.isLoading);

  // Check for any errors
  const hasError = queries.some((query) => query.error);

  // Collect errors
  const errors = {
    batches: batchesQuery.error as Error | undefined,
    blends: blendsQuery.error as Error | undefined,
    suppliers: suppliersQuery.error as Error | undefined,
  };

  // Individual loading states for partial UI updates
  const loadingStates = {
    batches: batchesQuery.isLoading,
    blends: blendsQuery.isLoading,
    suppliers: suppliersQuery.isLoading,
  };

  // Memoize loading states check to prevent recalculation
  const isLoadingAnyResource = useMemo(
    () => Object.values(loadingStates).some(Boolean),
    [loadingStates.batches, loadingStates.blends, loadingStates.suppliers]
  );

  // Combined retry function using centralized query keys
  const retry = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.blends.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
  };

  return {
    batches: batchesQuery.data || [],
    blends: blendsQuery.data || [],
    suppliers: suppliersQuery.data || [],
    isLoading,
    isLoadingAnyResource,
    hasError,
    errors,
    retry,
    loadingStates,
  };
};
