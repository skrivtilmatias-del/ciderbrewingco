import { useNavigate } from 'react-router-dom';
import { Batch } from '@/components/BatchCard';
import { useAppStore } from '@/stores/appStore';
import { useBatches } from '@/hooks/useBatches';
import { paths } from '@/routes/paths';
import { VirtualBatchList } from '@/components/VirtualBatchList';

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
    setSelectedBatch,
    setDetailsOpen
  } = useAppStore();
  const { deleteBatch, isDeleting } = useBatches();

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Delete this batch and all its logs?")) return;
    deleteBatch(batchId);
  };

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(false);
    
    if (onBatchClick) {
      onBatchClick(batch);
    }
    navigate(paths.production());
  };

  const filteredAndSortedBatches = batches
    .filter((batch) => {
      const query = batchSearchQuery.toLowerCase();
      return (
        batch.name.toLowerCase().includes(query) ||
        batch.variety.toLowerCase().includes(query) ||
        batch.currentStage.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
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

  return (
    <VirtualBatchList
      batches={filteredAndSortedBatches}
      onBatchClick={handleBatchClick}
      onDeleteBatch={handleDeleteBatch}
      onUpdateStage={onUpdateStage}
      searchQuery={batchSearchQuery}
      layout="grid"
    />
  );
};

