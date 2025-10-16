import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Batch } from "@/components/BatchCard";

interface BatchComparisonState {
  selectedBatchIds: string[];
  comparisonPresets: Array<{
    id: string;
    name: string;
    batchIds: string[];
    createdAt: string;
  }>;
  visibleMetrics: {
    basicDetails: boolean;
    timeline: boolean;
    measurements: boolean;
    notes: boolean;
    costs: boolean;
    tasting: boolean;
  };
}

interface BatchComparisonActions {
  toggleBatchSelection: (batchId: string) => void;
  clearSelection: () => void;
  setSelectedBatches: (batchIds: string[]) => void;
  toggleMetric: (metric: keyof BatchComparisonState["visibleMetrics"]) => void;
  savePreset: (name: string, batchIds: string[]) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

type BatchComparisonStore = BatchComparisonState & BatchComparisonActions;

export const useBatchComparisonStore = create<BatchComparisonStore>()(
  persist(
    (set, get) => ({
      // State
      selectedBatchIds: [],
      comparisonPresets: [],
      visibleMetrics: {
        basicDetails: true,
        timeline: true,
        measurements: true,
        notes: true,
        costs: false,
        tasting: false,
      },

      // Actions
      toggleBatchSelection: (batchId: string) => {
        const { selectedBatchIds } = get();
        const isSelected = selectedBatchIds.includes(batchId);

        if (isSelected) {
          set({ selectedBatchIds: selectedBatchIds.filter((id) => id !== batchId) });
        } else {
          // Maximum 4 batches for comparison
          if (selectedBatchIds.length >= 4) {
            return;
          }
          set({ selectedBatchIds: [...selectedBatchIds, batchId] });
        }
      },

      clearSelection: () => {
        set({ selectedBatchIds: [] });
      },

      setSelectedBatches: (batchIds: string[]) => {
        set({ selectedBatchIds: batchIds.slice(0, 4) });
      },

      toggleMetric: (metric) => {
        set((state) => ({
          visibleMetrics: {
            ...state.visibleMetrics,
            [metric]: !state.visibleMetrics[metric],
          },
        }));
      },

      savePreset: (name: string, batchIds: string[]) => {
        const preset = {
          id: crypto.randomUUID(),
          name,
          batchIds,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          comparisonPresets: [...state.comparisonPresets, preset],
        }));
      },

      loadPreset: (presetId: string) => {
        const { comparisonPresets } = get();
        const preset = comparisonPresets.find((p) => p.id === presetId);
        if (preset) {
          set({ selectedBatchIds: preset.batchIds });
        }
      },

      deletePreset: (presetId: string) => {
        set((state) => ({
          comparisonPresets: state.comparisonPresets.filter((p) => p.id !== presetId),
        }));
      },
    }),
    {
      name: "batch-comparison-storage",
    }
  )
);
