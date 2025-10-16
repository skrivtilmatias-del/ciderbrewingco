import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Batch } from '@/components/BatchCard';

/**
 * Maximum number of recent searches to store
 */
const MAX_SEARCH_HISTORY = 10;

/**
 * Search result with highlighted match
 */
export interface SearchResult {
  batch: Batch;
  matchField: 'name' | 'variety' | 'stage';
  matchText: string;
}

/**
 * useBatchSearch - Advanced batch search with debouncing and history
 * 
 * Features:
 * - Debounced search (300ms delay)
 * - Search history persistence (localStorage)
 * - Search suggestions based on history
 * - Highlight matching text
 * - Search across name, variety, and stage
 * 
 * @param batches - Array of batches to search
 * @param initialQuery - Initial search query
 * 
 * @returns Object with search state and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   query, 
 *   setQuery, 
 *   debouncedQuery,
 *   results,
 *   history,
 *   suggestions 
 * } = useBatchSearch(batches);
 * ```
 */
export const useBatchSearch = (
  batches: Batch[],
  initialQuery: string = ''
) => {
  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<string[]>([]);

  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 300);

  /**
   * Load search history from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('batchSearchHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  /**
   * Add query to search history when debounced query changes
   */
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return;

    setHistory(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(item => item !== debouncedQuery);
      const updated = [debouncedQuery, ...filtered].slice(0, MAX_SEARCH_HISTORY);

      // Persist to localStorage
      try {
        localStorage.setItem('batchSearchHistory', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }

      return updated;
    });
  }, [debouncedQuery]);

  /**
   * Search batches and return results with match info
   */
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery) return [];

    const normalizedQuery = debouncedQuery.toLowerCase();

    return batches
      .filter(batch => {
        return (
          batch.name.toLowerCase().includes(normalizedQuery) ||
          batch.variety.toLowerCase().includes(normalizedQuery) ||
          batch.currentStage.toLowerCase().includes(normalizedQuery)
        );
      })
      .map(batch => {
        // Determine which field matched
        const name = batch.name.toLowerCase();
        const variety = batch.variety.toLowerCase();
        const stage = batch.currentStage.toLowerCase();

        let matchField: SearchResult['matchField'] = 'name';
        let matchText = batch.name;

        if (name.includes(normalizedQuery)) {
          matchField = 'name';
          matchText = batch.name;
        } else if (variety.includes(normalizedQuery)) {
          matchField = 'variety';
          matchText = batch.variety;
        } else if (stage.includes(normalizedQuery)) {
          matchField = 'stage';
          matchText = batch.currentStage;
        }

        return {
          batch,
          matchField,
          matchText,
        };
      });
  }, [batches, debouncedQuery]);

  /**
   * Get search suggestions based on history
   */
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return history.slice(0, 5);

    const normalizedQuery = query.toLowerCase();
    return history
      .filter(item => item.toLowerCase().includes(normalizedQuery))
      .slice(0, 5);
  }, [query, history]);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('batchSearchHistory');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  /**
   * Highlight matching text in a string
   */
  const highlightMatch = useCallback((text: string, query: string): string => {
    if (!query) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>${after}`;
  }, []);

  return {
    /** Current search query */
    query,
    /** Update search query */
    setQuery,
    /** Debounced search query (300ms delay) */
    debouncedQuery,
    /** Search results with match info */
    results,
    /** Number of results found */
    resultCount: results.length,
    /** Search history (recent searches) */
    history,
    /** Search suggestions based on history */
    suggestions,
    /** Clear search history */
    clearHistory,
    /** Highlight matching text helper */
    highlightMatch,
  };
};
