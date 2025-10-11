import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Apple, Droplets, Clock, Wine, CheckCircle } from "lucide-react";
import { CiderStage } from "@/constants/ciderStages";

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
  'Sorting & Washing': 0,
  'Milling': 0,
  'Pressing': 0,
  'Settling/Enzymes': 0,
  'Pitching & Fermentation': 1,
  'Cold Crash': 1,
  'Malolactic': 2,
  'Stabilisation/Finings': 2,
  'Blending': 3,
  'Racking': 3,
  'Backsweetening': 3,
  'Bottling': 3,
  'Conditioning/Lees Aging': 3,
  'Tasting/QA': 3,
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
      if (keyStage === 'Pressing') targetStage = 'Pressing';
      else if (keyStage === 'Fermentation') targetStage = 'Pitching & Fermentation';
      else if (keyStage === 'Ageing') targetStage = 'Racking';
      else if (keyStage === 'Bottling') targetStage = 'Bottling';
      else targetStage = 'Complete';

      onAdvanceStage(batchId, targetStage);
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
