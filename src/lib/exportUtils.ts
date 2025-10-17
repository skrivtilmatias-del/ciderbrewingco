import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format as formatDateFns, parseISO } from 'date-fns';
import type { Batch } from '@/types/batch.types';
import type { ExportConfig, ColumnSelection } from '@/types/export.types';
import { supabase } from '@/integrations/supabase/client';

// Re-export types for convenience
export type { ExportFormat, ExportConfig, ColumnSelection } from '@/types/export.types';

/**
 * Export options configuration (backwards compatible)
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  batches: Batch[];
  columns: string[] | ColumnSelection[];
  includeBlends?: boolean;
  includeMeasurements?: boolean;
  includeNotes?: boolean;
  includeActivities?: boolean;
  includeCosts?: boolean;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  delimiter?: string;
  formatted?: boolean;
  config?: ExportConfig;
}

/**
 * Column definitions for batch data (backwards compatible)
 */
export const BATCH_COLUMNS = {
  id: 'Batch ID',
  name: 'Name',
  variety: 'Variety',
  apple_origin: 'Apple Origin',
  volume: 'Volume (L)',
  current_stage: 'Current Stage',
  started_at: 'Start Date',
  yeast_type: 'Yeast Type',
  target_og: 'Target OG',
  target_fg: 'Target FG',
  target_ph: 'Target pH',
  notes: 'Notes',
  progress: 'Progress %',
  style: 'Style',
  created_at: 'Created',
  completed_at: 'Completed',
  abv: 'ABV %',
} as const;

/**
 * Format value based on column format type
 */
export const formatValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return '';
  
  switch (format) {
    case 'date':
      try {
        const date = typeof value === 'string' ? parseISO(value) : value;
        return formatDateFns(date, 'MMM dd, yyyy');
      } catch {
        return String(value);
      }
    
    case 'decimal':
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    
    case 'percentage':
      return typeof value === 'number' ? `${value}%` : String(value);
    
    case 'currency':
      return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value);
    
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value);
    
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value);
    
    default:
      return String(value);
  }
};

/**
 * Export batches as CSV
 */
export const exportToCSV = (options: ExportOptions): void => {
  const { batches, columns, delimiter = ',' } = options;
  
  // Filter batches by date range if specified
  const filteredBatches = filterBatchesByDate(batches, options.dateRange);
  
  // Create header row
  const headers = columns
    .map(col => BATCH_COLUMNS[col as keyof typeof BATCH_COLUMNS] || col)
    .join(delimiter);
  
  // Create data rows
  const rows = filteredBatches.map(batch => {
    return columns.map(col => {
      const value = getBatchValue(batch, col);
      // Escape values that contain the delimiter
      const stringValue = String(value || '');
      return stringValue.includes(delimiter) ? `"${stringValue}"` : stringValue;
    }).join(delimiter);
  });
  
  // Combine header and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `batches-export-${getTimestamp()}.csv`);
};

/**
 * Export batches as Excel (.xlsx)
 */
