/**
 * Production Hooks - Centralized batch management business logic
 * 
 * This module exports focused, reusable hooks for batch operations:
 * - Filtering and sorting
 * - Multi-selection
 * - CRUD operations
 * - Search functionality
 * - Grouping and organization
 * - Activity feed
 * 
 * @module hooks/production
 */

export { useBatchFilters, getUniqueVarieties, getUniqueStages } from './useBatchFilters';
export type { BatchFilterCriteria } from './useBatchFilters';

export { useBatchSelection } from './useBatchSelection';

export { useBatchActions } from './useBatchActions';

export { useBatchSearch } from './useBatchSearch';
export type { SearchResult } from './useBatchSearch';

export { useBatchGrouping } from './useBatchGrouping';
export type { BatchGroup, GroupByOption } from './useBatchGrouping';

export { useBatchActivityFeed, getUniqueUsers } from './useBatchActivityFeed';
export type { ActivityItem, ActivityFilters, ActivityType } from './useBatchActivityFeed';
