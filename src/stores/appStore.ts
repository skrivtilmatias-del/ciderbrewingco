import { create } from 'zustand';
import { Batch } from '@/components/BatchCard';

interface AppState {
  // Selected items
  selectedBatch: Batch | null;
  selectedBlend: any | null;
  
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
  setSelectedBatch: (batch: Batch | null) => void;
  setSelectedBlend: (blend: any | null) => void;
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
  selectedBatch: null,
  selectedBlend: null,
  detailsOpen: false,
  blendDetailsOpen: false,
  batchSearchQuery: '',
  blendSearchQuery: '',
  tastingSearchQuery: '',
  batchSortOrder: 'newest',
  stageFilter: 'All',
  
  // Setters
  setSelectedBatch: (batch) => set({ selectedBatch: batch }),
  setSelectedBlend: (blend) => set({ selectedBlend: blend }),
  setDetailsOpen: (open) => set({ detailsOpen: open }),
  setBlendDetailsOpen: (open) => set({ blendDetailsOpen: open }),
  setBatchSearchQuery: (query) => set({ batchSearchQuery: query }),
  setBlendSearchQuery: (query) => set({ blendSearchQuery: query }),
  setTastingSearchQuery: (query) => set({ tastingSearchQuery: query }),
  setBatchSortOrder: (order) => set({ batchSortOrder: order }),
  setStageFilter: (filter) => set({ stageFilter: filter }),
  clearSelection: () => set({ 
    selectedBatch: null, 
    selectedBlend: null,
    detailsOpen: false,
    blendDetailsOpen: false
  }),
}));
