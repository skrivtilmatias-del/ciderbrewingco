/**
 * Filter type definitions for batch filtering system
 */

export interface BatchFilterState {
  stages: string[];
  dateRange: { 
    from?: Date; 
    to?: Date;
  };
  volumeRange: [number, number];
  status: 'all' | 'active' | 'completed' | 'archived' | 'overdue';
  varieties: string[];
  alcoholRange: [number, number];
  location?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: BatchFilterState;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_FILTER_STATE: BatchFilterState = {
  stages: [],
  dateRange: {},
  volumeRange: [0, 10000],
  status: 'all',
  varieties: [],
  alcoholRange: [0, 12],
  location: undefined,
};

export const BUILT_IN_PRESETS: Omit<FilterPreset, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Ready to Bottle',
    filters: {
      ...DEFAULT_FILTER_STATE,
      stages: ['Lees Aging', 'Stabilisation', 'Blending'],
      status: 'active',
    },
  },
  {
    name: 'Quick Turnaround',
    filters: {
      ...DEFAULT_FILTER_STATE,
      volumeRange: [0, 500],
      status: 'active',
    },
  },
  {
    name: 'Long-term Aging',
    filters: {
      ...DEFAULT_FILTER_STATE,
      stages: ['Lees Aging'],
      status: 'active',
    },
  },
];
