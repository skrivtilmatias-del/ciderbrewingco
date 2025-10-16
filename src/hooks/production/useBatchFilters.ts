import { useMemo } from 'react';
import type { Batch } from '@/components/BatchCard';

/**
 * Filter criteria for batch filtering
 */
export interface BatchFilterCriteria {
  /** Array of stages to filter by (empty = all stages) */
  stages: string[];
  /** Date range filter */
  dateRange: {
    from?: Date;
    to?: Date;
  };
  /** Volume range [min, max] in liters */
  volumeRange: [number, number];
  /** Batch status filter */
  status: 'all' | 'active' | 'completed';
  /** Apple variety filter (empty = all varieties) */
  variety: string;
  /** Alcohol content range [min, max] in % ABV */
  alcoholRange: [number, number];
}

/**
 * Individual filter functions exported for reuse
 */
export const filterFunctions = {
  /**
   * Filter batches by text search (name, variety, or stage)
   */
  searchFilter: (batch: Batch, query: string): boolean => {
    if (!query) return true;
    
    const normalizedQuery = query.toLowerCase();
    return (
      batch.name.toLowerCase().includes(normalizedQuery) ||
      batch.variety.toLowerCase().includes(normalizedQuery) ||
      batch.currentStage.toLowerCase().includes(normalizedQuery)
    );
  },

  /**
   * Filter batches by stage
   */
  stageFilter: (batch: Batch, stages: string[]): boolean => {
    if (stages.length === 0) return true;
    return stages.includes(batch.currentStage);
  },

  /**
   * Filter batches by date range
   */
  dateRangeFilter: (batch: Batch, from?: Date, to?: Date): boolean => {
    if (!from && !to) return true;
    
    const batchDate = new Date(batch.startDate);
    
    if (from && batchDate < from) {
      return false;
    }
    
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (batchDate > endOfDay) {
        return false;
      }
    }
    
    return true;
  },

  /**
   * Filter batches by volume range
   */
  volumeFilter: (batch: Batch, min: number, max: number): boolean => {
    return batch.volume >= min && batch.volume <= max;
  },

  /**
   * Filter batches by status (active/completed)
   */
  statusFilter: (batch: Batch, status: 'all' | 'active' | 'completed'): boolean => {
    if (status === 'all') return true;
    
    const isCompleted = batch.currentStage === 'Complete' || batch.progress === 100;
    return status === 'completed' ? isCompleted : !isCompleted;
  },

  /**
   * Filter batches by variety
   */
  varietyFilter: (batch: Batch, variety: string): boolean => {
    if (!variety) return true;
    return batch.variety === variety;
  },

  /**
   * Filter batches by estimated alcohol content
   */
  alcoholFilter: (batch: Batch, min: number, max: number): boolean => {
    if (!batch.target_og) return true;
    
    // Simple ABV estimation: (OG - FG) * 131.25
    // Assuming FG ~1.005 for dry cider
    const estimatedABV = (batch.target_og - 1.005) * 131.25;
    return estimatedABV >= min && estimatedABV <= max;
  },
};

/**
 * useBatchFilters - High-performance batch filtering hook
 * 
 * Applies multiple filter criteria to batch list with memoization for performance.
 * Supports text search, stage filtering, date ranges, volume ranges, status, variety,
 * and alcohol content filtering.
 * 
 * @param batches - Array of batches to filter
 * @param filters - Filter criteria object
 * @param searchQuery - Text search query (searches name, variety, stage)
 * 
 * @returns Filtered batches array
 * 
 * @example
 * ```tsx
 * const filteredBatches = useBatchFilters(batches, {
 *   stages: ['Fermentation', 'Bottling'],
 *   status: 'active',
 *   volumeRange: [0, 1000],
 *   dateRange: { from: startDate, to: endDate },
 *   variety: '',
 *   alcoholRange: [0, 12],
 * }, 'apple');
 * ```
 * 
 * Performance: Memoized - only recalculates when inputs change
 */
export const useBatchFilters = (
  batches: Batch[],
  filters: BatchFilterCriteria,
  searchQuery: string = ''
): Batch[] => {
  return useMemo(() => {
    let filtered = batches;

    // Apply each filter in sequence
    if (searchQuery) {
      filtered = filtered.filter(batch => 
        filterFunctions.searchFilter(batch, searchQuery)
      );
    }

    if (filters.stages.length > 0) {
      filtered = filtered.filter(batch => 
        filterFunctions.stageFilter(batch, filters.stages)
      );
    }

    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(batch => 
        filterFunctions.dateRangeFilter(batch, filters.dateRange.from, filters.dateRange.to)
      );
    }

    filtered = filtered.filter(batch => 
      filterFunctions.volumeFilter(batch, filters.volumeRange[0], filters.volumeRange[1])
    );

    filtered = filtered.filter(batch => 
      filterFunctions.statusFilter(batch, filters.status)
    );

    if (filters.variety) {
      filtered = filtered.filter(batch => 
        filterFunctions.varietyFilter(batch, filters.variety)
      );
    }

    filtered = filtered.filter(batch => 
      filterFunctions.alcoholFilter(batch, filters.alcoholRange[0], filters.alcoholRange[1])
    );

    return filtered;
  }, [batches, filters, searchQuery]);
};

/**
 * Extract unique varieties from batch list
 * Used to populate variety filter dropdown
 * 
 * @param batches - Array of batches
 * @returns Sorted array of unique varieties
 */
export const getUniqueVarieties = (batches: Batch[]): string[] => {
  const varieties = new Set(batches.map(b => b.variety));
  return Array.from(varieties).sort();
};

/**
 * Extract unique stages from batch list
 * Used to populate stage filter
 * 
 * @param batches - Array of batches
 * @returns Sorted array of unique stages
 */
export const getUniqueStages = (batches: Batch[]): string[] => {
  const stages = new Set(batches.map(b => b.currentStage));
  return Array.from(stages).sort();
};
