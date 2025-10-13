import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Apple, Droplets, Clock, Wine, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { STAGES, CiderStage } from "@/constants/ciderStages";
import { Batch } from "./BatchCard";

interface StageProgressionCardProps {
  batch: Batch;
  onAdvanceStage: () => void;
  onSkipToStage?: (stage: CiderStage | 'Complete') => void;
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

export function StageProgressionCard({ batch, onAdvanceStage, onSkipToStage }: StageProgressionCardProps) {
  const currentKeyStageIndex = STAGE_TO_KEY_INDEX[batch.currentStage] ?? 0;
  const isComplete = batch.currentStage === 'Complete';
  const currentIndex = STAGES.indexOf(batch.currentStage as CiderStage);
  const canGoPrevious = !isComplete && currentIndex > 0;

  const handleKeyStageClick = (keyStage: string, index: number) => {
    if (!onSkipToStage) return;
    
    if (index !== currentKeyStageIndex) {
      // Map key stage to actual stage
      let targetStage: CiderStage | 'Complete';
      if (keyStage === 'Pressing') targetStage = 'Harvest';
      else if (keyStage === 'Fermentation') targetStage = 'Enzymes';
      else if (keyStage === 'Ageing') targetStage = 'Racking';
      else if (keyStage === 'Bottling') targetStage = 'Blending';
      else targetStage = 'Complete';

      onSkipToStage(targetStage);
    }
  };

  const handlePreviousStage = () => {
    if (canGoPrevious && onSkipToStage) {
      const previousStage = STAGES[currentIndex - 1];
      onSkipToStage(previousStage);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-4 overflow-x-hidden">
        <h3 className="text-base font-medium">Production Stages</h3>
        
        {/* Stage Chips - Wrap and Center */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2">
          {KEY_STAGES.map((stage, index) => {
            const isCompleted = index < currentKeyStageIndex;
            const isCurrent = index === currentKeyStageIndex;
            const Icon = stage.icon;

            return (
              <Button
                key={stage.name}
                variant="outline"
                onClick={() => handleKeyStageClick(stage.name, index)}
                className={`min-h-[44px] py-2 px-3 flex items-center justify-center gap-2 transition-all ${
                  isCompleted
                    ? 'bg-success/10 border-success text-success hover:bg-success/20 cursor-pointer'
                    : isCurrent
                    ? 'bg-primary/10 border-primary text-primary hover:bg-primary/10 cursor-default'
                    : 'hover:bg-muted cursor-pointer'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-base sm:text-sm font-medium break-words">
                  {stage.name}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Navigation Buttons - Stack on Mobile */}
        {!isComplete && (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Button
              onClick={handlePreviousStage}
              disabled={!canGoPrevious}
              className="w-full sm:w-auto min-h-[44px] text-base bg-primary hover:bg-primary/90"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Stage
            </Button>
            <Button
              onClick={onAdvanceStage}
              className="w-full sm:w-auto min-h-[44px] text-base bg-primary hover:bg-primary/90"
            >
              Advance to Next Stage
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
