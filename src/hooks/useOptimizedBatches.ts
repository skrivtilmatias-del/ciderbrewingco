import { useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Batch } from '@/components/BatchCard';
import type { BatchFilters } from '@/components/BatchFilters';

export type SortOrder = 
  | 'newest' 
  | 'oldest' 
  | 'name-asc' 
  | 'name-desc' 
  | 'volume-high' 
  | 'volume-low' 
  | 'progress-high' 
  | 'progress-low';

interface UseOptimizedBatchesOptions {
  batches: Batch[];
  searchQuery: string;
  filters: BatchFilters;
  sortOrder: SortOrder;
}

/**
 * Custom hook for optimizing batch filtering and sorting operations
 * Uses memoization to prevent expensive re-computations
 * Includes performance logging in development mode
 */
export const useOptimizedBatches = ({
  batches,
  searchQuery,
  filters,
  sortOrder,
}: UseOptimizedBatchesOptions) => {
  // Performance tracking in development
  const startTime = performance.now();

  // Debounce search query to prevent filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Step 1: Filter by search query
  const searchFiltered = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return batches;

    const query = debouncedSearchQuery.toLowerCase();
    return batches.filter(
      (batch) =>
        batch.name?.toLowerCase().includes(query) ||
        batch.variety?.toLowerCase().includes(query) ||
        batch.currentStage?.toLowerCase().includes(query) ||
        batch.apple_origin?.toLowerCase().includes(query)
    );
  }, [batches, debouncedSearchQuery]);

  // Step 2: Apply advanced filters
  const filtered = useMemo(() => {
    let result = searchFiltered;

    // Stage filter
    if (filters.stages && filters.stages.length > 0) {
      result = result.filter((batch) => filters.stages.includes(batch.currentStage));
    }

    // Date range filter
    if (filters.dateRange?.from || filters.dateRange?.to) {
      result = result.filter((batch) => {
        const batchDate = new Date(batch.startDate);
        if (filters.dateRange.from && batchDate < new Date(filters.dateRange.from)) {
          return false;
        }
        if (filters.dateRange.to && batchDate > new Date(filters.dateRange.to)) {
          return false;
        }
        return true;
      });
    }

    // Volume range filter
    if (filters.volumeRange) {
      const [min, max] = filters.volumeRange;
      result = result.filter((batch) => batch.volume >= min && batch.volume <= max);
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        result = result.filter((batch) => batch.currentStage !== 'Complete');
      } else if (filters.status === 'completed') {
        result = result.filter((batch) => batch.currentStage === 'Complete');
      }
    }

    // Variety filter
    if (filters.variety) {
      result = result.filter((batch) => batch.variety === filters.variety);
    }

    return result;
  }, [searchFiltered, filters]);

  // Step 3: Sort batches
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'oldest':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'volume-high':
          return (b.volume || 0) - (a.volume || 0);
        case 'volume-low':
          return (a.volume || 0) - (b.volume || 0);
        case 'progress-high':
          return (b.progress || 0) - (a.progress || 0);
        case 'progress-low':
          return (a.progress || 0) - (b.progress || 0);
        default:
          return 0;
      }
    });
  }, [filtered, sortOrder]);

  // Step 4: Group by stage (for grouped view)
  const groupedByStage = useMemo(() => {
    const groups: Record<string, Batch[]> = {};
    
    sorted.forEach((batch) => {
      const stage = batch.currentStage;
      if (!groups[stage]) {
        groups[stage] = [];
      }
      groups[stage].push(batch);
    });

    return groups;
  }, [sorted]);

  // Performance logging in development
  if (process.env.NODE_ENV === 'development') {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16) { // Longer than one frame (60fps)
      console.warn(
        `⚠️ Slow batch processing: ${duration.toFixed(2)}ms for ${batches.length} batches`
      );
    } else {
      console.log(
        `✅ Fast batch processing: ${duration.toFixed(2)}ms for ${batches.length} batches → ${sorted.length} results`
      );
    }
  }

  return {
    filtered,
    sorted,
    groupedByStage,
    metrics: {
      totalBatches: batches.length,
      filteredCount: filtered.length,
      sortedCount: sorted.length,
    },
  };
};
