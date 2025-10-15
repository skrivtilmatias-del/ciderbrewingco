import { create } from 'zustand';

interface AppState {
  // Selected items
  selectedBatchId: string | null;
  selectedBlendId: string | null;
  
  // UI state
  detailsOpen: boolean;
  
  // Search and filters
  batchSearchQuery: string;
  blendSearchQuery: string;
  supplierSearchQuery: string;
  
  // Actions
  setSelectedBatchId: (id: string | null) => void;
  setSelectedBlendId: (id: string | null) => void;
  setDetailsOpen: (open: boolean) => void;
  setBatchSearchQuery: (query: string) => void;
  setBlendSearchQuery: (query: string) => void;
  setSupplierSearchQuery: (query: string) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedBatchId: null,
  selectedBlendId: null,
  detailsOpen: false,
  batchSearchQuery: '',
  blendSearchQuery: '',
  supplierSearchQuery: '',
  
  // Actions
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  setSelectedBlendId: (id) => set({ selectedBlendId: id }),
  setDetailsOpen: (open) => set({ detailsOpen: open }),
  setBatchSearchQuery: (query) => set({ batchSearchQuery: query }),
  setBlendSearchQuery: (query) => set({ blendSearchQuery: query }),
  setSupplierSearchQuery: (query) => set({ supplierSearchQuery: query }),
  clearSelection: () => set({ 
    selectedBatchId: null, 
    selectedBlendId: null, 
    detailsOpen: false 
  }),
}));
