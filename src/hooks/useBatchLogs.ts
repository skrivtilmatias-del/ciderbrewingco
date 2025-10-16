import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';
import type { BatchLog } from '@/components/BatchLogCard';

export const useBatchLogs = (batchId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch batch logs with optimized caching
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.batchLogs.byBatch(batchId || ''),
    ...queryConfigs.batchLogs,
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from('batch_logs')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BatchLog[];
    },
    enabled: !!batchId, // Only fetch when batchId is not null
  });

  // Add log mutation
  const addLogMutation = useMutation({
    mutationFn: async ({
      batchId,
      title = '',
      role = 'General',
      stage,
    }: {
      batchId: string;
      title?: string;
      role?: string;
      stage: string;
    }) => {
      // Verify session before critical operation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please log in again');
      }

      // Sanity check against backend to verify batch ownership
      const { data: batchRow, error: batchCheckError } = await supabase
        .from('batches')
        .select('id, user_id, current_stage')
        .eq('id', batchId)
        .single();

      if (batchCheckError || !batchRow || batchRow.user_id !== session.user.id) {
        throw new Error('Could not verify selected batch. Please refresh and try again.');
      }

      // Create the log entry
      const { data, error } = await supabase
        .from('batch_logs')
        .insert([
          {
            batch_id: batchId,
            user_id: session.user.id,
            stage: stage,
            role: role,
            title: title,
            content: '',
            tags: [],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.byBatch(variables.batchId) });
      toast.success('Log entry created');
    },
    onError: (error: any) => {
      if (error?.code === '42501') {
        toast.error('Permission denied while creating note. Please refresh and try again.');
        queryClient.invalidateQueries({ queryKey: queryKeys.batches.all() });
      } else {
        toast.error(getUserFriendlyError(error));
      }
    },
  });

  // Update log mutation
  const updateLogMutation = useMutation({
    mutationFn: async ({ logId, updates }: { logId: string; updates: Partial<BatchLog> }) => {
      const { data, error } = await supabase
        .from('batch_logs')
        .update(updates)
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.all() });
      toast.success('Log updated successfully');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Delete log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('batch_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs.all() });
      toast.success('Log deleted successfully');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  return {
    logs,
    isLoading,
    error,
    addLog: addLogMutation.mutate,
    updateLog: updateLogMutation.mutate,
    deleteLog: deleteLogMutation.mutate,
    isAdding: addLogMutation.isPending,
    isUpdating: updateLogMutation.isPending,
    isDeleting: deleteLogMutation.isPending,
  };
};
