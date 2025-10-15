import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BatchCard } from '@/components/BatchCard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBatches } from '@/hooks/useBatches';
import { Batch } from '@/types/batch.types';
import { paths } from '@/routes/paths';

interface BatchesTabProps {
  batches: Batch[];
  onBatchClick?: (batch: Batch) => void;
  onUpdateStage?: (batchId: string, newStage: string) => void;
}

export const BatchesTab = ({ batches, onBatchClick, onUpdateStage }: BatchesTabProps) => {
  const navigate = useNavigate();
  const { batchSearchQuery, setBatchSearchQuery } = useAppStore();
  const { deleteBatch, isDeleting } = useBatches();
  const [batchSortOrder, setBatchSortOrder] = useState("newest");

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Delete this batch and all its logs?")) return;
    deleteBatch(batchId);
  };

  const handleBatchClick = (batch: Batch) => {
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
        batch.yeast_type?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (batchSortOrder) {
        case "newest":
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
        case "oldest":
          return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
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
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={batchSearchQuery}
            onChange={(e) => setBatchSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={batchSortOrder} onValueChange={setBatchSortOrder}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="volume-high">Volume (High-Low)</SelectItem>
            <SelectItem value="volume-low">Volume (Low-High)</SelectItem>
            <SelectItem value="progress-high">Progress (High-Low)</SelectItem>
            <SelectItem value="progress-low">Progress (Low-High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              batch={{
                id: batch.id,
                name: batch.name,
                variety: batch.variety,
                volume: batch.volume,
                startDate: batch.started_at,
                currentStage: batch.current_stage as any,
                progress: batch.progress,
                apple_origin: batch.apple_origin || undefined,
                yeast_type: batch.yeast_type || undefined,
                notes: batch.notes || undefined,
                attachments: batch.attachments || undefined,
                target_og: batch.target_og || undefined,
                target_fg: batch.target_fg || undefined,
                target_ph: batch.target_ph || undefined,
                target_end_ph: batch.target_end_ph || undefined,
              }}
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
