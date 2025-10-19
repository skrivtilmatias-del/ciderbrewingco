import { create } from 'zustand';

interface AppState {
  // Selected items (now using IDs for better performance)
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
  
  // Setters
  setSelectedBatchId: (id: string | null) => void;
  setSelectedBlendId: (id: string | null) => void;
  setDetailsOpen: (open: boolean) => void;
  setBlendDetailsOpen: (open: boolean) => void;
  setBatchSearchQuery: (query: string) => void;
  setBlendSearchQuery: (query: string) => void;
  setTastingSearchQuery: (query: string) => void;
  setBatchSortOrder: (order: string) => void;
  setStageFilter: (filter: string) => void;
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
  
  // Setters
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  setSelectedBlendId: (id) => set({ selectedBlendId: id }),
  setDetailsOpen: (open) => set({ detailsOpen: open }),
  setBlendDetailsOpen: (open) => set({ blendDetailsOpen: open }),
  setBatchSearchQuery: (query) => set({ batchSearchQuery: query }),
  setBlendSearchQuery: (query) => set({ blendSearchQuery: query }),
  setTastingSearchQuery: (query) => set({ tastingSearchQuery: query }),
  setBatchSortOrder: (order) => set({ batchSortOrder: order }),
  setStageFilter: (filter) => set({ stageFilter: filter }),
  clearSelection: () => set({ 
    selectedBatchId: null, 
    selectedBlendId: null,
    detailsOpen: false,
    blendDetailsOpen: false
  }),
}));