export const exportToExcel = (options: ExportOptions): void => {
  const { batches, columns, includeBlends, includeMeasurements } = options;
  
  // Filter batches by date range
  const filteredBatches = filterBatchesByDate(batches, options.dateRange);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // === Batches Sheet ===
  const batchData = filteredBatches.map(batch => {
    const row: any = {};
    columns.forEach(col => {
      const header = BATCH_COLUMNS[col as keyof typeof BATCH_COLUMNS] || col;
      row[header] = getBatchValue(batch, col);
    });
    return row;
  });
  
  const batchSheet = XLSX.utils.json_to_sheet(batchData);
  
  // Set column widths
  const colWidths = columns.map(() => ({ wch: 15 }));
  batchSheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, batchSheet, 'Batches');
  
  // === Summary Sheet ===
  const summary = [
    ['Export Summary', ''],
    ['Total Batches', filteredBatches.length],
    ['Export Date', new Date().toLocaleDateString()],
    ['', ''],
    ['Stage Distribution', 'Count'],
  ];
  
  // Add stage distribution
  const stageCounts = filteredBatches.reduce((acc, batch) => {
    acc[batch.current_stage] = (acc[batch.current_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(stageCounts).forEach(([stage, count]) => {
    summary.push([stage, count]);
  });
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Write file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `batches-export-${getTimestamp()}.xlsx`);
};

/**
 * Export batches as PDF report
 */
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const { batches, columns } = options;
  
  // Filter batches by date range
  const filteredBatches = filterBatchesByDate(batches, options.dateRange);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  
  // === Header ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Export Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // === Summary ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Batches: ${filteredBatches.length}`, 20, yPosition);
  yPosition += 6;
  
  // Stage distribution
  const stageCounts = filteredBatches.reduce((acc, batch) => {
    acc[batch.current_stage] = (acc[batch.current_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  doc.text('Stage Distribution:', 20, yPosition);
  yPosition += 5;
  
  Object.entries(stageCounts).forEach(([stage, count]) => {
    doc.text(`  ${stage}: ${count}`, 25, yPosition);
    yPosition += 5;
  });
  
  yPosition += 10;
  
  // === Batch Details ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Details', 20, yPosition);
  yPosition += 10;
  
  // Add each batch
  filteredBatches.slice(0, 10).forEach((batch, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${batch.name}`, 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Add selected columns
    columns.slice(0, 6).forEach(col => {
      if (col !== 'id' && col !== 'name') {
        const label = BATCH_COLUMNS[col as keyof typeof BATCH_COLUMNS] || col;
        const value = getBatchValue(batch, col);
        doc.text(`${label}: ${value || 'N/A'}`, 25, yPosition);
        yPosition += 5;
      }
    });
    
    yPosition += 5;
  });
  
  // Footer
  if (filteredBatches.length > 10) {
    doc.setFontSize(8);
    doc.text(`Showing first 10 of ${filteredBatches.length} batches`, 20, yPosition);
  }
  
  // Save PDF
  doc.save(`batches-export-${getTimestamp()}.pdf`);
};

/**
 * Export batches as JSON
 */
export const exportToJSON = (options: ExportOptions): void => {
  const { batches, formatted = true, includeBlends, includeMeasurements, includeNotes } = options;
  
  // Filter batches by date range
  const filteredBatches = filterBatchesByDate(batches, options.dateRange);
  
  // Create export object
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalBatches: filteredBatches.length,
      version: '1.0',
    },
    batches: filteredBatches.map(batch => ({
      id: batch.id,
      name: batch.name,
      variety: batch.variety,
      apple_origin: batch.apple_origin,
      volume: batch.volume,
      current_stage: batch.current_stage,
      started_at: batch.started_at,
      yeast_type: batch.yeast_type,
      target_og: batch.target_og,
      target_fg: batch.target_fg,
      target_ph: batch.target_ph,
      notes: includeNotes ? batch.notes : undefined,
    })),
  };
  
  // Convert to JSON string
  const json = formatted 
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
  
  // Create blob and download
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `batches-export-${getTimestamp()}.json`);
};

/**
 * Main export function - dispatches to format-specific exporters
 */
export const exportBatches = async (options: ExportOptions): Promise<void> => {
  switch (options.format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    case 'pdf':
      await exportToPDF(options);
      break;
    case 'json':
      exportToJSON(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

/**
 * Helper: Get batch value by column key
 */
const getBatchValue = (batch: Batch, column: string): any => {
  const mapping: Record<string, any> = {
    id: batch.id,
    name: batch.name,
    variety: batch.variety,
    apple_origin: batch.apple_origin,
    volume: batch.volume,
    current_stage: batch.current_stage,
    started_at: batch.started_at ? new Date(batch.started_at).toLocaleDateString() : '',
    yeast_type: batch.yeast_type,
    target_og: batch.target_og,
    target_fg: batch.target_fg,
    target_ph: batch.target_ph,
    notes: batch.notes,
    progress: batch.progress,
    style: batch.style,
    created_at: batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '',
    completed_at: batch.completed_at ? new Date(batch.completed_at).toLocaleDateString() : '',
  };
  
  return mapping[column] ?? batch[column as keyof Batch];
};

/**
 * Helper: Filter batches by date range
 */
const filterBatchesByDate = (batches: Batch[], dateRange?: { from?: Date; to?: Date }): Batch[] => {
  if (!dateRange?.from && !dateRange?.to) {
    return batches;
  }
  
  return batches.filter(batch => {
    const batchDate = new Date(batch.started_at || batch.created_at);
    
    if (dateRange.from && batchDate < dateRange.from) {
      return false;
    }
    
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      if (batchDate > endOfDay) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Helper: Get timestamp for filename
 */
const getTimestamp = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get file extension for format
 */
export const getFileExtension = (format: 'csv' | 'excel' | 'pdf' | 'json'): string => {
  const extensions = {
    csv: '.csv',
    excel: '.xlsx',
    pdf: '.pdf',
    json: '.json',
  };
  
  return extensions[format];
};

/**
 * Get preview of export data (first 5 rows)
 */
export const getExportPreview = (options: ExportOptions): string[][] => {
  const { batches, columns } = options;
  const filteredBatches = filterBatchesByDate(batches, options.dateRange);
  
  // Header row
  const headers = columns.map(col => BATCH_COLUMNS[col as keyof typeof BATCH_COLUMNS] || col);
  
  // Data rows (first 5)
  const rows = filteredBatches.slice(0, 5).map(batch => {
    return columns.map(col => String(getBatchValue(batch, col) || ''));
  });
  
  return [headers, ...rows];
};
