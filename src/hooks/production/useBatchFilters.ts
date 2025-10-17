import { useMemo } from 'react';
import type { Batch } from '@/components/BatchCard';
import { BatchFilterState } from '@/types/filters';
import { isOverdue as checkIsOverdue } from '@/lib/filterUtils';

/**
 * Filter criteria for batch filtering (extended)
 */
export type BatchFilterCriteria = BatchFilterState;

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
   * Filter batches by status (active/completed/archived/overdue)
   */
  statusFilter: (
    batch: Batch,
    status: 'all' | 'active' | 'completed' | 'archived' | 'overdue'
  ): boolean => {
    if (status === 'all') return true;

    const isCompleted = batch.currentStage === 'Complete' || batch.progress === 100;
    const isArchived = (batch as any).archived === true;
    const isOverdueBatch = checkIsOverdue((batch as any).expected_completion_date);

    if (status === 'completed') return isCompleted;
    if (status === 'active') return !isCompleted && !isArchived;
    if (status === 'archived') return isArchived;
    if (status === 'overdue') return isOverdueBatch && !isCompleted;

    return true;
  },

  /**
   * Filter by varieties (multi-select)
   */
  varietiesFilter: (batch: Batch, varieties: string[]): boolean => {
    if (varieties.length === 0) return true;
    return varieties.includes(batch.variety);
  },

  /**
   * Filter by location
   */
  locationFilter: (batch: Batch, location?: string): boolean => {
    if (!location) return true;
    return (batch as any).location === location;
  },

  /**
   * Filter batches by alcohol content
   */
  alcoholFilter: (batch: Batch, min: number, max: number): boolean => {
    if (min === 0 && max === 12) return true;

    // Use calculated ABV field if available
    const abv = (batch as any).abv;
    if (abv !== null && abv !== undefined) {
      return abv >= min && abv <= max;
    }

    // Fallback: Calculate ABV from target_og if available
    if (batch.target_og) {
      const estimatedABV = batch.target_fg 
        ? (batch.target_og - batch.target_fg) * 131.25
        : (batch.target_og - 1.005) * 131.25;
      return estimatedABV >= min && estimatedABV <= max;
    }

    // If no ABV data, can't filter by alcohol
    return true;
  },
};

/**
 * useBatchFilters - High-performance batch filtering hook
 * 
 * Applies multiple filter criteria to batch list with memoization for performance.
 * Supports text search, stage filtering, date ranges, volume ranges, status, varieties,
 * location, and alcohol content filtering.
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
 *   varieties: ['Bramley', 'Cox'],
 *   alcoholRange: [0, 12],
 *   location: 'Cellar A'
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

    if (filters.varieties.length > 0) {
      filtered = filtered.filter(batch => 
        filterFunctions.varietiesFilter(batch, filters.varieties)
      );
    }

    if (filters.location) {
      filtered = filtered.filter(batch => 
        filterFunctions.locationFilter(batch, filters.location)
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

/**
 * Extract unique locations from batch list
 * Used to populate location filter
 * 
 * @param batches - Array of batches
 * @returns Sorted array of unique locations
 */
export const getUniqueLocations = (batches: Batch[]): string[] => {
  const locations = new Set(
    batches
      .map(b => (b as any).location)
      .filter((loc): loc is string => !!loc)
  );
  return Array.from(locations).sort();
};
