/**
 * Hook for managing filter presets in Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterPreset } from '@/types/filters';
import { toast } from 'sonner';

export const useFilterPresets = () => {
  const queryClient = useQueryClient();

  // Fetch presets
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['filter-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(preset => ({
        ...preset,
        filters: preset.filters as any,
      })) as FilterPreset[];
    },
  });

  // Save preset
  const savePreset = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('filter_presets')
        .insert([{ name, filters: filters as any, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
      toast.success('Filter preset saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save preset');
    },
  });

  // Update preset
  const updatePreset = useMutation({
    mutationFn: async ({ id, name, filters }: { id: string; name?: string; filters?: any }) => {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (filters) updateData.filters = filters;

      const { data, error } = await supabase
        .from('filter_presets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
      toast.success('Preset updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preset');
    },
  });

  // Delete preset
  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('filter_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
      toast.success('Preset deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete preset');
    },
  });

  return {
    presets,
    isLoading,
    savePreset: savePreset.mutate,
    updatePreset: updatePreset.mutate,
    deletePreset: deletePreset.mutate,
  };
};
