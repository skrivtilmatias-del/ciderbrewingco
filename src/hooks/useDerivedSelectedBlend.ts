import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';

/**
 * Hook to derive selected blend from React Query cache
 * 
 * This follows the "React Query way" - single source of truth in the cache.
 * Instead of storing the full blend object in Zustand, we only store the ID
 * and derive the full blend data from the React Query cache.
 */
export const useDerivedSelectedBlend = () => {
  const selectedBlendId = useAppStore((state) => state.selectedBlendId);
  
  // Derive selected blend directly from React Query cache
  const { data: blends } = useQuery<any[]>({
    queryKey: ['blend-batches'],
  });
  
  // Memoize the selected blend lookup
  const selectedBlend = useMemo(() => {
    if (!selectedBlendId || !blends) return null;
    return blends.find((b) => b.id === selectedBlendId) || null;
  }, [blends, selectedBlendId]);
  
  return selectedBlend;
};
