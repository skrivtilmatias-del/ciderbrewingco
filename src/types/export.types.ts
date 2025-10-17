/**
 * Export configuration types
 */

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export interface ColumnSelection {
  field: string;
  label: string;
  enabled: boolean;
  width?: number;
  format?: 'text' | 'date' | 'number' | 'decimal' | 'percentage' | 'currency' | 'array';
  group?: string;
}

export interface ExportConfig {
  id?: string;
  name?: string;
  format: ExportFormat;
  batchIds: string[];
  dateRange?: {
    field: 'created_at' | 'started_at' | 'completed_at' | 'updated_at';
    start: Date;
    end: Date;
  };
  columns: ColumnSelection[];
  includeRelatedData: {
    blends: boolean;
    measurements: boolean;
    notes: boolean;
    activities: boolean;
    costs: boolean;
  };
  grouping?: {
    field: 'current_stage' | 'variety' | 'month' | 'year';
    showTotals: boolean;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  pdfOptions?: {
    orientation: 'portrait' | 'landscape';
    includeCharts: boolean;
    includeSummary: boolean;
    pageSize: 'A4' | 'Letter';
  };
  csvOptions?: {
    delimiter: ',' | ';' | '\t' | '|';
    includeHeaders: boolean;
  };
  jsonOptions?: {
    formatted: boolean;
  };
}

export interface ExportTemplate {
  id: string;
  user_id: string;
  name: string;
  config: Partial<ExportConfig>;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentBatch?: string;
  status: 'preparing' | 'exporting' | 'complete' | 'error';
  error?: string;
}

export const COLUMN_GROUPS = {
  basic: 'Basic Info',
  dates: 'Dates',
  measurements: 'Measurements',
  financial: 'Financial',
  metadata: 'Metadata',
} as const;

export const AVAILABLE_COLUMNS: ColumnSelection[] = [
  // Basic Info
  { field: 'name', label: 'Batch Name', group: 'basic', enabled: true, format: 'text' },
  { field: 'variety', label: 'Variety', group: 'basic', enabled: true, format: 'text' },
  { field: 'current_stage', label: 'Current Stage', group: 'basic', enabled: true, format: 'text' },
  { field: 'volume', label: 'Volume (L)', group: 'basic', enabled: true, format: 'number', width: 12 },
  { field: 'progress', label: 'Progress %', group: 'basic', enabled: false, format: 'percentage' },
  { field: 'style', label: 'Style', group: 'basic', enabled: false, format: 'text' },
  { field: 'apple_origin', label: 'Apple Origin', group: 'basic', enabled: false, format: 'text' },
  { field: 'yeast_type', label: 'Yeast Type', group: 'basic', enabled: false, format: 'text' },
  
  // Dates
  { field: 'created_at', label: 'Created Date', group: 'dates', enabled: true, format: 'date', width: 15 },
  { field: 'started_at', label: 'Started Date', group: 'dates', enabled: true, format: 'date', width: 15 },
  { field: 'completed_at', label: 'Completed Date', group: 'dates', enabled: false, format: 'date', width: 15 },
  { field: 'expected_completion_date', label: 'Expected Completion', group: 'dates', enabled: false, format: 'date', width: 15 },
  { field: 'updated_at', label: 'Last Updated', group: 'dates', enabled: false, format: 'date', width: 15 },
  
  // Measurements
  { field: 'target_og', label: 'Target OG', group: 'measurements', enabled: false, format: 'decimal', width: 10 },
  { field: 'target_fg', label: 'Target FG', group: 'measurements', enabled: false, format: 'decimal', width: 10 },
  { field: 'target_ph', label: 'Target pH', group: 'measurements', enabled: false, format: 'decimal', width: 10 },
  { field: 'target_ta', label: 'Target TA', group: 'measurements', enabled: false, format: 'decimal', width: 10 },
  { field: 'target_temp_c', label: 'Target Temp (°C)', group: 'measurements', enabled: false, format: 'number', width: 12 },
  { field: 'abv', label: 'ABV %', group: 'measurements', enabled: false, format: 'decimal', width: 10 },
  
  // Metadata
  { field: 'notes', label: 'Notes', group: 'metadata', enabled: false, format: 'text', width: 30 },
  { field: 'attachments', label: 'Attachments', group: 'metadata', enabled: false, format: 'array', width: 20 },
];

export const PRESET_CONFIGS: Record<string, Partial<ExportConfig>> = {
  quick: {
    name: 'Quick Export',
    columns: AVAILABLE_COLUMNS.filter(c => 
      ['name', 'variety', 'current_stage', 'volume', 'created_at'].includes(c.field)
    ).map(c => ({ ...c, enabled: true })),
    includeRelatedData: {
      blends: false,
      measurements: false,
      notes: false,
      activities: false,
      costs: false,
    },
  },
  detailed: {
    name: 'Detailed Report',
    columns: AVAILABLE_COLUMNS.map(c => ({ ...c, enabled: true })),
    includeRelatedData: {
      blends: true,
      measurements: true,
      notes: true,
      activities: true,
      costs: true,
    },
  },
  financial: {
    name: 'Financial Summary',
    columns: AVAILABLE_COLUMNS.filter(c =>
      ['name', 'variety', 'volume', 'current_stage', 'created_at'].includes(c.field)
    ).map(c => ({ ...c, enabled: true })),
    includeRelatedData: {
      blends: false,
      measurements: false,
      notes: false,
      activities: false,
      costs: true,
    },
  },
  qa: {
    name: 'QA Report',
    columns: AVAILABLE_COLUMNS.filter(c =>
      c.group === 'measurements' || ['name', 'variety', 'current_stage', 'created_at'].includes(c.field)
    ).map(c => ({ ...c, enabled: true })),
    includeRelatedData: {
      blends: false,
      measurements: true,
      notes: true,
      activities: false,
      costs: false,
    },
  },
  schedule: {
    name: 'Production Schedule',
    columns: AVAILABLE_COLUMNS.filter(c =>
      c.group === 'dates' || ['name', 'variety', 'current_stage', 'progress'].includes(c.field)
    ).map(c => ({ ...c, enabled: true })),
    includeRelatedData: {
      blends: false,
      measurements: false,
      notes: false,
      activities: true,
      costs: false,
    },
  },
};
