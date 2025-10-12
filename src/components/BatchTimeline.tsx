import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Circle } from "lucide-react";
import { STAGES } from "@/constants/ciderStages";
import { format, differenceInDays } from "date-fns";

interface TimelineStage {
  stage: string;
  startDate?: string;
  endDate?: string;
  isComplete: boolean;
  isCurrent: boolean;
}

interface BatchTimelineProps {
  currentStage: string;
  stageHistory: Array<{ stage: string; timestamp: string }>;
  startDate: string;
}

export const BatchTimeline = ({ currentStage, stageHistory, startDate }: BatchTimelineProps) => {
  const allStages = [...STAGES, "Complete"];
  const currentIndex = allStages.indexOf(currentStage);

  // Build timeline data
  const timeline: TimelineStage[] = allStages.map((stage, index) => {
    const historyEntry = stageHistory.find(h => h.stage === stage);
    const nextEntry = stageHistory[stageHistory.indexOf(historyEntry!) + 1];
    
    return {
      stage,
      startDate: historyEntry?.timestamp || (index === 0 ? startDate : undefined),
      endDate: nextEntry?.timestamp,
      isComplete: index < currentIndex,
      isCurrent: stage === currentStage,
    };
  });

  const getStageGroupName = (stage: string) => {
    const pressingStages = ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'];
    const fermentationStages = ['Pitching & Fermentation', 'Cold Crash'];
    const ageingStages = ['Malolactic', 'Stabilisation/Finings', 'Racking'];
    const bottlingStages = ['Blending', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'];
    
    if (pressingStages.includes(stage)) return 'Pressing';
    if (fermentationStages.includes(stage)) return 'Fermentation';
    if (ageingStages.includes(stage)) return 'Ageing';
    if (bottlingStages.includes(stage)) return 'Bottling';
    return stage;
  };

  // Group stages by display name
  const groupedTimeline: Array<{ name: string; stages: TimelineStage[] }> = [];
  timeline.forEach(item => {
    const groupName = getStageGroupName(item.stage);
    let group = groupedTimeline.find(g => g.name === groupName);
    if (!group) {
      group = { name: groupName, stages: [] };
      groupedTimeline.push(group);
    }
    group.stages.push(item);
  });

  const getDaysInStage = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate) return null;
    const end = endDate ? new Date(endDate) : new Date();
    return differenceInDays(end, new Date(startDate));
  };

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="space-y-6">
        {groupedTimeline.map((group, groupIdx) => {
          const groupIsComplete = group.stages.every(s => s.isComplete);
          const groupIsCurrent = group.stages.some(s => s.isCurrent);
          const firstStageInGroup = group.stages[0];
          const lastStageInGroup = group.stages[group.stages.length - 1];
          const daysInGroup = getDaysInStage(firstStageInGroup.startDate, lastStageInGroup.endDate);

          return (
            <div key={group.name} className="relative">
              {/* Connector Line */}
              {groupIdx < groupedTimeline.length - 1 && (
                <div className={`absolute left-3 top-8 w-0.5 h-full ${groupIsComplete ? 'bg-success' : 'bg-muted'}`} />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  {groupIsComplete ? (
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                      <Check className="w-4 h-4 text-success-foreground" />
                    </div>
                  ) : groupIsCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
                      <Circle className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted bg-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold ${groupIsCurrent ? 'text-primary' : 'text-foreground'}`}>
                      {group.name}
                    </h4>
                    {groupIsCurrent && (
                      <Badge variant="default" className="text-xs">In Progress</Badge>
                    )}
                  </div>

                  {firstStageInGroup.startDate && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Started: {format(new Date(firstStageInGroup.startDate), "MMM dd, yyyy")}
                      {daysInGroup !== null && ` • ${daysInGroup} days`}
                    </div>
                  )}

                  {/* Sub-stages */}
                  {group.stages.length > 1 && (
                    <div className="mt-2 ml-4 space-y-1">
                      {group.stages.map(stage => (
                        <div key={stage.stage} className="flex items-center gap-2 text-xs">
                          <Circle className={`w-2 h-2 ${stage.isComplete ? 'text-success fill-success' : stage.isCurrent ? 'text-primary fill-primary' : 'text-muted'}`} />
                          <span className={stage.isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}>
                            {stage.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
