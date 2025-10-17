import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Batch } from '@/types/batch.types';

export const useRealtimeBatches = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('batches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'batches'
        },
        (payload) => {
          const newBatch = payload.new as Batch;
          
          // Add to cache with animation flag
          queryClient.setQueryData(['batches'], (old: Batch[] = []) => [
            { ...newBatch, _justAdded: true },
            ...old
          ]);

          // Remove animation flag after delay
          setTimeout(() => {
            queryClient.setQueryData(['batches'], (old: Batch[] = []) =>
              old.map(b => b.id === newBatch.id ? { ...b, _justAdded: false } : b)
            );
          }, 2000);

          toast({
            title: "New batch added",
            description: `${newBatch.name} was created`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batches'
        },
        (payload) => {
          const updatedBatch = payload.new as Batch;
          
          // Update in cache with animation flag
          queryClient.setQueryData(['batches'], (old: Batch[] = []) =>
            old.map(b => 
              b.id === updatedBatch.id 
                ? { ...updatedBatch, _justUpdated: true }
                : b
            )
          );

          // Remove animation flag after delay
          setTimeout(() => {
            queryClient.setQueryData(['batches'], (old: Batch[] = []) =>
              old.map(b => b.id === updatedBatch.id ? { ...b, _justUpdated: false } : b)
            );
          }, 1500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'batches'
        },
        (payload) => {
          const deletedId = payload.old.id;
          
          // Mark for deletion animation
          queryClient.setQueryData(['batches'], (old: Batch[] = []) =>
            old.map(b => b.id === deletedId ? { ...b, _deleting: true } : b)
          );

          // Remove after animation
          setTimeout(() => {
            queryClient.setQueryData(['batches'], (old: Batch[] = []) =>
              old.filter(b => b.id !== deletedId)
            );
          }, 500);

          toast({
            title: "Batch deleted",
            description: "A batch was removed by another user",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);
};
