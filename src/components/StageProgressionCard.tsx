import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { STAGES, CiderStage } from "@/constants/ciderStages";
import { Batch } from "./BatchCard";

interface StageProgressionCardProps {
  batch: Batch;
  onAdvanceStage: () => void;
  onSkipToStage?: (stage: CiderStage | 'Complete') => void;
}

// Simplified key stages for cleaner UX
const KEY_STAGES = [
  'Harvest',
  'Pressing',
  'Pitching & Fermentation',
  'Racking',
  'Bottling',
  'Complete'
] as const;

export function StageProgressionCard({ batch, onAdvanceStage, onSkipToStage }: StageProgressionCardProps) {
  const allStages: Array<CiderStage | 'Complete'> = [...STAGES, 'Complete'];
  const currentStageIndex = allStages.indexOf(batch.currentStage);
  const isComplete = batch.currentStage === 'Complete';

  // Map current stage to key stage
  const getCurrentKeyStageIndex = () => {
    if (isComplete) return KEY_STAGES.length - 1;
    if (currentStageIndex <= 3) return 0; // Harvest group
    if (currentStageIndex <= 4) return 1; // Pressing
    if (currentStageIndex <= 6) return 2; // Fermentation
    if (currentStageIndex <= 10) return 3; // Racking/Processing
    if (currentStageIndex <= 12) return 4; // Bottling
    return KEY_STAGES.length - 1; // Complete
  };

  const currentKeyStageIndex = getCurrentKeyStageIndex();

  const handleKeyStageClick = (keyStage: string, index: number) => {
    if (index > currentKeyStageIndex && onSkipToStage) {
      // Map key stage to actual stage
      let targetStage: CiderStage | 'Complete';
      if (keyStage === 'Harvest') targetStage = 'Harvest';
      else if (keyStage === 'Pressing') targetStage = 'Pressing';
      else if (keyStage === 'Pitching & Fermentation') targetStage = 'Pitching & Fermentation';
      else if (keyStage === 'Racking') targetStage = 'Racking';
      else if (keyStage === 'Bottling') targetStage = 'Bottling';
      else targetStage = 'Complete';

      const confirmed = confirm(`Skip to "${keyStage}"?`);
      if (confirmed) {
        onSkipToStage(targetStage);
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Production Stages</p>
        
        {/* Horizontal Key Stages */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {KEY_STAGES.map((stage, index) => {
            const isCompleted = index < currentKeyStageIndex;
            const isCurrent = index === currentKeyStageIndex;
            const canSkipTo = index > currentKeyStageIndex;

            return (
              <Button
                key={stage}
                variant="outline"
                onClick={() => handleKeyStageClick(stage, index)}
                disabled={isCompleted || isCurrent}
                className={`flex-1 min-w-[100px] h-auto py-3 px-4 flex flex-col items-center gap-2 transition-all ${
                  isCompleted
                    ? 'bg-success/10 border-success text-success hover:bg-success/10'
                    : isCurrent
                    ? 'bg-primary/10 border-primary text-primary hover:bg-primary/10'
                    : canSkipTo
                    ? 'hover:bg-muted cursor-pointer'
                    : 'opacity-50'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
                <span className="text-xs font-medium text-center whitespace-normal">
                  {stage}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Advance Button */}
        {!isComplete && (
          <Button
            onClick={onAdvanceStage}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            Advance to {allStages[currentStageIndex + 1]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
