import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errorHandler';
import type { Batch } from '@/components/BatchCard';

export const useBatches = () => {
  const queryClient = useQueryClient();

  // Fetch all batches
  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database response to Batch type
      const formattedBatches: Batch[] = data.map((batch) => ({
        id: batch.id,
        name: batch.name,
        variety: batch.variety,
        apple_origin: batch.apple_origin || undefined,
        volume: parseFloat(batch.volume.toString()),
        startDate: batch.started_at,
        currentStage: batch.current_stage as Batch['currentStage'],
        progress: batch.progress,
        notes: batch.notes || undefined,
        attachments: batch.attachments || undefined,
        yeast_type: batch.yeast_type || undefined,
        target_og: batch.target_og ? parseFloat(batch.target_og.toString()) : undefined,
        target_fg: batch.target_fg ? parseFloat(batch.target_fg.toString()) : undefined,
        target_ph: batch.target_ph ? parseFloat(batch.target_ph.toString()) : undefined,
        target_end_ph: batch.target_end_ph ? parseFloat(batch.target_end_ph.toString()) : undefined,
      }));

      return formattedBatches;
    },
  });

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (batchData: {
      name: string;
      variety: string;
      volume: number;
      current_stage: string;
      apple_origin?: string;
      yeast_type?: string;
      style?: string;
      notes?: string;
      target_og?: number;
      target_fg?: number;
      target_ph?: number;
      target_end_ph?: number;
      temperature?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the batch
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert([{ 
          name: batchData.name,
          variety: batchData.variety,
          volume: batchData.volume,
          current_stage: batchData.current_stage,
          apple_origin: batchData.apple_origin,
          yeast_type: batchData.yeast_type,
          style: batchData.style,
          notes: batchData.notes,
          target_og: batchData.target_og,
          target_fg: batchData.target_fg,
          target_ph: batchData.target_ph,
          target_end_ph: batchData.target_end_ph,
          user_id: user.id 
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create initial batch log entry with measurements
      const hasInitialData = batchData.target_og || batchData.target_ph || batchData.temperature;
      
      if (hasInitialData) {
        const { error: logError } = await supabase
          .from('batch_logs')
          .insert([{
            batch_id: newBatch.id,
            user_id: user.id,
            stage: batchData.current_stage,
            role: 'Lab',
            title: 'Initial Batch Setup',
            content: batchData.notes || null,
            og: batchData.target_og || null,
            ph: batchData.target_ph || null,
            temp_c: batchData.temperature || null,
            created_at: new Date().toISOString(),
          }]);

        if (logError) {
          console.error('Error creating initial log:', logError);
          // Don't throw - we still want the batch creation to succeed
        }
      }

      return newBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batch-logs'] });
      toast.success('Batch created successfully');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch deleted successfully');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Helper function to calculate progress based on stage
  const calculateProgress = (stage: string) => {
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

  // Update stage mutation with optimistic updates
  const updateStageMutation = useMutation({
    mutationFn: async ({ batchId, newStage }: { batchId: string; newStage: string }) => {
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
      await queryClient.cancelQueries({ queryKey: ['batches'] });
      
      // Snapshot the previous value
      const previousBatches = queryClient.getQueryData(['batches']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['batches'], (old: any) => 
        old?.map((b: any) => b.id === variables.batchId 
          ? { ...b, currentStage: variables.newStage, progress: calculateProgress(variables.newStage) } 
          : b
        )
      );
      
      return { previousBatches };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousBatches) {
        queryClient.setQueryData(['batches'], context.previousBatches);
      }
      toast.error(getUserFriendlyError(err));
    },
    onSuccess: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch stage updated');
    },
  });

  return {
    batches,
    isLoading,
    error,
    createBatch: createBatchMutation.mutate,
    deleteBatch: deleteBatchMutation.mutate,
    updateStage: updateStageMutation.mutate,
    isCreating: createBatchMutation.isPending,
    isDeleting: deleteBatchMutation.isPending,
    isUpdating: updateStageMutation.isPending,
  };
};
