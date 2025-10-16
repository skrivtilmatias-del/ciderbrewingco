import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';
import type { Batch } from '@/components/BatchCard';
import { useEffect } from 'react';
export const useBatches = () => {
  const queryClient = useQueryClient();

  // Fetch all batches with optimized caching
  const { data: batches = [], isLoading, error } = useQuery({
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

  useEffect(() => {
    const run = async () => {
      try {
        if (!batches || batches.length === 0) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const batchIds = batches.map((b: any) => b.id);
        const { data: existingLogs } = await supabase
          .from('batch_logs')
          .select('batch_id')
          .in('batch_id', batchIds)
          .eq('user_id', session.user.id);

        const existingSet = new Set((existingLogs || []).map((l: any) => l.batch_id));

        const inserts = (batches as Batch[])
          .filter((b) => !existingSet.has(b.id))
          .map((b) => ({
            batch_id: b.id,
            user_id: session.user.id,
            stage: b.currentStage || 'Harvest',
            role: 'Lab',
            title: 'Initial Batch Setup (Backfill)',
            content: b.notes || '',
            og: (b as any).target_og ?? null,
            ph: (b as any).target_ph ?? null,
            temp_c: null,
            tags: [] as string[],
          }));

        if (inserts.length) {
          const { error: insertErr } = await supabase.from('batch_logs').insert(inserts);
          if (insertErr) {
            console.error('Backfill initial logs failed:', insertErr);
          } else {
            queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.all() });
          }
        }
      } catch (e) {
        console.error('Backfill error:', e);
      }
    };
    run();
  }, [batches]);

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
       initial_temp_c?: number;
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


      return newBatch;
    },
     onSuccess: async (newBatchData, formVariables) => {
       // Get current user session
       const { data: { session } } = await supabase.auth.getSession();
       
       if (session && newBatchData?.id) {
         // Create initial batch log entry with measurements
         const { error: logError } = await supabase
           .from('batch_logs')
           .insert({
             batch_id: newBatchData.id,
             user_id: session.user.id,
             stage: newBatchData.current_stage || 'Harvest',
             role: 'Lab',
             title: 'Initial Batch Setup',
             content: formVariables.notes || '',
             og: formVariables.target_og || null,
             ph: formVariables.target_ph || null,
             temp_c: formVariables.initial_temp_c || null,
             tags: []
           });
         
         if (logError) {
           console.error('Failed to create initial log:', logError);
         }
       }
        
        // Invalidate queries using centralized keys
        queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.all() });
        
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
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
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
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.batches.all() });
      
      // Snapshot the previous value for rollback
      const previousBatches = queryClient.getQueryData<Batch[]>(queryKeys.batches.all());
      
      // Optimistically update the cache immediately
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
      
      // Return context with previous state for potential rollback
      return { previousBatches };
    },
    onError: (error, variables, context) => {
      // Rollback to the previous cached state
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKeys.batches.all(), context.previousBatches);
      }
      
      toast.error(`Failed to update stage: ${getUserFriendlyError(error)}`);
    },
    onSuccess: (data, variables) => {
      toast.success(`Stage updated to ${variables.newStage}`);
    },
    onSettled: () => {
      // Always refetch after mutation completes to ensure data consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
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
