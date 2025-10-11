import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { STAGES, CiderStage } from "@/constants/ciderStages";
import { Batch } from "./BatchCard";

interface StageProgressionCardProps {
  batch: Batch;
  onAdvanceStage: () => void;
  onSkipToStage?: (stage: CiderStage | 'Complete') => void;
}

export function StageProgressionCard({ batch, onAdvanceStage, onSkipToStage }: StageProgressionCardProps) {
  const allStages: Array<CiderStage | 'Complete'> = [...STAGES, 'Complete'];
  const currentStageIndex = allStages.indexOf(batch.currentStage);
  const isComplete = batch.currentStage === 'Complete';
  const canAdvance = currentStageIndex < allStages.length - 1;

  const handleStageClick = (stage: CiderStage | 'Complete', index: number) => {
    // Only allow jumping forward
    if (index > currentStageIndex && onSkipToStage) {
      const confirmed = confirm(`Skip to "${stage}"? This will skip ${index - currentStageIndex} stage(s).`);
      if (confirmed) {
        onSkipToStage(stage);
      }
    }
  };

  // Calculate progress based on stage completion
  const progressPercentage = ((currentStageIndex + 1) / allStages.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Production Stage</CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {currentStageIndex + 1} of {allStages.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Stage</span>
            <span className="text-2xl font-bold text-primary">{batch.currentStage}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stage List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allStages.map((stage, index) => {
            const isCurrentStage = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isNext = index === currentStageIndex + 1;
            const canSkipTo = index > currentStageIndex;

            return (
              <div
                key={stage}
                onClick={() => handleStageClick(stage, index)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCurrentStage
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : isCompleted
                    ? 'bg-success/5 border-success/20'
                    : isNext
                    ? 'bg-muted/50 border-muted-foreground/20'
                    : canSkipTo
                    ? 'bg-background border-border hover:bg-primary/5 hover:border-primary/30 cursor-pointer'
                    : 'bg-background border-border'
                }`}
                title={canSkipTo && !isNext ? `Click to skip to ${stage}` : undefined}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : isCurrentStage ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={`text-sm flex-1 ${
                    isCurrentStage
                      ? 'font-semibold text-foreground'
                      : isCompleted
                      ? 'text-muted-foreground line-through'
                      : isNext
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stage}
                </span>
                {isNext && (
                  <Badge variant="outline" className="text-xs">
                    Next
                  </Badge>
                )}
                {canSkipTo && !isNext && (
                  <Badge variant="outline" className="text-xs">
                    Skip
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Advance Button */}
        {canAdvance && (
          <Button
            onClick={onAdvanceStage}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            Advance to {allStages[currentStageIndex + 1]}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {isComplete && (
          <div className="flex items-center justify-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">Batch Complete!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
