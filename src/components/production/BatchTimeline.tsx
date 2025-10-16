import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Circle, FileText, Clock } from "lucide-react";
import { STAGES } from "@/constants/ciderStages";
import { format, differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Batch } from "@/types/batch.types";
import type { BatchLog } from "@/types/batchLog.types";

interface BatchTimelineProps {
  batch: Batch;
  logs: BatchLog[];
  variant?: "compact" | "detailed" | "comparison";
  onStageClick?: (stage: string) => void;
}

// Simplified key stages for the timeline
const KEY_STAGES = [
  { name: "Pressing", stages: ["Harvest", "Sorting", "Washing", "Milling", "Pressing", "Settling"] },
  { name: "Fermenting", stages: ["Enzymes", "Pitching", "Fermentation", "Cold Crash"] },
  { name: "Racking", stages: ["Racking"] },
  { name: "Aging", stages: ["Malolactic", "Stabilisation", "Lees Aging"] },
  { name: "Bottling", stages: ["Blending", "Backsweetening", "Bottling", "Conditioning"] },
  { name: "Ready", stages: ["Tasting", "Complete"] },
];

// Estimated days for each key stage (typical timeline)
const TYPICAL_DURATION: Record<string, number> = {
  "Pressing": 1,
  "Fermenting": 14,
  "Racking": 1,
  "Aging": 30,
  "Bottling": 2,
  "Ready": 7,
};

