import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, Save, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { STAGES } from '@/constants/ciderStages';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Filter preset interface
interface FilterPreset {
  id: string;
  name: string;
  filters: BatchFilters;
}

// Batch filters interface
export interface BatchFilters {
  stages: string[];
  dateRange: { from?: Date; to?: Date };
  volumeRange: [number, number];
  status: 'all' | 'active' | 'completed';
  variety: string;
  alcoholRange: [number, number];
}

// Default filter values
const DEFAULT_FILTERS: BatchFilters = {
  stages: [],
  dateRange: {},
  volumeRange: [0, 10000],
  status: 'all',
  variety: '',
  alcoholRange: [0, 12],
};

// Date range presets
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'This year', days: 365 },
];

// Local storage keys
const PRESETS_KEY = 'batch-filter-presets';

interface BatchFiltersProps {
  filters: BatchFilters;
  onChange: (filters: BatchFilters) => void;
  /** Total number of batches before filtering */
  totalCount: number;
  /** Number of batches after filtering */
  filteredCount: number;
  /** Available varieties for dropdown */
  varieties: string[];
}

/**
 * BatchFilters - Comprehensive filtering UI for batch lists
 * 
 * Features:
 * - Multi-category filtering (stage, date, volume, status, variety, alcohol)
 * - URL query param persistence (shareable, bookmarkable)
 * - Filter presets (save/load common filter combinations)
 * - Active filter chips (dismissible)
 * - Collapsible panel (mobile-friendly)
 * - Real-time result count
 * - Smooth animations
 */
