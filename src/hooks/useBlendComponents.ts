import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlendComponent, CreateBlendComponentInput, UpdateBlendComponentInput } from '@/types/blend.types';
import { toast } from 'sonner';

export const useBlendComponents = (blendBatchId?: string) => {
  const queryClient = useQueryClient();

  // Fetch blend components
  const { data: components = [], isLoading, error } = useQuery({
    queryKey: ['blendComponents', blendBatchId],
    queryFn: async () => {
      let query = supabase
        .from('blend_components')
        .select('*')
        .order('created_at', { ascending: false });

      if (blendBatchId) {
        query = query.eq('blend_batch_id', blendBatchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlendComponent[];
    },
    enabled: !!blendBatchId || blendBatchId === undefined,
  });

  // Create component mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateBlendComponentInput) => {
      const { data, error } = await supabase
        .from('blend_components')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as BlendComponent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blendComponents'] });
      toast.success('Component added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add component: ${error.message}`);
    },
  });

  // Update component mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBlendComponentInput }) => {
      const { data, error } = await supabase
        .from('blend_components')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BlendComponent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blendComponents'] });
      toast.success('Component updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update component: ${error.message}`);
    },
  });

  // Delete component mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blend_components')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blendComponents'] });
      toast.success('Component removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove component: ${error.message}`);
    },
  });

  return {
    components,
    isLoading,
    error,
    createComponent: createMutation.mutate,
    updateComponent: updateMutation.mutate,
    deleteComponent: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
