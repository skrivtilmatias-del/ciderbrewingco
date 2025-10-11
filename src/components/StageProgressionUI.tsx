import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { CiderStage } from "@/constants/ciderStages";

interface StageProgressionUIProps {
  currentStage: CiderStage | "Complete";
  batchId: string;
  batchName: string;
  onAdvanceStage: (batchId: string, newStage: CiderStage | "Complete") => void;
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

// Map all stages to key stage indices
const STAGE_TO_KEY_INDEX: Record<string, number> = {
  'Harvest': 0,
  'Sorting & Washing': 0,
  'Milling': 0,
  'Pressing': 1,
  'Settling/Enzymes': 1,
  'Pitching & Fermentation': 2,
  'Cold Crash': 2,
  'Racking': 3,
  'Malolactic': 3,
  'Stabilisation/Finings': 3,
  'Blending': 3,
  'Backsweetening': 4,
  'Bottling': 4,
  'Conditioning/Lees Aging': 4,
  'Tasting/QA': 4,
  'Complete': 5
};

export const StageProgressionUI = ({ 
  currentStage, 
  batchId, 
  batchName,
  onAdvanceStage 
}: StageProgressionUIProps) => {
  const currentKeyStageIndex = STAGE_TO_KEY_INDEX[currentStage] ?? 0;
  const isComplete = currentStage === "Complete";

  const handleKeyStageClick = (keyStage: string, index: number) => {
    if (index > currentKeyStageIndex) {
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
        onAdvanceStage(batchId, targetStage);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Production Progress: {batchName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {isComplete && (
          <div className="bg-success/10 border border-success rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-semibold text-success">Batch Complete!</p>
            <p className="text-sm text-muted-foreground">All production stages finished</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
