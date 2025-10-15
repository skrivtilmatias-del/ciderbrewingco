import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Batch, CreateBatchInput, UpdateBatchInput } from '@/types/batch.types';
import { toast } from 'sonner';

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
      return data as Batch[];
    },
  });

  // Create batch mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateBatchInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batches')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create batch: ${error.message}`);
    },
  });

  // Update batch mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBatchInput }) => {
      const { data, error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update batch: ${error.message}`);
    },
  });

  // Delete batch mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete batch: ${error.message}`);
    },
  });

  return {
    batches,
    isLoading,
    error,
    createBatch: createMutation.mutate,
    updateBatch: updateMutation.mutate,
    deleteBatch: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
