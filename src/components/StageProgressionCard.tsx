import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Apple, Droplets, Clock, Wine, CheckCircle } from "lucide-react";
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
  { name: 'Aging', icon: Clock },
  { name: 'Bottling', icon: Wine },
  { name: 'Complete', icon: CheckCircle }
] as const;

// Map all stages to key stage indices
const STAGE_TO_KEY_INDEX: Record<string, number> = {
  'Harvest': 0,
  'Sorting & Washing': 0,
  'Milling': 0,
  'Pressing': 0,
  'Settling/Enzymes': 0,
  'Pitching & Fermentation': 1,
  'Cold Crash': 1,
  'Racking': 2,
  'Malolactic': 2,
  'Stabilisation/Finings': 2,
  'Blending': 2,
  'Backsweetening': 3,
  'Bottling': 3,
  'Conditioning/Lees Aging': 3,
  'Tasting/QA': 3,
  'Complete': 4
};

export function StageProgressionCard({ batch, onAdvanceStage, onSkipToStage }: StageProgressionCardProps) {
  const currentKeyStageIndex = STAGE_TO_KEY_INDEX[batch.currentStage] ?? 0;
  const isComplete = batch.currentStage === 'Complete';

  const handleKeyStageClick = (keyStage: string, index: number) => {
    if (!onSkipToStage) return;
    
    if (index !== currentKeyStageIndex) {
      // Map key stage to actual stage
      let targetStage: CiderStage | 'Complete';
      if (keyStage === 'Pressing') targetStage = 'Pressing';
      else if (keyStage === 'Fermentation') targetStage = 'Pitching & Fermentation';
      else if (keyStage === 'Aging') targetStage = 'Racking';
      else if (keyStage === 'Bottling') targetStage = 'Bottling';
      else targetStage = 'Complete';

      const action = index < currentKeyStageIndex ? 'Go back' : 'Skip';
      const confirmed = confirm(`${action} to "${keyStage}"?`);
      if (confirmed) {
        onSkipToStage(targetStage);
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
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

        {/* Advance Button */}
        {!isComplete && (
          <Button
            onClick={onAdvanceStage}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            Advance to Next Stage
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
