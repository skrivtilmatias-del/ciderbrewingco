import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@/types/supplier.types';
import { toast } from 'sonner';
import { queryKeys, queryConfigs } from '@/lib/queryConfig';

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  // Fetch all suppliers with optimized caching
  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    ...queryConfigs.suppliers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast.success('Supplier created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSupplierInput }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast.success('Supplier updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast.success('Supplier deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
