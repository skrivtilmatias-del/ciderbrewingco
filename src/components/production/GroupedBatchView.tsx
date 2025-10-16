import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  Clock,
  Droplets,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES } from "@/constants/ciderStages";
import { BatchCard, type Batch } from "@/components/BatchCard";
import { differenceInDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GroupedBatchViewProps {
  batches: Batch[];
  onSelectBatch: (batch: Batch) => void;
  onDeleteBatch: (batchId: string) => void;
  onUpdateStage?: (batchId: string, newStage: string) => void;
}

interface StageGroup {
  stage: string;
  batches: Batch[];
  totalVolume: number;
  avgDaysInStage: number;
  urgency: "overdue" | "due-soon" | "on-track";
}

const STAGE_ICONS: Record<string, any> = {
  Harvest: Package,
  Pressing: Droplets,
  Fermentation: Droplets,
  Aging: Clock,
  Bottling: Package,
  Complete: Package,
};

// Typical days per stage for urgency calculation
const TYPICAL_STAGE_DURATION: Record<string, number> = {
  Harvest: 1,
  Sorting: 1,
  Washing: 1,
  Milling: 1,
  Pressing: 1,
  Settling: 2,
  Enzymes: 1,
  Pitching: 1,
  Fermentation: 14,
  "Cold Crash": 3,
  Racking: 1,
  Malolactic: 21,
  Stabilisation: 7,
  "Lees Aging": 30,
  Blending: 2,
  Backsweetening: 1,
  Bottling: 1,
  Conditioning: 14,
  Tasting: 7,
  Complete: 0,
};

export const GroupedBatchView = ({
  batches,
  onSelectBatch,
  onDeleteBatch,
  onUpdateStage,
}: GroupedBatchViewProps) => {
  // Load expand/collapse state from localStorage
  const loadExpandedState = (): Record<string, boolean> => {
    try {
      const saved = localStorage.getItem("groupedBatchView_expanded");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(loadExpandedState);
  const [draggedBatch, setDraggedBatch] = useState<Batch | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [stageChangeDialog, setStageChangeDialog] = useState<{
    batch: Batch;
    newStage: string;
  } | null>(null);

  // Save expand/collapse state to localStorage
  const saveExpandedState = (newState: Record<string, boolean>) => {
    try {
      localStorage.setItem("groupedBatchView_expanded", JSON.stringify(newState));
    } catch (e) {
      console.error("Failed to save expanded state:", e);
    }
  };

  const toggleGroup = (stage: string) => {
    const newState = { ...expandedGroups, [stage]: !expandedGroups[stage] };
    setExpandedGroups(newState);
    saveExpandedState(newState);
  };

  const expandAll = () => {
    const newState = Object.fromEntries(
      stageGroups.map((g) => [g.stage, true])
    );
    setExpandedGroups(newState);
    saveExpandedState(newState);
  };

  const collapseAll = () => {
    setExpandedGroups({});
    saveExpandedState({});
  };

  // Calculate urgency for a batch based on time in current stage
  const calculateUrgency = (batch: Batch): "overdue" | "due-soon" | "on-track" => {
    const daysInStage = differenceInDays(new Date(), new Date(batch.startDate));
    const typicalDuration = TYPICAL_STAGE_DURATION[batch.currentStage] || 7;

    if (daysInStage > typicalDuration * 1.5) return "overdue";
    if (daysInStage > typicalDuration * 1.2) return "due-soon";
    return "on-track";
  };

  // Group batches by stage
  const stageGroups: StageGroup[] = useMemo(() => {
    const groups: Record<string, Batch[]> = {};

    // Initialize all stages
    [...STAGES, "Complete"].forEach((stage) => {
      groups[stage] = [];
    });

    // Group batches
    batches.forEach((batch) => {
      if (groups[batch.currentStage]) {
        groups[batch.currentStage].push(batch);
      }
    });

    // Create stage group objects with metadata
    return Object.entries(groups)
      .map(([stage, stageBatches]) => {
        const totalVolume = stageBatches.reduce((sum, b) => sum + b.volume, 0);
        const avgDaysInStage =
          stageBatches.length > 0
            ? stageBatches.reduce(
                (sum, b) => sum + differenceInDays(new Date(), new Date(b.startDate)),
                0
              ) / stageBatches.length
            : 0;

        // Determine group urgency (worst urgency among batches)
        let urgency: "overdue" | "due-soon" | "on-track" = "on-track";
        if (stageBatches.some((b) => calculateUrgency(b) === "overdue")) {
          urgency = "overdue";
        } else if (stageBatches.some((b) => calculateUrgency(b) === "due-soon")) {
          urgency = "due-soon";
        }

        return {
          stage,
          batches: stageBatches,
          totalVolume,
          avgDaysInStage: Math.round(avgDaysInStage),
          urgency,
        };
      })
      .filter((group) => group.batches.length > 0); // Only show non-empty groups
  }, [batches]);

  // Drag and drop handlers
  const handleDragStart = (batch: Batch) => {
    setDraggedBatch(batch);
  };

  const handleDragEnd = () => {
    setDraggedBatch(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (draggedBatch && draggedBatch.currentStage !== targetStage) {
      setStageChangeDialog({
        batch: draggedBatch,
        newStage: targetStage,
      });
    }
  };

  const confirmStageChange = () => {
    if (stageChangeDialog && onUpdateStage) {
      onUpdateStage(stageChangeDialog.batch.id, stageChangeDialog.newStage);
      setStageChangeDialog(null);
    }
  };

  const getUrgencyColor = (urgency: "overdue" | "due-soon" | "on-track") => {
    switch (urgency) {
      case "overdue":
        return "border-l-destructive bg-destructive/5";
      case "due-soon":
        return "border-l-warning bg-warning/5";
      default:
        return "border-l-success bg-success/5";
    }
  };

  const getUrgencyBadge = (urgency: "overdue" | "due-soon" | "on-track") => {
    switch (urgency) {
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      case "due-soon":
        return (
          <Badge variant="outline" className="gap-1 border-warning text-warning">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStageIcon = (stage: string) => {
    for (const [key, Icon] of Object.entries(STAGE_ICONS)) {
      if (stage.includes(key)) return Icon;
    }
    return Package;
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Batches by Stage</h3>
          <Badge variant="outline">{batches.length} total</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-2">
            <Maximize2 className="w-4 h-4" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-2">
            <Minimize2 className="w-4 h-4" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Stage groups */}
      <div className="space-y-3">
        {stageGroups.map((group) => {
          const isExpanded = expandedGroups[group.stage] ?? false;
          const Icon = getStageIcon(group.stage);
          const previewBatches = group.batches.slice(0, 3);
          const remainingCount = group.batches.length - 3;

          return (
            <Card
              key={group.stage}
              className={cn(
                "border-l-4 transition-all duration-300",
                getUrgencyColor(group.urgency),
                dragOverStage === group.stage && "ring-2 ring-primary"
              )}
              onDragOver={(e) => handleDragOver(e, group.stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.stage)}
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.stage)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <h4 className="font-semibold">{group.stage}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{group.batches.length} batches</span>
                      <span>•</span>
                      <span>{group.totalVolume.toFixed(0)}L total</span>
                      <span>•</span>
                      <span>Avg {group.avgDaysInStage} days</span>
                    </div>
                  </div>
                </div>
                {getUrgencyBadge(group.urgency)}
              </button>

              {/* Group content */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.batches.map((batch) => (
                      <div
                        key={batch.id}
                        draggable={!!onUpdateStage}
                        onDragStart={() => handleDragStart(batch)}
                        onDragEnd={handleDragEnd}
                        className="cursor-move"
                      >
                        <BatchCard
                          batch={batch}
                          onClick={() => onSelectBatch(batch)}
                          onDelete={() => onDeleteBatch(batch.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collapsed preview */}
              {!isExpanded && group.batches.length > 0 && (
                <div className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {previewBatches.map((batch) => (
                      <div
                        key={batch.id}
                        draggable={!!onUpdateStage}
                        onDragStart={() => handleDragStart(batch)}
                        onDragEnd={handleDragEnd}
                        className="cursor-move"
                      >
                        <BatchCard
                          batch={batch}
                          onClick={() => onSelectBatch(batch)}
                          onDelete={() => onDeleteBatch(batch.id)}
                        />
                      </div>
                    ))}
                  </div>
                  {remainingCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(group.stage)}
                      className="w-full"
                    >
                      Show {remainingCount} more
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {stageGroups.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No batches yet</h3>
          <p className="text-muted-foreground mb-4">
            Start your first batch to see it organized by stage here.
          </p>
          <Button>Create First Batch</Button>
        </Card>
      )}

      {/* Stage change confirmation dialog */}
      <AlertDialog
        open={!!stageChangeDialog}
        onOpenChange={(open) => !open && setStageChangeDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Batch Stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Move "{stageChangeDialog?.batch.name}" from{" "}
              <strong>{stageChangeDialog?.batch.currentStage}</strong> to{" "}
              <strong>{stageChangeDialog?.newStage}</strong>?
              <br />
              <br />
              This will update the batch's production stage and progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStageChange}>
              Change Stage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
