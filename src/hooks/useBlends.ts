import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlendBatch, CreateBlendBatchInput, UpdateBlendBatchInput } from '@/types/blend.types';
import { toast } from 'sonner';

export const useBlends = () => {
  const queryClient = useQueryClient();

  // Fetch all blends
  const { data: blends = [], isLoading, error } = useQuery({
    queryKey: ['blends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blend_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlendBatch[];
    },
  });

  // Create blend mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateBlendBatchInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('blend_batches')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as BlendBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blends'] });
      toast.success('Blend created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create blend: ${error.message}`);
    },
  });

  // Update blend mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBlendBatchInput }) => {
      const { data, error } = await supabase
        .from('blend_batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BlendBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blends'] });
      toast.success('Blend updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update blend: ${error.message}`);
    },
  });

  // Delete blend mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blend_batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blends'] });
      toast.success('Blend deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete blend: ${error.message}`);
    },
  });

  return {
    blends,
    isLoading,
    error,
    createBlend: createMutation.mutate,
    updateBlend: updateMutation.mutate,
    deleteBlend: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
