import { useMemo } from 'react';
import { Batch } from '@/components/BatchCard';
import { BatchFilterState } from '@/types/filters';
import { useBatchFilters as useProductionBatchFilters, getUniqueVarieties } from './production/useBatchFilters';

/**
 * Simplified useBatchFilters hook that wraps the production version
 * @deprecated Use useBatchFilters from @/hooks/production instead
 */
export const useBatchFilters = (
  batches: Batch[],
  filters: BatchFilterState,
  searchQuery: string = ''
): Batch[] => {
  return useProductionBatchFilters(batches, filters, searchQuery);
};

export { getUniqueVarieties };