export const BatchTimeline = ({ batch, logs, variant = "detailed", onStageClick }: BatchTimelineProps) => {
  const allStages = [...STAGES, "Complete"];
  const currentStageIndex = allStages.indexOf(batch.current_stage);

  // Build stage history from logs
  const stageHistory = logs
    .filter(log => log.stage !== batch.current_stage || log.created_at !== batch.updated_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Calculate which key stage we're in
  const getCurrentKeyStage = () => {
    for (let i = 0; i < KEY_STAGES.length; i++) {
      if (KEY_STAGES[i].stages.includes(batch.current_stage)) {
        return i;
      }
    }
    return 0;
  };

  const currentKeyStageIndex = getCurrentKeyStage();

  // Calculate dates and durations for each key stage
  const getStageData = (keyStageIndex: number) => {
    const keyStage = KEY_STAGES[keyStageIndex];
    const isComplete = keyStageIndex < currentKeyStageIndex;
    const isCurrent = keyStageIndex === currentKeyStageIndex;
    
    // Find when this key stage started
    const stageStartLog = stageHistory.find(log => 
      keyStage.stages.includes(log.stage)
    );
    
    const startDate = stageStartLog 
      ? new Date(stageStartLog.created_at)
      : keyStageIndex === 0 
        ? new Date(batch.started_at)
        : null;

    // Find when this key stage ended (when next key stage started)
    let endDate: Date | null = null;
    if (isComplete && keyStageIndex < KEY_STAGES.length - 1) {
      const nextKeyStage = KEY_STAGES[keyStageIndex + 1];
      const nextStageLog = stageHistory.find(log => 
        nextKeyStage.stages.includes(log.stage)
      );
      endDate = nextStageLog ? new Date(nextStageLog.created_at) : null;
    }

    // Calculate duration
    let actualDuration: number | null = null;
    if (startDate) {
      if (isComplete && endDate) {
        actualDuration = differenceInDays(endDate, startDate);
      } else if (isCurrent) {
        actualDuration = differenceInDays(new Date(), startDate);
      }
    }

    // Estimate completion date for current/future stages
    let estimatedCompletion: Date | null = null;
    if (isCurrent && startDate) {
      estimatedCompletion = addDays(startDate, TYPICAL_DURATION[keyStage.name] || 7);
    } else if (!isComplete && !isCurrent) {
      // For future stages, estimate based on previous stages
      const previousComplete = keyStageIndex > 0 ? getStageData(keyStageIndex - 1) : null;
      if (previousComplete?.estimatedCompletion || previousComplete?.endDate) {
        const baseDate = previousComplete.estimatedCompletion || previousComplete.endDate!;
        estimatedCompletion = addDays(baseDate, TYPICAL_DURATION[keyStage.name] || 7);
      }
    }

    // Check if stage has notes
    const hasNotes = logs.some(log => keyStage.stages.includes(log.stage) && log.content);

    // Calculate variance from typical timeline
    const typicalDuration = TYPICAL_DURATION[keyStage.name] || 7;
    const variance = actualDuration ? actualDuration - typicalDuration : 0;

    return {
      keyStage,
      isComplete,
      isCurrent,
      startDate,
      endDate,
      actualDuration,
      estimatedCompletion,
      hasNotes,
      variance,
      typicalDuration,
    };
  };

  if (variant === "compact") {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          {KEY_STAGES.map((_, index) => {
            const data = getStageData(index);
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStageClick?.(data.keyStage.stages[0])}
                      className={cn(
                        "relative flex items-center justify-center transition-all",
                        data.isCurrent && "animate-pulse"
                      )}
                    >
                      {/* Connecting line */}
                      {index < KEY_STAGES.length - 1 && (
                        <div 
                          className={cn(
                            "absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2",
                            data.isComplete ? "bg-success" : "bg-muted border-t-2 border-dashed"
                          )}
                        />
                      )}
                      
                      {/* Stage dot */}
                      <div className={cn(
                        "relative z-10 w-3 h-3 rounded-full transition-all",
                        data.isComplete && "bg-success",
                        data.isCurrent && "bg-primary ring-4 ring-primary/20",
                        !data.isComplete && !data.isCurrent && "bg-muted border-2 border-muted-foreground/20"
                      )}>
                        {data.isComplete && (
                          <Check className="w-2 h-2 text-success-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{data.keyStage.name}</p>
                    {data.startDate && (
                      <p className="text-xs">{format(data.startDate, "MMM dd, yyyy")}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex items-start justify-between mb-8">
          {KEY_STAGES.map((_, index) => {
            const data = getStageData(index);
            const isLast = index === KEY_STAGES.length - 1;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center relative">
                {/* Connecting line */}
                {!isLast && (
                  <div 
                    className={cn(
                      "absolute top-6 left-1/2 h-0.5 w-full z-0",
                      data.isComplete ? "bg-success" : "border-t-2 border-dashed border-muted"
                    )}
                  />
                )}

                {/* Stage node */}
                <button
                  onClick={() => onStageClick?.(data.keyStage.stages[0])}
                  className={cn(
                    "relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all hover:scale-110",
                    data.isComplete && "bg-success border-success",
                    data.isCurrent && "bg-primary border-primary animate-pulse",
                    !data.isComplete && !data.isCurrent && "bg-background border-muted"
                  )}
                >
                  {data.isComplete ? (
                    <Check className="w-6 h-6 text-success-foreground" />
                  ) : data.isCurrent ? (
                    <Circle className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Stage details */}
                <div className="mt-3 text-center space-y-1 w-full px-2">
                  <div className="flex items-center justify-center gap-1">
                    <h4 className={cn(
                      "font-semibold text-sm",
                      data.isCurrent ? "text-primary" : "text-foreground"
                    )}>
                      {data.keyStage.name}
                    </h4>
                    {data.hasNotes && (
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>

                  {/* Started date */}
                  {data.startDate && (
                    <p className="text-xs text-muted-foreground">
                      Started: {format(data.startDate, "MMM dd")}
                    </p>
                  )}

                  {/* Duration */}
                  {data.actualDuration !== null && (
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <p className="text-xs">
                        {data.actualDuration} {data.actualDuration === 1 ? "day" : "days"}
                      </p>
                      {data.variance !== 0 && data.isComplete && (
                        <Badge 
                          variant={data.variance > 0 ? "destructive" : "default"}
                          className="text-xs px-1 py-0"
                        >
                          {data.variance > 0 ? "+" : ""}{data.variance}d
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Estimated completion */}
                  {data.estimatedCompletion && (
                    <p className="text-xs text-muted-foreground italic">
                      Est: {format(data.estimatedCompletion, "MMM dd")}
                    </p>
                  )}

                  {/* Status badge */}
                  {data.isCurrent && (
                    <Badge variant="default" className="text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline legend */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted border-2 border-muted-foreground/20" />
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>Has notes</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
