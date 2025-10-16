import { useMemo } from 'react';
import { Batch } from '@/components/BatchCard';
import { BatchFilters } from '@/components/BatchFilters';

/**
 * useBatchFilters - Apply comprehensive filtering logic to batch list
 * 
 * Filters batches based on:
 * - Stages (multi-select)
 * - Date range
 * - Volume range
 * - Status (active/completed)
 * - Apple variety
 * - Alcohol content range
 * 
 * @param batches - Array of batches to filter
 * @param filters - Filter criteria
 * @param searchQuery - Text search query
 * @returns Filtered batches
 */
export const useBatchFilters = (
  batches: Batch[],
  filters: BatchFilters,
  searchQuery: string = ''
): Batch[] => {
  return useMemo(() => {
    return batches.filter((batch) => {
      // Text search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          batch.name.toLowerCase().includes(query) ||
          batch.variety.toLowerCase().includes(query) ||
          batch.currentStage.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Stage filter
      if (filters.stages.length > 0) {
        if (!filters.stages.includes(batch.currentStage)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const batchDate = new Date(batch.startDate);
        
        if (filters.dateRange.from && batchDate < filters.dateRange.from) {
          return false;
        }
        
        if (filters.dateRange.to) {
          const endOfDay = new Date(filters.dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          
          if (batchDate > endOfDay) {
            return false;
          }
        }
      }

      // Volume range filter
      if (
        batch.volume < filters.volumeRange[0] ||
        batch.volume > filters.volumeRange[1]
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isCompleted = batch.currentStage === 'Complete' || batch.progress === 100;
        
        if (filters.status === 'completed' && !isCompleted) {
          return false;
        }
        
        if (filters.status === 'active' && isCompleted) {
          return false;
        }
      }

      // Variety filter
      if (filters.variety && batch.variety !== filters.variety) {
        return false;
      }

      // Alcohol range filter (calculated from target_og if available)
      if (batch.target_og) {
        // Simple ABV estimation: (OG - FG) * 131.25
        // Assuming FG ~1.005 for dry cider
        const estimatedABV = (batch.target_og - 1.005) * 131.25;
        
        if (
          estimatedABV < filters.alcoholRange[0] ||
          estimatedABV > filters.alcoholRange[1]
        ) {
          return false;
        }
      }

      return true;
    });
  }, [batches, filters, searchQuery]);
};

/**
 * Extract unique varieties from batch list
 * Used to populate variety filter dropdown
 */
export const getUniqueVarieties = (batches: Batch[]): string[] => {
  const varieties = new Set(batches.map((b) => b.variety));
  return Array.from(varieties).sort();
};
