import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchLog, CreateBatchLogInput, UpdateBatchLogInput } from '@/types/batchLog.types';
import { toast } from 'sonner';

export const useBatchLogs = (batchId?: string) => {
  const queryClient = useQueryClient();

  // Fetch batch logs
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['batchLogs', batchId],
    queryFn: async () => {
      let query = supabase
        .from('batch_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BatchLog[];
    },
    enabled: !!batchId || batchId === undefined,
  });

  // Create log mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateBatchLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batch_logs')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as BatchLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchLogs'] });
      toast.success('Log created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create log: ${error.message}`);
    },
  });

  // Update log mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBatchLogInput }) => {
      const { data, error } = await supabase
        .from('batch_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BatchLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchLogs'] });
      toast.success('Log updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update log: ${error.message}`);
    },
  });

  // Delete log mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('batch_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchLogs'] });
      toast.success('Log deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete log: ${error.message}`);
    },
  });

  return {
    logs,
    isLoading,
    error,
    createLog: createMutation.mutate,
    updateLog: updateMutation.mutate,
    deleteLog: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
