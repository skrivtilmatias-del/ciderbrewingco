import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { queryKeys } from '@/lib/queryConfig';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import type { Batch } from '@/components/BatchCard';

/**
 * Calculate progress percentage based on stage
 */
const calculateProgress = (stage: string): number => {
  const allStages = [
    'Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling',
    'Enzymes', 'Pitching', 'Fermentation', 'Cold Crash', 'Racking', 'Malolactic',
    'Stabilisation', 'Blending', 'Backsweetening', 'Bottling',
    'Conditioning', 'Lees Aging', 'Tasting', 'Complete'
  ];
  
  const stageIndex = allStages.indexOf(stage);
  return stageIndex === allStages.length - 1 
    ? 100 
    : Math.round(((stageIndex + 1) / allStages.length) * 100);
};

/**
 * useBatchActions - Centralized batch mutations with optimistic updates
 * 
 * Provides all batch CRUD operations with:
 * - Optimistic UI updates
 * - Error recovery (rollback on failure)
 * - Toast notifications
 * - Query cache invalidation
 * 
 * @returns Object with mutation functions and loading states
 * 
 * @example
 * ```tsx
 * const { updateStage, deleteBatch, cloneBatch, isUpdating } = useBatchActions();
 * 
 * // Update batch stage
 * await updateStage(batchId, 'Fermentation');
 * 
 * // Delete batch with confirmation
 * await deleteBatch(batchId);
 * 
 * // Clone batch
 * await cloneBatch(existingBatch);
 * ```
 */
export const useBatchActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logStageChange, logActivity } = useActivityLogger();

  /**
   * Update batch stage with optimistic update
   * Updates progress automatically based on stage
   */
  const updateStageMutation = useMutation({
    mutationFn: async ({ 
      batchId, 
      newStage 
    }: { 
      batchId: string; 
      newStage: string;
    }) => {
      const progress = calculateProgress(newStage);

      const { data, error } = await supabase
        .from('batches')
        .update({ 
          current_stage: newStage,
          progress: progress,
          completed_at: newStage === "Complete" ? new Date().toISOString() : null,
        })
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.batches.all() });
      
      // Snapshot previous value
      const previousBatches = queryClient.getQueryData<Batch[]>(queryKeys.batches.all());
      
      // Optimistically update
      queryClient.setQueryData<Batch[]>(queryKeys.batches.all(), (old) => {
        if (!old) return old;
        
        return old.map((batch) => {
          if (batch.id === variables.batchId) {
            const progress = calculateProgress(variables.newStage);
            return {
              ...batch,
              currentStage: variables.newStage as Batch['currentStage'],
              progress,
            };
          }
          return batch;
        });
      });
      
      return { previousBatches };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKeys.batches.all(), context.previousBatches);
      }
      
      toast({
        title: "Failed to update stage",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Get previous stage from cache
      const previousBatches = queryClient.getQueryData<Batch[]>(queryKeys.batches.all());
      const oldStage = previousBatches?.find(b => b.id === variables.batchId)?.currentStage;
      
      // Log activity
      if (oldStage && oldStage !== variables.newStage) {
        logStageChange(variables.batchId, oldStage, variables.newStage);
      }
      
      toast({
        title: "Stage updated",
        description: `Batch moved to ${variables.newStage}`,
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency with deduplicated invalidation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.batches.all(),
        refetchType: 'none'
      });
    },
  });

  /**
   * Delete batch mutation
   */
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.batches.all(),
        refetchType: 'none'
      });
      toast({
        title: "Batch deleted",
        description: "The batch has been permanently removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete batch",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });

  /**
   * Clone batch mutation
   * Creates a copy of an existing batch with " (Copy)" suffix
   */
  const cloneBatchMutation = useMutation({
    mutationFn: async (batch: Batch) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: `${batch.name} (Copy)`,
          variety: batch.variety,
          volume: batch.volume,
          current_stage: 'Harvest', // Reset to start
          apple_origin: batch.apple_origin,
          yeast_type: batch.yeast_type,
          notes: batch.notes,
          target_og: batch.target_og,
          target_fg: batch.target_fg,
          target_ph: batch.target_ph,
          target_end_ph: batch.target_end_ph,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.batches.all(),
        refetchType: 'none'
      });
      
      // Log activity
      logActivity({
        batchId: data.id,
        activityType: 'cloned',
        activityData: { source_batch_name: data.name },
      });
      
      toast({
        title: "Batch cloned",
        description: "A copy of the batch has been created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clone batch",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });

  /**
   * Archive batch (soft delete)
   * Marks batch as archived without deleting
   */
  const archiveBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('batches')
        .update({ current_stage: 'Complete', progress: 100 })
        .eq('id', batchId);

      if (error) throw error;
    },
    onSuccess: (data, batchId) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.batches.all(),
        refetchType: 'none'
      });
      
      // Log activity
      logActivity({
        batchId,
        activityType: 'archived',
        activityData: {},
      });
      
      toast({
        title: "Batch archived",
        description: "Batch marked as complete",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to archive batch",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });

  // Return memoized functions
  const updateStage = useCallback(
    (batchId: string, newStage: string) => 
      updateStageMutation.mutate({ batchId, newStage }),
    [updateStageMutation]
  );

  const deleteBatch = useCallback(
    (batchId: string) => deleteBatchMutation.mutate(batchId),
    [deleteBatchMutation]
  );

  const cloneBatch = useCallback(
    (batch: Batch) => cloneBatchMutation.mutate(batch),
    [cloneBatchMutation]
  );

  const archiveBatch = useCallback(
    (batchId: string) => archiveBatchMutation.mutate(batchId),
    [archiveBatchMutation]
  );

  return {
    /** Update batch stage */
    updateStage,
    /** Delete batch permanently */
    deleteBatch,
    /** Clone batch */
    cloneBatch,
    /** Archive batch (mark complete) */
    archiveBatch,
    /** Whether stage update is in progress */
    isUpdating: updateStageMutation.isPending,
    /** Whether batch deletion is in progress */
    isDeleting: deleteBatchMutation.isPending,
    /** Whether batch cloning is in progress */
    isCloning: cloneBatchMutation.isPending,
    /** Whether batch archiving is in progress */
    isArchiving: archiveBatchMutation.isPending,
  };
};
