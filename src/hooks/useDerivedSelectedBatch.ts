import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import type { Batch } from '@/components/BatchCard';

/**
 * Hook to derive selected batch from React Query cache
 * 
 * This follows the "React Query way" - single source of truth in the cache.
 * Instead of storing the full batch object in Zustand, we only store the ID
 * and derive the full batch data from the React Query cache.
 * 
 * Benefits:
 * - No need for sync effects with JSON.stringify
 * - Always up-to-date with latest data
 * - No stale data issues
 * - Better performance (no deep comparison)
 */
export const useDerivedSelectedBatch = () => {
  const selectedBatchId = useAppStore((state) => state.selectedBatchId);
  
  // Derive selected batch directly from React Query cache
  const { data: batches } = useQuery<Batch[]>({
    queryKey: ['batches'],
  });
  
  // Memoize the selected batch lookup
  const selectedBatch = useMemo(() => {
    if (!selectedBatchId || !batches) return null;
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);
  
  return selectedBatch;
};
