import { create } from 'zustand';
import { BatchFilterState, DEFAULT_FILTER_STATE } from '@/types/filters';

interface AppState {
  // Selected items (store IDs only, derive full objects from React Query)
  selectedBatchId: string | null;
  selectedBlendId: string | null;
  
  // UI state
  detailsOpen: boolean;
  blendDetailsOpen: boolean;
  
  // Search queries
  batchSearchQuery: string;
  blendSearchQuery: string;
  tastingSearchQuery: string;
  
  // Filters and sorting
  batchSortOrder: string;
  stageFilter: string;
  batchFilters: BatchFilterState;
  
  // Setters
  setSelectedBatchId: (batchId: string | null) => void;
  setSelectedBlendId: (blendId: string | null) => void;
  setDetailsOpen: (open: boolean) => void;
  setBlendDetailsOpen: (open: boolean) => void;
  setBatchSearchQuery: (query: string) => void;
  setBlendSearchQuery: (query: string) => void;
  setTastingSearchQuery: (query: string) => void;
  setBatchSortOrder: (order: string) => void;
  setStageFilter: (filter: string) => void;
  setBatchFilters: (filters: BatchFilterState) => void;
  clearBatchFilters: () => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedBatchId: null,
  selectedBlendId: null,
  detailsOpen: false,
  blendDetailsOpen: false,
  batchSearchQuery: '',
  blendSearchQuery: '',
  tastingSearchQuery: '',
  batchSortOrder: 'newest',
  stageFilter: 'All',
  batchFilters: DEFAULT_FILTER_STATE,
  
  // Setters
  setSelectedBatchId: (batchId) => set({ selectedBatchId: batchId }),
  setSelectedBlendId: (blendId) => set({ selectedBlendId: blendId }),
  setDetailsOpen: (open) => set({ detailsOpen: open }),
  setBlendDetailsOpen: (open) => set({ blendDetailsOpen: open }),
  setBatchSearchQuery: (query) => set({ batchSearchQuery: query }),
  setBlendSearchQuery: (query) => set({ blendSearchQuery: query }),
  setTastingSearchQuery: (query) => set({ tastingSearchQuery: query }),
  setBatchSortOrder: (order) => set({ batchSortOrder: order }),
  setStageFilter: (filter) => set({ stageFilter: filter }),
  setBatchFilters: (filters) => set({ batchFilters: filters }),
  clearBatchFilters: () => set({ batchFilters: DEFAULT_FILTER_STATE }),
  clearSelection: () => set({ 
    selectedBatchId: null, 
    selectedBlendId: null,
    detailsOpen: false,
    blendDetailsOpen: false
  }),
}));
