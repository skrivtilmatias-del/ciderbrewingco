import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Download, 
  Settings,
  Calendar,
  Columns,
  Eye,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Batch } from '@/components/BatchCard';
import { 
  exportBatches, 
  getExportPreview, 
  getFileExtension,
  BATCH_COLUMNS,
  type ExportFormat,
  type ExportOptions 
} from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';

/**
 * Export Dialog Props
 */
interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: Batch[];
  selectedBatches?: Batch[];
}

/**
 * Format configuration with icons and descriptions
 */
const FORMAT_CONFIG = {
  csv: {
    icon: FileText,
    label: 'CSV',
    description: 'Comma-separated values for spreadsheets',
    color: 'text-green-500',
  },
  excel: {
    icon: FileSpreadsheet,
    label: 'Excel',
    description: 'Formatted workbook with multiple sheets',
    color: 'text-emerald-500',
  },
  pdf: {
    icon: FileText,
    label: 'PDF',
    description: 'Professional report with charts',
    color: 'text-red-500',
  },
  json: {
    icon: FileJson,
    label: 'JSON',
    description: 'Full data export for backup/migration',
    color: 'text-blue-500',
  },
} as const;

/**
 * ExportDialog - Comprehensive batch export with multiple formats
 */
export const ExportDialog = ({
  open,
  onOpenChange,
  batches,
  selectedBatches = [],
}: ExportDialogProps) => {
  // State
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    Object.keys(BATCH_COLUMNS)
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [includeBlends, setIncludeBlends] = useState(false);
  const [includeMeasurements, setIncludeMeasurements] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [delimiter, setDelimiter] = useState(',');
  const [formatted, setFormatted] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Determine which batches to export
  const batchesToExport = selectedBatches.length > 0 ? selectedBatches : batches;

  /**
   * Toggle column selection
   */
  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  /**
   * Select/deselect all columns
   */
  const toggleAllColumns = () => {
    if (selectedColumns.length === Object.keys(BATCH_COLUMNS).length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(Object.keys(BATCH_COLUMNS));
    }
  };

  /**
   * Get export preview
   */
  const preview = useMemo(() => {
    if (!showPreview || selectedColumns.length === 0) return null;

    const options: ExportOptions = {
      format,
      batches: batchesToExport,
      columns: selectedColumns,
      dateRange,
      includeBlends,
      includeMeasurements,
      includeNotes,
    };

    return getExportPreview(options);
  }, [showPreview, format, batchesToExport, selectedColumns, dateRange, includeBlends, includeMeasurements, includeNotes]);

  /**
   * Handle export
   */
  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        title: 'No columns selected',
        description: 'Please select at least one column to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        batches: batchesToExport,
        columns: selectedColumns,
        dateRange,
        includeBlends,
        includeMeasurements,
        includeNotes,
        delimiter,
        formatted,
      };

      await exportBatches(options);

      toast({
        title: 'Export successful',
        description: `${batchesToExport.length} batches exported as ${format.toUpperCase()}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Batches
          </DialogTitle>
          <DialogDescription>
            Export {selectedBatches.length > 0 ? `${selectedBatches.length} selected` : batchesToExport.length} batches in your preferred format
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          {/* Format Selection */}
          <TabsContent value="format" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(FORMAT_CONFIG) as Array<[ExportFormat, typeof FORMAT_CONFIG[ExportFormat]]>).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = format === key;

                return (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn('h-8 w-8 mt-1', config.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{config.label}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Format-specific options */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Format Options</Label>
              
              {format === 'csv' && (
                <div className="space-y-2">
                  <Label>Delimiter</Label>
                  <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {format === 'json' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="formatted"
                    checked={formatted}
                    onCheckedChange={(checked) => setFormatted(checked as boolean)}
                  />
                  <Label htmlFor="formatted" className="text-sm font-normal cursor-pointer">
                    Format with indentation (readable)
                  </Label>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Column Selection */}
          <TabsContent value="columns" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Columns</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllColumns}
              >
                {selectedColumns.length === Object.keys(BATCH_COLUMNS).length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BATCH_COLUMNS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedColumns.includes(key)}
                    onCheckedChange={() => toggleColumn(key)}
                  />
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>

            <Badge variant="secondary" className="mt-2">
              {selectedColumns.length} of {Object.keys(BATCH_COLUMNS).length} columns selected
            </Badge>
          </TabsContent>

          {/* Additional Options */}
          <TabsContent value="options" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Date Range (Optional)</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? formatDate(dateRange.from, 'PP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.to ? formatDate(dateRange.to, 'PP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({})}
                  className="text-xs"
                >
                  Clear date range
                </Button>
              )}
            </div>

            <Separator />

            {/* Include Related Data */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Include Related Data</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                />
                <Label htmlFor="notes" className="text-sm font-normal cursor-pointer">
                  Notes and observations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="measurements"
                  checked={includeMeasurements}
                  onCheckedChange={(checked) => setIncludeMeasurements(checked as boolean)}
                />
                <Label htmlFor="measurements" className="text-sm font-normal cursor-pointer">
                  Measurements (OG, FG, pH)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blends"
                  checked={includeBlends}
                  onCheckedChange={(checked) => setIncludeBlends(checked as boolean)}
                />
                <Label htmlFor="blends" className="text-sm font-normal cursor-pointer">
                  Blend information
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {showPreview && preview && (
          <div className="border rounded-lg p-4 max-h-64 overflow-auto bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Preview (first 5 rows)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Hide
              </Button>
            </div>
            <div className="text-xs font-mono overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {preview[0].map((header, i) => (
                      <th key={i} className="text-left p-2 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!showPreview && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={selectedColumns.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export as {FORMAT_CONFIG[format as keyof typeof FORMAT_CONFIG].label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
