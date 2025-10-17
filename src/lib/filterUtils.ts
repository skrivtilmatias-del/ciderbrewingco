/**
 * Filter utilities for encoding/decoding filters in URLs and applying filters
 */

import { BatchFilterState } from '@/types/filters';

/**
 * Encode filters into URL query params
 */
export const encodeFiltersToURL = (filters: BatchFilterState): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filters.stages.length > 0) {
    params.set('stages', filters.stages.join(','));
  }
  
  if (filters.dateRange.from) {
    params.set('dateFrom', filters.dateRange.from.toISOString());
  }
  
  if (filters.dateRange.to) {
    params.set('dateTo', filters.dateRange.to.toISOString());
  }
  
  if (filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 10000) {
    params.set('volumeMin', filters.volumeRange[0].toString());
    params.set('volumeMax', filters.volumeRange[1].toString());
  }
  
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }
  
  if (filters.varieties.length > 0) {
    params.set('varieties', filters.varieties.join(','));
  }
  
  if (filters.alcoholRange[0] !== 0 || filters.alcoholRange[1] !== 12) {
    params.set('alcoholMin', filters.alcoholRange[0].toString());
    params.set('alcoholMax', filters.alcoholRange[1].toString());
  }
  
  if (filters.location) {
    params.set('location', filters.location);
  }

  return params;
};

/**
 * Decode filters from URL query params
 */
export const decodeFiltersFromURL = (searchParams: URLSearchParams): Partial<BatchFilterState> => {
  const filters: Partial<BatchFilterState> = {};
  
  const stagesParam = searchParams.get('stages');
  if (stagesParam) {
    filters.stages = stagesParam.split(',');
  }
  
  const dateFromParam = searchParams.get('dateFrom');
  const dateToParam = searchParams.get('dateTo');
  if (dateFromParam || dateToParam) {
    filters.dateRange = {
      from: dateFromParam ? new Date(dateFromParam) : undefined,
      to: dateToParam ? new Date(dateToParam) : undefined,
    };
  }
  
  const volumeMinParam = searchParams.get('volumeMin');
  const volumeMaxParam = searchParams.get('volumeMax');
  if (volumeMinParam || volumeMaxParam) {
    filters.volumeRange = [
      volumeMinParam ? parseInt(volumeMinParam) : 0,
      volumeMaxParam ? parseInt(volumeMaxParam) : 10000,
    ];
  }
  
  const statusParam = searchParams.get('status');
  if (statusParam && ['all', 'active', 'completed', 'archived', 'overdue'].includes(statusParam)) {
    filters.status = statusParam as BatchFilterState['status'];
  }
  
  const varietiesParam = searchParams.get('varieties');
  if (varietiesParam) {
    filters.varieties = varietiesParam.split(',');
  }
  
  const alcoholMinParam = searchParams.get('alcoholMin');
  const alcoholMaxParam = searchParams.get('alcoholMax');
  if (alcoholMinParam || alcoholMaxParam) {
    filters.alcoholRange = [
      alcoholMinParam ? parseFloat(alcoholMinParam) : 0,
      alcoholMaxParam ? parseFloat(alcoholMaxParam) : 12,
    ];
  }
  
  const locationParam = searchParams.get('location');
  if (locationParam) {
    filters.location = locationParam;
  }
  
  return filters;
};

/**
 * Count active filters
 */
export const countActiveFilters = (filters: BatchFilterState): number => {
  let count = 0;
  
  if (filters.stages.length > 0) count++;
  if (filters.dateRange.from || filters.dateRange.to) count++;
  if (filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 10000) count++;
  if (filters.status !== 'all') count++;
  if (filters.varieties.length > 0) count++;
  if (filters.alcoholRange[0] !== 0 || filters.alcoholRange[1] !== 12) count++;
  if (filters.location) count++;
  
  return count;
};

/**
 * Check if a batch is overdue based on expected completion date
 */
export const isOverdue = (expectedCompletionDate?: string | null): boolean => {
  if (!expectedCompletionDate) return false;
  return new Date(expectedCompletionDate) < new Date();
};
