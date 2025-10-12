import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Apple, Droplets, Clock, Wine, CheckCircle2, Beaker, FlaskConical } from "lucide-react";
import { CiderStage } from "@/constants/ciderStages";

export interface Batch {
  id: string;
  name: string;
  variety: string;
  volume: number;
  startDate: string;
  currentStage: CiderStage | 'Complete';
  progress: number;
  notes?: string;
  attachments?: string[];
  target_og?: number;
  target_fg?: number;
  target_ph?: number;
  target_end_ph?: number;
  yeast_type?: string;
}

const getStageIcon = (stage: string) => {
  if (stage.includes('Harvest') || stage.includes('Washing')) return Apple;
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return Droplets;
  if (stage.includes('Aging') || stage.includes('Conditioning')) return Clock;
  if (stage.includes('Bottling') || stage.includes('Packaging')) return Wine;
  if (stage.includes('Lab') || stage.includes('Testing') || stage.includes('QA')) return FlaskConical;
  if (stage.includes('Complete')) return CheckCircle2;
  return Beaker;
};

const getStageColor = (stage: string) => {
  if (stage === 'Complete') return 'bg-muted';
  if (stage.includes('Harvest')) return 'bg-success';
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return 'bg-info';
  if (stage.includes('Aging') || stage.includes('Conditioning')) return 'bg-warning';
  if (stage.includes('Bottling')) return 'bg-accent';
  return 'bg-primary';
};

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
}

export const BatchCard = ({ batch, onClick }: BatchCardProps) => {
  const StageIcon = getStageIcon(batch.currentStage);
  const stageColor = getStageColor(batch.currentStage);

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-border"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-1">{batch.name}</h3>
          <p className="text-sm text-muted-foreground">{batch.variety}</p>
        </div>
        <Badge className={`${stageColor} text-white`}>
          <StageIcon className="w-3 h-3 mr-1" />
          {batch.currentStage}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Volume</span>
          <span className="font-medium text-foreground">{batch.volume}L</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Started</span>
          <span className="font-medium text-foreground">
            {new Date(batch.startDate).toLocaleDateString()}
          </span>
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{batch.progress}%</span>
          </div>
          <Progress value={batch.progress} className="h-2" />
        </div>

        {(batch.target_og || batch.target_ph || batch.yeast_type) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {batch.target_og && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">OG:</span>
                <span className="text-foreground">{batch.target_og >= 1.5 ? Math.round(batch.target_og) : Math.round((batch.target_og - 1) * 1000) + 1000}</span>
              </div>
            )}
            {batch.target_ph && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">PH:</span>
                <span className="text-foreground">{batch.target_ph}</span>
              </div>
            )}
            {batch.yeast_type && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <Beaker className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Yeast:</span>
                <span className="text-foreground">{batch.yeast_type}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
