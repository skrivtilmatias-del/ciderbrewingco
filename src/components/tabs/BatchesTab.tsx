import { useNavigate } from 'react-router-dom';
import { BatchCard, Batch } from '@/components/BatchCard';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { useBatches } from '@/hooks/useBatches';
import { paths } from '@/routes/paths';

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
    <div className="space-y-4">
      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredAndSortedBatches.length === 0 ? (
          <Card className="col-span-full p-12 text-center border-dashed">
            <p className="text-muted-foreground">
              {batchSearchQuery ? "No batches match your search." : "No batches yet. Click 'New Batch' to get started."}
            </p>
          </Card>
        ) : (
          filteredAndSortedBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onClick={() => handleBatchClick(batch)}
              onDelete={() => handleDeleteBatch(batch.id)}
              onAdvanceStage={onUpdateStage ? (newStage) => onUpdateStage(batch.id, newStage) : undefined}
              onPreviousStage={onUpdateStage ? (newStage) => onUpdateStage(batch.id, newStage) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};

