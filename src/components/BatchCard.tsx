import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Apple, Droplets, Clock, Wine } from "lucide-react";

export interface Batch {
  id: string;
  name: string;
  variety: string;
  volume: number;
  startDate: string;
  currentStage: "pressing" | "fermentation" | "aging" | "bottling" | "complete";
  progress: number;
  notes?: string;
}

const stageConfig = {
  pressing: { label: "Pressing", icon: Apple, color: "bg-success" },
  fermentation: { label: "Fermentation", icon: Droplets, color: "bg-info" },
  aging: { label: "Aging", icon: Clock, color: "bg-warning" },
  bottling: { label: "Bottling", icon: Wine, color: "bg-accent" },
  complete: { label: "Complete", icon: Wine, color: "bg-muted" },
};

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
}

export const BatchCard = ({ batch, onClick }: BatchCardProps) => {
  const stage = stageConfig[batch.currentStage];
  const StageIcon = stage.icon;

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
        <Badge className={`${stage.color} text-white`}>
          <StageIcon className="w-3 h-3 mr-1" />
          {stage.label}
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

        {batch.notes && (
          <p className="text-sm text-muted-foreground italic pt-2 border-t border-border">
            {batch.notes}
          </p>
        )}
      </div>
    </Card>
  );
};
