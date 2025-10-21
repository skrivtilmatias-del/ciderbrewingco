import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CostTemplate, CostScenario, SimulationResult, CostSnapshot, CostAlert, YearlyProjection } from '@/types/costManagement.types';

export const useCostTemplates = () => {
  return useQuery({
    queryKey: ['cost-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CostTemplate[];
    },
  });
};

export const useCreateCostTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Partial<CostTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cost_templates')
        .insert(template as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as CostTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-templates'] });
      toast.success('Cost template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
};

export const useUpdateCostTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
};

export const useDeleteCostTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
};

export const useCostScenarios = () => {
  return useQuery({
    queryKey: ['cost-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_scenarios')
        .select('*, cost_templates(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCostScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scenario: Partial<CostScenario>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cost_scenarios')
        .insert(scenario as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as CostScenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-scenarios'] });
      toast.success('Scenario created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create scenario: ${error.message}`);
    },
  });
};

export const useUpdateCostScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostScenario> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_scenarios')
        .update(updates)
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-scenarios'] });
      toast.success('Scenario updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update scenario: ${error.message}`);
    },
  });
};

export const useDeleteCostScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_scenarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-scenarios'] });
      toast.success('Scenario deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete scenario: ${error.message}`);
    },
  });
};

export const useSimulationResults = (scenarioId?: string) => {
  return useQuery({
    queryKey: ['simulation-results', scenarioId],
    queryFn: async () => {
      let query = supabase
        .from('simulation_results')
        .select('*, cost_scenarios(name, scenario_type)')
        .order('created_at', { ascending: false });
      
      if (scenarioId) {
        query = query.eq('scenario_id', scenarioId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        yearly_projections: d.yearly_projections as any as YearlyProjection[]
      })) as SimulationResult[];
    },
    enabled: true,
  });
};

export const useSaveSimulationResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (result: Partial<SimulationResult>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('simulation_results')
        .insert({
          ...result,
          yearly_projections: result.yearly_projections as any,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        yearly_projections: data.yearly_projections as any as YearlyProjection[]
      } as SimulationResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-results'] });
      toast.success('Simulation saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save simulation: ${error.message}`);
    },
  });
};

export const useCostSnapshots = (batchId?: string, blendId?: string) => {
  return useQuery({
    queryKey: ['cost-snapshots', batchId, blendId],
    queryFn: async () => {
      let query = supabase
        .from('cost_snapshots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (batchId) query = query.eq('batch_id', batchId);
      if (blendId) query = query.eq('blend_id', blendId);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CostSnapshot[];
    },
    enabled: !!batchId || !!blendId,
  });
};

export const useCreateCostSnapshot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (snapshot: Partial<CostSnapshot>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cost_snapshots')
        .insert({
          ...snapshot,
          planned_costs: snapshot.planned_costs as any,
          actual_costs: snapshot.actual_costs as any,
          variance: snapshot.variance as any,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as CostSnapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-snapshots'] });
      toast.success('Cost snapshot created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create snapshot: ${error.message}`);
    },
  });
};

export const useCostAlerts = () => {
  return useQuery({
    queryKey: ['cost-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CostAlert[];
    },
  });
};

export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_alerts')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-alerts'] });
    },
  });
};
