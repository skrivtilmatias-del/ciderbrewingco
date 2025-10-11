import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Apple, Droplets, Clock, Wine, Calendar, Beaker } from "lucide-react";
import { Batch } from "./BatchCard";

const stageConfig = {
  pressing: { label: "Pressing", icon: Apple, color: "bg-success" },
  fermentation: { label: "Fermentation", icon: Droplets, color: "bg-info" },
  aging: { label: "Aging", icon: Clock, color: "bg-warning" },
  bottling: { label: "Bottling", icon: Wine, color: "bg-accent" },
  complete: { label: "Complete", icon: Wine, color: "bg-muted" },
};

const stages = ["pressing", "fermentation", "aging", "bottling", "complete"];

interface BatchDetailsProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStage: (batchId: string, newStage: Batch["currentStage"]) => void;
}

export const BatchDetails = ({ batch, open, onOpenChange, onUpdateStage }: BatchDetailsProps) => {
  if (!batch) return null;

  const currentStageIndex = stages.indexOf(batch.currentStage);
  const stage = stageConfig[batch.currentStage];
  const StageIcon = stage.icon;

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1] as Batch["currentStage"];
      onUpdateStage(batch.id, nextStage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{batch.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Apple Variety</p>
              <p className="text-lg font-medium">{batch.variety}</p>
            </div>
            <Badge className={`${stage.color} text-white`}>
              <StageIcon className="w-4 h-4 mr-1" />
              {stage.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Beaker className="w-4 h-4" />
                <span className="text-sm">Volume</span>
              </div>
              <p className="text-xl font-semibold">{batch.volume}L</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Started</span>
              </div>
              <p className="text-xl font-semibold">
                {new Date(batch.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{batch.progress}%</span>
            </div>
            <Progress value={batch.progress} className="h-3" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Production Stages</p>
            <div className="flex gap-2">
              {stages.map((s, index) => {
                const stageInfo = stageConfig[s as Batch["currentStage"]];
                const Icon = stageInfo.icon;
                const isComplete = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                
                return (
                  <div
                    key={s}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      isComplete
                        ? "bg-success/10 border-success"
                        : isCurrent
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${
                      isComplete ? "text-success" : isCurrent ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <p className={`text-xs font-medium ${
                      isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {stageInfo.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {batch.notes && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Notes</p>
              <p className="text-sm text-muted-foreground">{batch.notes}</p>
            </div>
          )}

          {currentStageIndex < stages.length - 1 && (
            <Button 
              onClick={handleNextStage}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Advance to {stageConfig[stages[currentStageIndex + 1] as Batch["currentStage"]].label}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
