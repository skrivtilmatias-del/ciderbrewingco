import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ExportTemplate, ExportConfig } from '@/types/export.types';

export const useExportTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['export-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('export_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ExportTemplate[];
    },
  });

  // Save template
  const saveTemplate = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: Partial<ExportConfig> }) => {
      const { data, error } = await (supabase as any)
        .from('export_templates')
        .insert([{ name, config: config as any }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ExportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      config 
    }: { 
      id: string; 
      name?: string; 
      config?: Partial<ExportConfig>;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (name) updates.name = name;
      if (config) updates.config = config;

      const { data, error } = await (supabase as any)
        .from('export_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ExportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('export_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    },
  });

  // Duplicate template
  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const { data, error } = await (supabase as any)
        .from('export_templates')
        .insert([{
          name: `${template.name} (Copy)`,
          config: template.config as any,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ExportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
      toast.success('Template duplicated successfully');
    },
    onError: (error) => {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    },
  });

  return {
    templates,
    isLoading,
    error,
    saveTemplate: saveTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    duplicateTemplate: duplicateTemplate.mutate,
    isSaving: saveTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
};
