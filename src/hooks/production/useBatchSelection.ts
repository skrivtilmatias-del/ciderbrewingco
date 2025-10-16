import { useState, useCallback, useEffect } from 'react';
import type { Batch } from '@/components/BatchCard';

/**
 * useBatchSelection - Manage multi-select state for batches
 * 
 * Provides functionality for selecting multiple batches with keyboard shortcuts:
 * - Click checkbox to toggle selection
 * - Ctrl+A to select all
 * - Escape to clear selection
 * 
 * @param batches - Array of available batches
 * @param maxSelection - Maximum number of batches that can be selected (default: unlimited)
 * 
 * @returns Object with selection state and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedBatches, 
 *   isSelected,
 *   toggleSelection,
 *   selectAll,
 *   clearSelection 
 * } = useBatchSelection(batches, 4);
 * ```
 */
export const useBatchSelection = (
  batches: Batch[],
  maxSelection?: number
) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());

  /**
   * Check if a batch is currently selected
   */
  const isSelected = useCallback((batchId: string): boolean => {
    return selectedBatchIds.has(batchId);
  }, [selectedBatchIds]);

  /**
   * Toggle selection state for a batch
   * Respects maxSelection limit
   */
  const toggleSelection = useCallback((batchId: string) => {
    setSelectedBatchIds(prev => {
      const next = new Set(prev);
      
      if (next.has(batchId)) {
        // Deselect
        next.delete(batchId);
      } else {
        // Select (respect max limit)
        if (maxSelection && next.size >= maxSelection) {
          console.warn(`Maximum ${maxSelection} batches can be selected`);
          return prev;
        }
        next.add(batchId);
      }
      
      return next;
    });
  }, [maxSelection]);

  /**
   * Select all batches (up to maxSelection limit)
   */
  const selectAll = useCallback(() => {
    setSelectedBatchIds(() => {
      const batchIds = batches.map(b => b.id);
      
      if (maxSelection && batchIds.length > maxSelection) {
        // Only select first N batches if limit exists
        return new Set(batchIds.slice(0, maxSelection));
      }
      
      return new Set(batchIds);
    });
  }, [batches, maxSelection]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedBatchIds(new Set());
  }, []);

  /**
   * Get array of selected batch objects
   */
  const selectedBatches = useCallback((): Batch[] => {
    return batches.filter(batch => selectedBatchIds.has(batch.id));
  }, [batches, selectedBatchIds]);

  /**
   * Keyboard shortcuts
   * - Ctrl+A / Cmd+A: Select all
   * - Escape: Clear selection
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      
      // Escape - Clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAll, clearSelection]);

  return {
    /** Set of selected batch IDs */
    selectedBatchIds,
    /** Array of selected batch objects */
    selectedBatches: selectedBatches(),
    /** Number of selected batches */
    selectedCount: selectedBatchIds.size,
    /** Check if a batch is selected */
    isSelected,
    /** Toggle selection for a batch */
    toggleSelection,
    /** Select all batches (up to limit) */
    selectAll,
    /** Clear all selections */
    clearSelection,
    /** Whether max selection limit is reached */
    isMaxReached: maxSelection ? selectedBatchIds.size >= maxSelection : false,
  };
};
