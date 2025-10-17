/**
 * Comprehensive BatchFilters Component
 * Provides advanced filtering capabilities for batch lists
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, Save, Star, Calendar as CalendarIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { STAGES } from '@/constants/ciderStages';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BatchFilterState, DEFAULT_FILTER_STATE, BUILT_IN_PRESETS } from '@/types/filters';
import { encodeFiltersToURL, decodeFiltersFromURL, countActiveFilters } from '@/lib/filterUtils';
import { useFilterPresets } from '@/hooks/useFilterPresets';

// Date range presets
const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', days: 30 },
  { label: 'This quarter', days: 90 },
  { label: 'This year', days: 365 },
];

interface BatchFiltersProps {
  filters: BatchFilterState;
  onChange: (filters: BatchFilterState) => void;
  /** Total number of batches before filtering */
  totalCount: number;
  /** Number of batches after filtering */
  filteredCount: number;
  /** Available varieties for dropdown */
  varieties: string[];
  /** Available locations for dropdown */
  locations: string[];
}

/**
 * BatchFilters - Comprehensive filtering UI for batch lists
 * 
 * Features:
 * - Multi-category filtering (stage, date, volume, status, varieties, location, alcohol)
 * - URL query param persistence (shareable, bookmarkable)
 * - Filter presets saved to Supabase (cross-device sync)
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
  locations,
}: BatchFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Fetch presets from Supabase
  const { presets, isLoading: presetsLoading, savePreset: savePresetMutation, deletePreset } = useFilterPresets();

  // Combine built-in and user presets
  const allPresets = useMemo(() => {
    const builtIn = BUILT_IN_PRESETS.map((p, i) => ({ ...p, id: `built-in-${i}` }));
    return [...builtIn, ...presets];
  }, [presets]);

  // Sync filters to URL query params
  useEffect(() => {
    const params = encodeFiltersToURL(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load filters from URL on mount
  useEffect(() => {
    const decoded = decodeFiltersFromURL(searchParams);
    if (Object.keys(decoded).length > 0) {
      onChange({ ...DEFAULT_FILTER_STATE, ...decoded });
    }
  }, []); // Only run on mount

  // Count active filters
  const activeFilterCount = countActiveFilters(filters);

  // Toggle stage filter
  const toggleStage = (stage: string) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    onChange({ ...filters, stages: newStages });
  };

  // Toggle variety filter
  const toggleVariety = (variety: string) => {
    const newVarieties = filters.varieties.includes(variety)
      ? filters.varieties.filter((v) => v !== variety)
      : [...filters.varieties, variety];
    onChange({ ...filters, varieties: newVarieties });
  };

  // Apply date preset
  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = days === 0 ? new Date() : new Date();
    if (days > 0) {
      from.setDate(from.getDate() - days);
    }
    onChange({ ...filters, dateRange: { from, to } });
  };

  // Clear all filters
  const clearAll = () => {
    onChange(DEFAULT_FILTER_STATE);
  };

  // Remove specific filter
  const removeFilter = (key: keyof BatchFilterState) => {
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
      case 'varieties':
        newFilters.varieties = [];
        break;
      case 'alcoholRange':
        newFilters.alcoholRange = [0, 12];
        break;
      case 'location':
        newFilters.location = undefined;
        break;
    }
    onChange(newFilters);
  };

  // Save current filters as preset
  const savePreset = () => {
    if (!presetName.trim()) return;
    savePresetMutation({ name: presetName, filters });
    setPresetName('');
    setSavePresetOpen(false);
  };

  // Load preset
  const loadPreset = (preset: typeof allPresets[0]) => {
    onChange(preset.filters);
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
        {allPresets.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Presets
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 z-50 bg-popover">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Saved filter presets
                </p>
                {allPresets.map((preset) => (
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
                    {!preset.id.startsWith('built-in') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
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
          {filters.varieties.map((variety) => (
            <Badge
              key={variety}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => toggleVariety(variety)}
            >
              {variety}
              <X className="h-3 w-3" />
            </Badge>
          ))}
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
          {filters.location && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('location')}
            >
              {filters.location}
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
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Custom Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              <Select
                value={filters.location || 'all-locations'}
                onValueChange={(value) => onChange({ ...filters, location: value === 'all-locations' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all-locations">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
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

          <Separator />

          {/* Apple Varieties (Multi-select with checkboxes) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Apple Varieties</Label>
              {filters.varieties.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...filters, varieties: [] })}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {varieties.map((variety) => (
                <div key={variety} className="flex items-center space-x-2">
                  <Checkbox
                    id={`variety-${variety}`}
                    checked={filters.varieties.includes(variety)}
                    onCheckedChange={() => toggleVariety(variety)}
                  />
                  <label
                    htmlFor={`variety-${variety}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {variety}
                  </label>
                </div>
              ))}
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
              Give your filter combination a name to quickly access it later across all your devices.
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
