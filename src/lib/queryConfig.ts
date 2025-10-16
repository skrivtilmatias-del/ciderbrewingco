import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query configuration for optimal caching and performance
 */
export const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Data stays fresh for 5 minutes without refetching
    staleTime: 5 * 60 * 1000,
    
    // Keep unused data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    
    // Only refetch critical data on window focus (override per query)
    refetchOnWindowFocus: false,
    
    // Trust the cache on mount instead of always refetching
    refetchOnMount: false,
    
    // Retry failed requests twice with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

/**
 * Specific configurations for different data types
 */
export const queryConfigs = {
  batches: {
    staleTime: 3 * 60 * 1000, // 3 minutes - changes frequently
    refetchOnWindowFocus: true, // Critical production data
    refetchOnMount: false,
  },
  blends: {
    staleTime: 5 * 60 * 1000, // 5 minutes - more stable
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  suppliers: {
    staleTime: 15 * 60 * 1000, // 15 minutes - rarely changes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  tastingNotes: {
    staleTime: 1 * 60 * 1000, // 1 minute - user-generated, changes often
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  },
  analytics: {
    staleTime: 10 * 60 * 1000, // 10 minutes - computed data, expensive
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  batchLogs: {
    staleTime: 2 * 60 * 1000, // 2 minutes - frequently updated
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  },
  inventory: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
};

/**
 * Typed query keys factory for consistent cache management
 * Benefits:
 * - Type-safe query keys
 * - Centralized key management
 * - Easy cache invalidation
 * - Prevents typos and inconsistencies
 */
export const queryKeys = {
  // Batches
  batches: {
    all: () => ['batches'] as const,
    byId: (id: string) => ['batches', id] as const,
    byStage: (stage: string) => ['batches', 'stage', stage] as const,
    byVariety: (variety: string) => ['batches', 'variety', variety] as const,
    active: () => ['batches', 'active'] as const,
    completed: () => ['batches', 'completed'] as const,
  },
  
  // Batch Logs
  batchLogs: {
    all: () => ['batch-logs'] as const,
    byBatch: (batchId: string) => ['batch-logs', batchId] as const,
    byStage: (batchId: string, stage: string) => ['batch-logs', batchId, 'stage', stage] as const,
  },
  
  // Blends
  blends: {
    all: () => ['blend-batches'] as const,
    byId: (id: string) => ['blend-batches', id] as const,
    components: (blendId: string) => ['blend-batches', blendId, 'components'] as const,
  },
  
  // Suppliers
  suppliers: {
    all: () => ['suppliers'] as const,
    byId: (id: string) => ['suppliers', id] as const,
    active: () => ['suppliers', 'active'] as const,
    contracts: (supplierId: string) => ['suppliers', supplierId, 'contracts'] as const,
    deliveries: (supplierId: string) => ['suppliers', supplierId, 'deliveries'] as const,
  },
  
  // Tasting Analysis
  tasting: {
    all: () => ['tasting-analysis'] as const,
    byBlend: (blendId: string) => ['tasting-analysis', 'blend', blendId] as const,
    byId: (id: string) => ['tasting-analysis', id] as const,
    recent: () => ['tasting-analysis', 'recent'] as const,
  },
  
  // Inventory
  inventory: {
    lots: () => ['inventory-lots'] as const,
    movements: () => ['inventory-movements'] as const,
    thresholds: () => ['inventory-thresholds'] as const,
    byBlend: (blendId: string) => ['inventory-lots', 'blend', blendId] as const,
  },
  
  // Analytics (expensive computed queries)
  analytics: {
    production: () => ['analytics', 'production'] as const,
    suppliers: () => ['analytics', 'suppliers'] as const,
    quality: () => ['analytics', 'quality'] as const,
    inventory: () => ['analytics', 'inventory'] as const,
  },
  
  // Floor Plans
  floorPlans: {
    all: () => ['floor-plans'] as const,
    byId: (id: string) => ['floor-plans', id] as const,
  },
  
  // Cost Calculations
  costs: {
    bom: () => ['batch-bom'] as const,
    byBatch: (batchId: string) => ['batch-bom', 'batch', batchId] as const,
    byBlend: (blendId: string) => ['batch-bom', 'blend', blendId] as const,
  },
};

/**
 * Create a configured QueryClient instance
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
};

/**
 * Utility to merge query config with custom options
 */
export const mergeQueryConfig = <T extends Record<string, any>>(
  configKey: keyof typeof queryConfigs,
  customOptions?: T
) => {
  return {
    ...queryConfigs[configKey],
    ...customOptions,
  };
};
