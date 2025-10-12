import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Apple, Droplets, Clock, Wine, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { CiderStage, STAGES } from "@/constants/ciderStages";

interface StageProgressionUIProps {
  currentStage: CiderStage | "Complete";
  batchId: string;
  batchName: string;
  onAdvanceStage: (batchId: string, newStage: CiderStage | "Complete") => void;
}

// Simplified key stages with icons
const KEY_STAGES = [
  { name: 'Pressing', icon: Apple },
  { name: 'Fermentation', icon: Droplets },
  { name: 'Ageing', icon: Clock },
  { name: 'Bottling', icon: Wine },
  { name: 'Complete', icon: CheckCircle }
] as const;

// Map all stages to key stage indices
const STAGE_TO_KEY_INDEX: Record<string, number> = {
  'Harvest': 0,
  'Sorting': 0,
  'Washing': 0,
  'Milling': 0,
  'Pressing': 0,
  'Settling': 0,
  'Enzymes': 1,
  'Pitching': 1,
  'Fermentation': 1,
  'Cold Crash': 1,
  'Racking': 2,
  'Malolactic': 2,
  'Stabilisation': 2,
  'Blending': 3,
  'Backsweetening': 3,
  'Bottling': 3,
  'Conditioning': 3,
  'Lees Aging': 3,
  'Tasting': 3,
  'Complete': 4
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
    if (index !== currentKeyStageIndex) {
      // Map key stage to actual stage
      let targetStage: CiderStage | 'Complete';
      if (keyStage === 'Pressing') targetStage = 'Harvest';
      else if (keyStage === 'Fermentation') targetStage = 'Enzymes';
      else if (keyStage === 'Ageing') targetStage = 'Racking';
      else if (keyStage === 'Bottling') targetStage = 'Blending';
      else targetStage = 'Complete';

      onAdvanceStage(batchId, targetStage);
    }
  };

  const handleAdvanceStage = () => {
    const currentIndex = STAGES.indexOf(currentStage as CiderStage);
    const nextStage: CiderStage | 'Complete' = currentIndex >= STAGES.length - 1 ? 'Complete' : STAGES[currentIndex + 1];
    onAdvanceStage(batchId, nextStage);
  };

  const handlePreviousStage = () => {
    const currentIndex = STAGES.indexOf(currentStage as CiderStage);
    if (currentIndex > 0) {
      const previousStage = STAGES[currentIndex - 1];
      onAdvanceStage(batchId, previousStage);
    }
  };

  const canGoPrevious = currentStage !== 'Complete' && STAGES.indexOf(currentStage as CiderStage) > 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm font-medium text-muted-foreground">Production Stages</p>
        
        {/* Horizontal Key Stages - Responsive Grid */}
        <div className="grid grid-cols-5 gap-2">
          {KEY_STAGES.map((stage, index) => {
            const isCompleted = index < currentKeyStageIndex;
            const isCurrent = index === currentKeyStageIndex;
            const Icon = stage.icon;

            return (
              <Button
                key={stage.name}
                variant="outline"
                onClick={() => handleKeyStageClick(stage.name, index)}
                className={`h-auto py-2 sm:py-3 px-2 sm:px-3 flex flex-col items-center gap-1 sm:gap-2 transition-all ${
                  isCompleted
                    ? 'bg-success/10 border-success text-success hover:bg-success/20 cursor-pointer'
                    : isCurrent
                    ? 'bg-primary/10 border-primary text-primary hover:bg-primary/10 cursor-default'
                    : 'hover:bg-muted cursor-pointer'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                  {stage.name}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        {!isComplete && (
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousStage}
              disabled={!canGoPrevious}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Stage
            </Button>
            <Button
              onClick={handleAdvanceStage}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              Advance to Next Stage
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

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
