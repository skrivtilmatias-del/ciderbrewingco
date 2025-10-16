import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Batch } from '@/components/BatchCard';
import { useAppStore } from '@/stores/appStore';
import { useBatches } from '@/hooks/useBatches';
// import { useBatchLogs } from '@/hooks/useBatchLogs'; // Avoid calling hooks in loops
import { paths } from '@/routes/paths';
import { VirtualBatchList } from '@/components/VirtualBatchList';
import { BatchFilters, BatchFilters as BatchFiltersType } from '@/components/BatchFilters';
import { useBatchFilters, getUniqueVarieties } from '@/hooks/useBatchFilters';
import { BatchContextMenuGuide } from '@/components/production/BatchContextMenuGuide';
import { BatchComparison } from '@/components/production/BatchComparison';
import { CompareSelectedButton } from '@/components/production/CompareSelectedButton';
import { useBatchComparisonStore } from '@/stores/batchComparisonStore';
import { Button } from '@/components/ui/button';

interface BatchesTabProps {
  batches: Batch[];
  onBatchClick?: (batch: Batch) => void;
  onUpdateStage?: (batchId: string, newStage: string) => void;
}

export const BatchesTab = ({ batches, onBatchClick, onUpdateStage }: BatchesTabProps) => {
  console.log('BatchesTab received batches:', batches?.length, batches);
  // Safety check: Loading state
  if (!batches) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading batches...</div>
      </div>
    );
  }

  // Safety check: Validate array type
  if (!Array.isArray(batches)) {
    console.error('BatchesTab: batches is not an array:', batches);
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Invalid data format</div>
      </div>
    );
  }


  const navigate = useNavigate();
  const { 
    batchSearchQuery, 
    setBatchSearchQuery,
    batchSortOrder,
    setBatchSortOrder,
    setSelectedBatchId,
    setDetailsOpen
  } = useAppStore();
  const { deleteBatch, isDeleting } = useBatches();
  const { selectedBatchIds } = useBatchComparisonStore();
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const DEFAULT_FILTERS: BatchFiltersType = {
    stages: [],
    dateRange: {},
    volumeRange: [0, 10000],
    status: 'all',
    variety: '',
    alcoholRange: [0, 12],
  };

  // Initialize filter state with default values
  const [filters, setFilters] = useState<BatchFiltersType>(DEFAULT_FILTERS);

  // Prepare batch logs for comparison lazily (avoid hooks-in-loop)
  const batchLogsMap: Record<string, any[]> = {};

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Delete this batch and all its logs?")) return;
    deleteBatch(batchId);
  };

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatchId(batch.id);
    setDetailsOpen(false);
    
    if (onBatchClick) {
      onBatchClick(batch);
    }
    navigate(paths.production());
  };

  // Apply filters using custom hook
  const normalizedQuery = (batchSearchQuery || '').trim();
  const filteredBatches = useBatchFilters(batches, filters, normalizedQuery);
  console.log('After filtering:', filteredBatches.length, 'search query:', normalizedQuery, 'filters:', filters);

  // Then apply sorting
  const filteredAndSortedBatches = filteredBatches.sort((a, b) => {
    switch (batchSortOrder) {
      case "newest":
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case "oldest":
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "volume-high":
        return (b.volume || 0) - (a.volume || 0);
      case "volume-low":
        return (a.volume || 0) - (b.volume || 0);
      case "progress-high":
        return (b.progress || 0) - (a.progress || 0);
      case "progress-low":
        return (a.progress || 0) - (b.progress || 0);
      default:
        return 0;
    }
  });

  // Extract unique varieties for filter dropdown
  const varieties = getUniqueVarieties(batches);

  const handleClearAll = () => {
    setBatchSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        Total: {batches.length} | Filtered: {filteredBatches.length} | Search: "{normalizedQuery}" 
        {filteredBatches.length === 0 && batches.length > 0 && (
          <Button onClick={handleClearAll} size="sm" variant="outline" className="ml-2">
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Help Guide */}
      <div className="flex justify-end">
        <BatchContextMenuGuide />
      </div>

      {/* Comprehensive Filter Panel */}
      <BatchFilters
        filters={filters}
        onChange={setFilters}
        totalCount={batches.length}
        filteredCount={filteredBatches.length}
        varieties={varieties}
      />

      {/* Show empty state if no batches exist at all */}
      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-muted-foreground">No batches yet</div>
          <p className="text-sm text-muted-foreground">Create your first batch to get started</p>
        </div>
      ) : filteredAndSortedBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-muted-foreground">No batches match your filters</div>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          <Button onClick={handleClearAll} variant="outline">
            Clear All Filters
          </Button>
        </div>
      ) : (
        /* Virtual Batch List */
        <VirtualBatchList
          batches={filteredAndSortedBatches}
          onBatchClick={handleBatchClick}
          onDeleteBatch={handleDeleteBatch}
          onUpdateStage={onUpdateStage}
          searchQuery={normalizedQuery}
          layout="grid"
        />
      )}

      {/* Compare Selected Button */}
      <CompareSelectedButton onCompare={() => setComparisonOpen(true)} />

      {/* Batch Comparison Dialog */}
      <BatchComparison
        batches={batches}
        batchLogs={batchLogsMap}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />
    </div>
  );
};