export const BatchFilters = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
  varieties,
}: BatchFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  }, []);

  // Sync filters to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.stages.length > 0) {
      params.set('stages', filters.stages.join(','));
    }
    if (filters.dateRange.from) {
      params.set('dateFrom', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange.to) {
      params.set('dateTo', filters.dateRange.to.toISOString());
    }
    if (filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 10000) {
      params.set('volumeMin', filters.volumeRange[0].toString());
      params.set('volumeMax', filters.volumeRange[1].toString());
    }
    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.variety) {
      params.set('variety', filters.variety);
    }
    if (filters.alcoholRange[0] !== 0 || filters.alcoholRange[1] !== 12) {
      params.set('alcoholMin', filters.alcoholRange[0].toString());
      params.set('alcoholMax', filters.alcoholRange[1].toString());
    }

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load filters from URL on mount
  useEffect(() => {
    const stagesParam = searchParams.get('stages');
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const volumeMinParam = searchParams.get('volumeMin');
    const volumeMaxParam = searchParams.get('volumeMax');
    const statusParam = searchParams.get('status');
    const varietyParam = searchParams.get('variety');
    const alcoholMinParam = searchParams.get('alcoholMin');
    const alcoholMaxParam = searchParams.get('alcoholMax');

    if (
      stagesParam ||
      dateFromParam ||
      dateToParam ||
      volumeMinParam ||
      volumeMaxParam ||
      statusParam ||
      varietyParam ||
      alcoholMinParam ||
      alcoholMaxParam
    ) {
      onChange({
        stages: stagesParam ? stagesParam.split(',') : [],
        dateRange: {
          from: dateFromParam ? new Date(dateFromParam) : undefined,
          to: dateToParam ? new Date(dateToParam) : undefined,
        },
        volumeRange: [
          volumeMinParam ? parseInt(volumeMinParam) : 0,
          volumeMaxParam ? parseInt(volumeMaxParam) : 10000,
        ],
        status: (statusParam as any) || 'all',
        variety: varietyParam || '',
        alcoholRange: [
          alcoholMinParam ? parseFloat(alcoholMinParam) : 0,
          alcoholMaxParam ? parseFloat(alcoholMaxParam) : 12,
        ],
      });
    }
  }, []); // Only run on mount

  // Count active filters
  const activeFilterCount =
    filters.stages.length +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 10000 ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.variety ? 1 : 0) +
    (filters.alcoholRange[0] !== 0 || filters.alcoholRange[1] !== 12 ? 1 : 0);

  // Toggle stage filter
  const toggleStage = (stage: string) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    onChange({ ...filters, stages: newStages });
  };

  // Apply date preset
  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ ...filters, dateRange: { from, to } });
  };

  // Clear all filters
  const clearAll = () => {
    onChange(DEFAULT_FILTERS);
  };

  // Remove specific filter
  const removeFilter = (key: keyof BatchFilters) => {
    const newFilters = { ...filters };
    switch (key) {
      case 'stages':
        newFilters.stages = [];
        break;
      case 'dateRange':
        newFilters.dateRange = {};
        break;
      case 'volumeRange':
        newFilters.volumeRange = [0, 10000];
        break;
      case 'status':
        newFilters.status = 'all';
        break;
      case 'variety':
        newFilters.variety = '';
        break;
      case 'alcoholRange':
        newFilters.alcoholRange = [0, 12];
        break;
    }
    onChange(newFilters);
  };

  // Save current filters as preset
  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters },
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }

    setPresetName('');
    setSavePresetOpen(false);
  };

  // Load preset
  const loadPreset = (preset: FilterPreset) => {
    onChange(preset.filters);
  };

  // Delete preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Header - Always Visible */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filters Button with Badge */}
        <Button
          variant={isExpanded ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground"
            >
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>

        {/* Presets Dropdown */}
        {presets.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Presets
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Saved filter presets
                </p>
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2 rounded-sm hover:bg-accent group"
                  >
                    <button
                      onClick={() => loadPreset(preset)}
                      className="flex-1 text-left text-sm"
                    >
                      {preset.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePreset(preset.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredCount === totalCount ? (
            <span>{totalCount} batches</span>
          ) : (
            <span>
              {filteredCount} of {totalCount} batches
            </span>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {filters.stages.map((stage) => (
            <Badge
              key={stage}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => toggleStage(stage)}
            >
              {stage}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('dateRange')}
            >
              {filters.dateRange.from && format(filters.dateRange.from, 'MMM d')}
              {filters.dateRange.from && filters.dateRange.to && ' - '}
              {filters.dateRange.to && format(filters.dateRange.to, 'MMM d')}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {(filters.volumeRange[0] !== 0 || filters.volumeRange[1] !== 10000) && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('volumeRange')}
            >
              {filters.volumeRange[0]}-{filters.volumeRange[1]}L
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('status')}
            >
              {filters.status}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.variety && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('variety')}
            >
              {filters.variety}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {(filters.alcoholRange[0] !== 0 || filters.alcoholRange[1] !== 12) && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('alcoholRange')}
            >
              {filters.alcoholRange[0]}-{filters.alcoholRange[1]}% ABV
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Collapsible Filter Panel */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 animate-fade-in bg-card">
          {/* Stage Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stage</Label>
              {filters.stages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...filters, stages: [] })}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <Badge
                  key={stage}
                  variant={filters.stages.includes(stage) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-all',
                    filters.stages.includes(stage)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => toggleStage(stage)}
                >
                  {stage}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyDatePreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Custom Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={
                      filters.dateRange.from && filters.dateRange.to
                        ? { from: filters.dateRange.from, to: filters.dateRange.to }
                        : undefined
                    }
                    onSelect={(range) =>
                      onChange({
                        ...filters,
                        dateRange: range ? { from: range.from, to: range.to } : {},
                      })
                    }
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Volume Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Volume (Liters)</Label>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={filters.volumeRange[0]}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    volumeRange: [parseInt(e.target.value) || 0, filters.volumeRange[1]],
                  })
                }
                className="w-24"
                min={0}
              />
              <Slider
                value={filters.volumeRange}
                onValueChange={(value) =>
                  onChange({ ...filters, volumeRange: value as [number, number] })
                }
                min={0}
                max={10000}
                step={50}
                className="flex-1"
              />
              <Input
                type="number"
                value={filters.volumeRange[1]}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    volumeRange: [filters.volumeRange[0], parseInt(e.target.value) || 10000],
                  })
                }
                className="w-24"
                min={0}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: any) => onChange({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Variety Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Apple Variety</Label>
              <Select
                value={filters.variety || "all-varieties"}
                onValueChange={(value) => onChange({ ...filters, variety: value === "all-varieties" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All varieties" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all-varieties">All varieties</SelectItem>
                  {varieties.map((variety) => (
                    <SelectItem key={variety} value={variety}>
                      {variety}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alcohol Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Alcohol (% ABV)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={filters.alcoholRange[0]}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      alcoholRange: [parseFloat(e.target.value) || 0, filters.alcoholRange[1]],
                    })
                  }
                  className="w-16"
                  min={0}
                  max={12}
                  step={0.5}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={filters.alcoholRange[1]}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      alcoholRange: [filters.alcoholRange[0], parseFloat(e.target.value) || 12],
                    })
                  }
                  className="w-16"
                  min={0}
                  max={12}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          {/* Save Preset Button */}
          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavePresetOpen(true)}
              disabled={activeFilterCount === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Preset
            </Button>
          </div>
        </div>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Give your filter combination a name to quickly access it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Fermenting Batches"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePreset()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
