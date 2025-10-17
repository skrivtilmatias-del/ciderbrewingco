/**
 * BatchTimelineCard - Card view with integrated timeline for list/grid views
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchTimeline, type BatchWithTimeline, type StageHistory } from './BatchTimeline';
import { StageDetailsModal } from './StageDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BatchTimelineCardProps {
  batch: BatchWithTimeline;
  onViewDetails?: (batchId: string) => void;
  onEdit?: (batchId: string) => void;
  onDelete?: (batchId: string) => void;
}

export const BatchTimelineCard = ({
  batch,
  onViewDetails,
  onEdit,
  onDelete,
}: BatchTimelineCardProps) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stageModalOpen, setStageModalOpen] = useState(false);

  const handleStageClick = (stage: string) => {
    setSelectedStage(stage);
    setStageModalOpen(true);
  };

  const selectedHistory = batch.stage_history?.find((h) => h.stage === selectedStage);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{batch.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{batch.current_stage}</Badge>
                <span className="text-sm text-muted-foreground">{batch.started_at}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(batch.id)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(batch.id)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(batch.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <BatchTimeline
            batch={batch}
            variant="standard"
            onStageClick={handleStageClick}
          />
        </CardContent>
      </Card>

      {selectedStage && (
        <StageDetailsModal
          open={stageModalOpen}
          onOpenChange={setStageModalOpen}
          stage={selectedStage}
          history={selectedHistory}
          batchId={batch.id}
        />
      )}
    </>
  );
};
