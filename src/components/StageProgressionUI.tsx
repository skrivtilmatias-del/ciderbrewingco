import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAGES } from "@/constants/ciderStages";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { CiderStage } from "@/constants/ciderStages";

interface StageProgressionUIProps {
  currentStage: CiderStage | "Complete";
  batchId: string;
  batchName: string;
  onAdvanceStage: (batchId: string, newStage: CiderStage | "Complete") => void;
}

export const StageProgressionUI = ({ 
  currentStage, 
  batchId, 
  batchName,
  onAdvanceStage 
}: StageProgressionUIProps) => {
  const allStages = [...STAGES, "Complete"] as const;
  const currentIndex = allStages.indexOf(currentStage as any);
  const isComplete = currentStage === "Complete";
  
  const handleAdvance = () => {
    if (currentIndex < allStages.length - 1) {
      const nextStage = allStages[currentIndex + 1];
      onAdvanceStage(batchId, nextStage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Production Progress: {batchName}</span>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {currentStage}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stage Highlight */}
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Stage</p>
              <p className="text-xl font-bold text-primary">{currentStage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Step {currentIndex + 1} of {allStages.length}
              </p>
            </div>
            {!isComplete && (
              <Button 
                onClick={handleAdvance}
                className="bg-primary hover:bg-primary/90"
              >
                Advance to Next Stage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">All Production Stages</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allStages.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? "bg-success/10 border-success"
                      : isCurrent
                      ? "bg-primary/10 border-primary border-2"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  ) : isCurrent ? (
                    <Circle className="h-5 w-5 text-primary flex-shrink-0 fill-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {stage}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCompleted ? "✓ Done" : isCurrent ? "In Progress" : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Stage Preview */}
        {!isComplete && currentIndex < allStages.length - 1 && (
          <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
            <p className="text-sm text-muted-foreground mb-2">Next Stage</p>
            <p className="font-semibold">{allStages[currentIndex + 1]}</p>
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
