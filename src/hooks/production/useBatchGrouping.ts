import { useState, useMemo, useCallback } from 'react';
import type { Batch } from '@/components/BatchCard';

/**
 * Grouping key options
 */
export type GroupByOption = 'stage' | 'variety' | 'month' | 'volume' | 'status';

/**
 * Batch group with metadata
 */
export interface BatchGroup {
  /** Group key/identifier */
  key: string;
  /** Display label for the group */
  label: string;
  /** Batches in this group */
  batches: Batch[];
  /** Group statistics */
  stats: {
    count: number;
    totalVolume: number;
    avgProgress: number;
    completedCount: number;
  };
}

/**
 * Get month name from date
 */
const getMonthName = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Get volume category
 */
const getVolumeCategory = (volume: number): string => {
  if (volume < 100) return 'Small (< 100L)';
  if (volume < 500) return 'Medium (100-500L)';
  if (volume < 1000) return 'Large (500-1000L)';
  return 'Extra Large (> 1000L)';
};

/**
 * Calculate group statistics
 */
const calculateGroupStats = (batches: Batch[]) => {
  const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);
  const avgProgress = batches.reduce((sum, b) => sum + b.progress, 0) / batches.length;
  const completedCount = batches.filter(
    b => b.currentStage === 'Complete' || b.progress === 100
  ).length;

  return {
    count: batches.length,
    totalVolume: Math.round(totalVolume),
    avgProgress: Math.round(avgProgress),
    completedCount,
  };
};

/**
 * useBatchGrouping - Group and organize batches with expand/collapse state
 * 
 * Features:
 * - Group by stage, variety, month, volume, or status
 * - Collapse/expand individual groups
 * - Group statistics (count, volume, progress)
 * - Sorted groups
 * 
 * @param batches - Array of batches to group
 * @param initialGroupBy - Initial grouping option (default: 'stage')
 * 
 * @returns Object with groups and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   groups,
 *   groupBy,
 *   setGroupBy,
 *   isCollapsed,
 *   toggleGroup,
 *   expandAll,
 *   collapseAll 
 * } = useBatchGrouping(batches, 'stage');
 * 
 * // Render groups
 * {groups.map(group => (
 *   <div key={group.key}>
 *     <h3 onClick={() => toggleGroup(group.key)}>
 *       {group.label} ({group.stats.count})
 *     </h3>
 *     {!isCollapsed(group.key) && (
 *       <BatchList batches={group.batches} />
 *     )}
 *   </div>
 * ))}
 * ```
 */
export const useBatchGrouping = (
  batches: Batch[],
  initialGroupBy: GroupByOption = 'stage'
) => {
  const [groupBy, setGroupBy] = useState<GroupByOption>(initialGroupBy);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /**
   * Group batches based on selected option
   */
  const groups = useMemo((): BatchGroup[] => {
    const groupMap = new Map<string, Batch[]>();

    // Group batches
    batches.forEach(batch => {
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'stage':
          key = batch.currentStage;
          label = batch.currentStage;
          break;

        case 'variety':
          key = batch.variety;
          label = batch.variety;
          break;

        case 'month':
          key = getMonthName(batch.startDate);
          label = getMonthName(batch.startDate);
          break;

        case 'volume':
          key = getVolumeCategory(batch.volume);
          label = getVolumeCategory(batch.volume);
          break;

        case 'status':
          const isCompleted = batch.currentStage === 'Complete' || batch.progress === 100;
          key = isCompleted ? 'completed' : 'active';
          label = isCompleted ? 'Completed' : 'Active';
          break;

        default:
          key = 'other';
          label = 'Other';
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(batch);
    });

    // Convert to array and add statistics
    const groupArray: BatchGroup[] = Array.from(groupMap.entries()).map(
      ([key, batches]) => ({
        key,
        label: key,
        batches,
        stats: calculateGroupStats(batches),
      })
    );

    // Sort groups
    if (groupBy === 'stage') {
      // Sort by stage order
      const stageOrder = [
        'Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling',
        'Enzymes', 'Pitching', 'Fermentation', 'Cold Crash', 'Racking', 'Malolactic',
        'Stabilisation', 'Blending', 'Backsweetening', 'Bottling',
        'Conditioning', 'Lees Aging', 'Tasting', 'Complete'
      ];
      groupArray.sort((a, b) => {
        const aIndex = stageOrder.indexOf(a.key);
        const bIndex = stageOrder.indexOf(b.key);
        return aIndex - bIndex;
      });
    } else if (groupBy === 'month') {
      // Sort by date (newest first)
      groupArray.sort((a, b) => {
        const aDate = new Date(a.batches[0].startDate);
        const bDate = new Date(b.batches[0].startDate);
        return bDate.getTime() - aDate.getTime();
      });
    } else {
      // Sort alphabetically
      groupArray.sort((a, b) => a.label.localeCompare(b.label));
    }

    return groupArray;
  }, [batches, groupBy]);

  /**
   * Check if a group is collapsed
   */
  const isCollapsed = useCallback((groupKey: string): boolean => {
    return collapsedGroups.has(groupKey);
  }, [collapsedGroups]);

  /**
   * Toggle collapse state for a group
   */
  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  /**
   * Expand all groups
   */
  const expandAll = useCallback(() => {
    setCollapsedGroups(new Set());
  }, []);

  /**
   * Collapse all groups
   */
  const collapseAll = useCallback(() => {
    const allKeys = groups.map(g => g.key);
    setCollapsedGroups(new Set(allKeys));
  }, [groups]);

  /**
   * Get total statistics across all groups
   */
  const totalStats = useMemo(() => {
    return {
      groupCount: groups.length,
      totalBatches: batches.length,
      totalVolume: batches.reduce((sum, b) => sum + b.volume, 0),
      avgProgress: batches.reduce((sum, b) => sum + b.progress, 0) / batches.length || 0,
      completedBatches: batches.filter(
        b => b.currentStage === 'Complete' || b.progress === 100
      ).length,
    };
  }, [groups, batches]);

  return {
    /** Array of batch groups with statistics */
    groups,
    /** Current grouping option */
    groupBy,
    /** Change grouping option */
    setGroupBy,
    /** Check if group is collapsed */
    isCollapsed,
    /** Toggle collapse state for a group */
    toggleGroup,
    /** Expand all groups */
    expandAll,
    /** Collapse all groups */
    collapseAll,
    /** Total statistics across all groups */
    totalStats,
  };
};
