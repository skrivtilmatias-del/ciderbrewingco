import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';

export const useBlends = () => {
  const queryClient = useQueryClient();

  // Fetch blend batches with components and tasting data
  const { data: blends = [], isLoading, error } = useQuery({
    queryKey: queryKeys.blends.all(),
    ...queryConfigs.blends,
    queryFn: async () => {
      const { data: blendsData, error: blendsError } = await supabase
        .from('blend_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (blendsError) throw blendsError;

      // Fetch components and tasting data for each blend
      const blendsWithData = await Promise.all(
        blendsData.map(async (blend) => {
          // Fetch components with batch details
          const { data: componentsData, error: componentsError } = await supabase
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
            .eq('blend_batch_id', blend.id);

          if (componentsError) throw componentsError;

          // Fetch tasting analyses
          const { data: tastingData, error: tastingError } = await supabase
            .from('tasting_analysis')
            .select('overall_score, notes, created_at')
            .eq('blend_batch_id', blend.id)
            .order('created_at', { ascending: false });

          if (tastingError) throw tastingError;

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
  });

  // Create blend mutation
  const createBlendMutation = useMutation({
    mutationFn: async ({
      name,
      total_volume,
      storage_location,
      bottles_75cl,
      bottles_150cl,
      notes,
      components,
    }: {
      name: string;
      total_volume: number;
      storage_location?: string;
      bottles_75cl?: number;
      bottles_150cl?: number;
      notes?: string;
      components: Array<{
        source_batch_id: string;
        percentage?: number;
        volume_liters?: number;
        spillage?: number;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create blend batch
      const { data: blendData, error: blendError } = await supabase
        .from('blend_batches')
        .insert([
          {
            user_id: user.id,
            name,
            total_volume,
            storage_location: storage_location || null,
            bottles_75cl: bottles_75cl || 0,
            bottles_150cl: bottles_150cl || 0,
            notes: notes || null,
          },
        ])
        .select()
        .single();

      if (blendError) throw blendError;

      // Create blend components
      const componentsToInsert = components.map((comp) => ({
        blend_batch_id: blendData.id,
        source_batch_id: comp.source_batch_id,
        percentage: comp.percentage,
        volume_liters: comp.volume_liters,
        spillage: comp.spillage || 0,
      }));

      const { error: componentsError } = await supabase
        .from('blend_components')
        .insert(componentsToInsert);

      if (componentsError) throw componentsError;

      return blendData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blends.all() });
      toast.success('Blend batch created');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Delete blend mutation
  const deleteBlendMutation = useMutation({
    mutationFn: async (blendId: string) => {
      const { error } = await supabase
        .from('blend_batches')
        .delete()
        .eq('id', blendId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blends.all() });
      toast.success('Blend batch deleted');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  return {
    blends,
    isLoading,
    error,
    createBlend: createBlendMutation.mutate,
    deleteBlend: deleteBlendMutation.mutate,
    isCreating: createBlendMutation.isPending,
    isDeleting: deleteBlendMutation.isPending,
  };
};
