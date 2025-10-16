import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TastingAnalysis, CreateTastingAnalysisInput, UpdateTastingAnalysisInput } from '@/types/tasting.types';
import { toast } from 'sonner';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';

export const useTastingAnalysis = (blendBatchId?: string) => {
  const queryClient = useQueryClient();

  // Fetch tasting analyses with optimized caching
  const { data: analyses = [], isLoading, error } = useQuery({
    queryKey: blendBatchId ? queryKeys.tasting.byBlend(blendBatchId) : queryKeys.tasting.all(),
    ...queryConfigs.tastingNotes,
    queryFn: async () => {
      let query = supabase
        .from('tasting_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (blendBatchId) {
        query = query.eq('blend_batch_id', blendBatchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TastingAnalysis[];
    },
  });

  // Create analysis mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateTastingAnalysisInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasting_analysis')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as TastingAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasting.all() });
      toast.success('Tasting analysis created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create analysis: ${error.message}`);
    },
  });

  // Update analysis mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTastingAnalysisInput }) => {
      const { data, error } = await supabase
        .from('tasting_analysis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TastingAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasting.all() });
      toast.success('Analysis updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update analysis: ${error.message}`);
    },
  });

  // Delete analysis mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasting_analysis')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasting.all() });
      toast.success('Analysis deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete analysis: ${error.message}`);
    },
  });

  return {
    analyses,
    isLoading,
    error,
    createAnalysis: createMutation.mutate,
    updateAnalysis: updateMutation.mutate,
    deleteAnalysis: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
