import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Batch } from '@/components/BatchCard';
import { useAppStore } from '@/stores/appStore';
import { useBatches } from '@/hooks/useBatches';
import { useBatchLogs } from '@/hooks/useBatchLogs';
import { paths } from '@/routes/paths';
import { VirtualBatchList } from '@/components/VirtualBatchList';
import { BatchFilters, BatchFilters as BatchFiltersType } from '@/components/BatchFilters';
import { useBatchFilters, getUniqueVarieties } from '@/hooks/useBatchFilters';
import { BatchContextMenuGuide } from '@/components/production/BatchContextMenuGuide';
import { BatchComparison } from '@/components/production/BatchComparison';
import { CompareSelectedButton } from '@/components/production/CompareSelectedButton';
import { useBatchComparisonStore } from '@/stores/batchComparisonStore';

interface BatchesTabProps {
  batches: Batch[];
  onBatchClick?: (batch: Batch) => void;
  onUpdateStage?: (batchId: string, newStage: string) => void;
}

export const BatchesTab = ({ batches, onBatchClick, onUpdateStage }: BatchesTabProps) => {
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

  // Initialize filter state with default values
  const [filters, setFilters] = useState<BatchFiltersType>({
    stages: [],
    dateRange: {},
    volumeRange: [0, 10000],
    status: 'all',
    variety: '',
    alcoholRange: [0, 12],
  });

  // Add null check for batches
  const safeBatches = batches || [];

  // Fetch logs for all selected batches
  const batchLogsMap: Record<string, any[]> = {};
  selectedBatchIds.forEach(batchId => {
    const { logs } = useBatchLogs(batchId);
    batchLogsMap[batchId] = logs || [];
  });

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
  const filteredBatches = useBatchFilters(safeBatches, filters, batchSearchQuery);

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
  const varieties = getUniqueVarieties(safeBatches);


  return (
    <div className="space-y-4">
      {/* Help Guide */}
      <div className="flex justify-end">
        <BatchContextMenuGuide />
      </div>

      {/* Comprehensive Filter Panel */}
      <BatchFilters
        filters={filters}
        onChange={setFilters}
        totalCount={safeBatches.length}
        filteredCount={filteredBatches.length}
        varieties={varieties}
      />

      {/* Virtual Batch List */}
      <VirtualBatchList
        batches={filteredAndSortedBatches}
        onBatchClick={handleBatchClick}
        onDeleteBatch={handleDeleteBatch}
        onUpdateStage={onUpdateStage}
        searchQuery={batchSearchQuery}
        layout="grid"
      />

      {/* Compare Selected Button */}
      <CompareSelectedButton onCompare={() => setComparisonOpen(true)} />

      {/* Batch Comparison Dialog */}
      <BatchComparison
        batches={safeBatches}
        batchLogs={batchLogsMap}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />
    </div>
  );
};

