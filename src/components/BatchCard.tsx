import { useState, useRef, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Apple, Droplets, Clock, Wine, CheckCircle2, Beaker, FlaskConical, Loader2 } from "lucide-react";
import { MoreVertical, Trash2 } from "lucide-react";
import { CiderStage, STAGES } from "@/constants/ciderStages";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchBatchDetails, prefetchBatchLogs } from '@/lib/prefetchUtils';
import { BatchContextMenu } from "@/components/production/BatchContextMenu";
import { useBatchComparisonStore } from "@/stores/batchComparisonStore";
import { cn } from "@/lib/utils";
import { BatchProgressMini, ProgressBadge } from "@/components/production/BatchProgress";
import { LinearProgress } from "@/components/production/LinearProgress";
import { calculateProgress } from "@/lib/progressUtils";

// Legacy interface for backward compatibility
export interface Batch {
  id: string;
  name: string;
  variety: string;
  apple_origin?: string;
  volume: number;
  startDate: string;
  currentStage: CiderStage | 'Complete';
  progress: number;
  notes?: string;
  attachments?: string[];
  target_og?: number;
  target_fg?: number;
  target_ph?: number;
  target_end_ph?: number;
  target_temp_c?: number;
  yeast_type?: string;
  // Allow database fields too
  started_at?: string;
  current_stage?: string;
}

const getStageIcon = (stage: string) => {
  if (stage.includes('Harvest') || stage.includes('Washing')) return Apple;
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return Droplets;
  if (stage.includes('Aging') || stage.includes('Conditioning')) return Clock;
  if (stage.includes('Bottling') || stage.includes('Packaging')) return Wine;
  if (stage.includes('Lab') || stage.includes('Testing') || stage.includes('QA')) return FlaskConical;
  if (stage.includes('Complete')) return CheckCircle2;
  return Beaker;
};

const getStageColor = (stage: string) => {
  if (stage === 'Complete') return 'bg-muted';
  if (stage.includes('Harvest')) return 'bg-success';
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return 'bg-info';
  if (stage.includes('Aging') || stage.includes('Conditioning')) return 'bg-warning';
  if (stage.includes('Bottling')) return 'bg-accent';
  return 'bg-primary';
};

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
  onDelete?: () => void;
  onAdvanceStage?: (newStage: CiderStage | 'Complete') => void;
  onPreviousStage?: (newStage: CiderStage) => void;
  onUpdateStage?: (batchId: string, newStage: string) => void;
  onAddNote?: (batchId: string, note: string) => void;
  onClone?: (batch: Batch) => void;
  onArchive?: (batchId: string) => void;
  onExport?: (batch: Batch) => void;
  /** Search query to highlight matching text in results */
  searchQuery?: string;
  /** Show selection checkbox for comparison */
  showSelection?: boolean;
}

/**
 * Highlight matching text in a string based on search query
 */
const highlightText = (text: string, query: string) => {
  if (!query || query.trim().length === 0) {
    return text;
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part?.toLowerCase() === query?.toLowerCase() ? (
          <mark key={index} className="bg-warning/30 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export const BatchCard = ({ 
  batch, 
  onClick, 
  onDelete, 
  onAdvanceStage, 
  onPreviousStage, 
  onUpdateStage,
  onAddNote,
  onClone,
  onArchive,
  onExport,
  searchQuery = '',
  showSelection = false,
}: BatchCardProps) => {
  const queryClient = useQueryClient();
  const { selectedBatchIds, toggleBatchSelection } = useBatchComparisonStore();
  const isSelected = selectedBatchIds.includes(batch.id);
  const currentStage = batch.currentStage || batch.current_stage || 'Planning';
  const startDate = batch.startDate || batch.started_at;
  const StageIcon = getStageIcon(currentStage);
  const stageColor = getStageColor(currentStage);
  const isComplete = currentStage === 'Complete';
  const currentIndex = STAGES.indexOf(currentStage as CiderStage);
  const canGoPrevious = !isComplete && currentIndex > 0;

  // Mobile long-press support
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  /**
   * Smart Prefetching on Hover
   * Strategy: When user hovers, prefetch batch details and logs
   * This makes clicking feel instant as data is already loaded
   * React Query automatically deduplicates if data is already fresh
   */
  const handleMouseEnter = () => {
    // Prefetch in parallel - both requests fire simultaneously
    Promise.all([
      prefetchBatchDetails(queryClient, batch.id),
      prefetchBatchLogs(queryClient, batch.id),
    ]).catch(() => {
      // Silently fail - prefetch is optional optimization
      // If it fails, data will load normally on click
    });
  };

  // Mobile long-press handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setIsLongPress(false);
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 200); // 200ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If finger moved more than 10px, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      touchStartPos.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress && onClick) {
      onClick();
    }
    touchStartPos.current = null;
    setIsLongPress(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <BatchContextMenu
      batch={batch}
      onUpdateStage={onUpdateStage}
      onAddNote={onAddNote}
      onViewDetails={onClick}
      onClone={onClone}
      onArchive={onArchive}
      onExport={onExport}
    >
      <Card 
        data-just-added={(batch as any)._justAdded}
        data-just-updated={(batch as any)._justUpdated}
        data-deleting={(batch as any)._deleting}
        data-updating={(batch as any)._updating}
        tabIndex={0}
        role="article"
        aria-label={`Batch ${batch.name}, ${batch.variety}, currently in ${currentStage} stage`}
        className={cn(
          "p-6 hover:shadow-lg transition-all cursor-pointer border-border relative",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected && "ring-2 ring-primary border-primary",
          (batch as any)._updating && "opacity-75 pointer-events-none"
        )}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
      {(batch as any)._updating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {/* Selection Checkbox */}
      {showSelection && (
        <div 
          className="absolute top-4 left-4 z-20" 
          onClick={handleCheckboxClick}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleBatchSelection(batch.id)}
            className="h-5 w-5"
          />
        </div>
      )}
      <div className="absolute top-4 right-4 flex gap-1" onClick={handleMenuClick}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          title="Right-click for more options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-start justify-between mb-4 pr-8">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {highlightText(batch.name, searchQuery)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {highlightText(batch.variety, searchQuery)}
            {batch.apple_origin && <> from {batch.apple_origin}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Mini circular progress */}
          <BatchProgressMini batch={batch} />
          <Badge 
            className={`${stageColor} text-white`}
            aria-label={`Status: ${currentStage}`}
          >
            <StageIcon className="w-3 h-3 mr-1" aria-hidden="true" />
            {highlightText(currentStage, searchQuery)}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-medium text-foreground">{batch.volume}L</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Started</span>
            <span className="font-medium text-foreground">
              {new Date(startDate || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Production Progress</span>
            <span className="font-medium text-foreground">
              {(() => {
                const progressValue = calculateProgress(batch).overallProgress;
                const safeProgress = isNaN(progressValue) || progressValue === null 
                  ? 0 
                  : Math.min(Math.max(progressValue, 0), 100);
                return safeProgress === 0 ? 'Not started' : `${Math.round(safeProgress)}%`;
              })()}
            </span>
          </div>
          <LinearProgress 
            progress={(() => {
              const progressValue = calculateProgress(batch).overallProgress;
              return isNaN(progressValue) || progressValue === null 
                ? 0 
                : Math.min(Math.max(progressValue, 0), 100);
            })()} 
            compact 
          />
        </div>

        {/* Progress badges */}
        <ProgressBadge batch={batch} />

        {(batch.target_og || batch.target_ph || batch.yeast_type) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            {batch.target_og && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">OG:</span>
                <span className="text-foreground">{batch.target_og >= 1.5 ? Math.round(batch.target_og) : Math.round((batch.target_og - 1) * 1000) + 1000}</span>
              </div>
            )}
            {batch.target_ph && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">PH:</span>
                <span className="text-foreground">{batch.target_ph}</span>
              </div>
            )}
            {batch.yeast_type && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium">
                <Beaker className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Yeast:</span>
                <span className="text-foreground">{batch.yeast_type}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
    </BatchContextMenu>
  );
};

/**
 * Custom comparison function for React.memo
 * Prevents unnecessary re-renders by comparing actual batch data
 * Ignores function reference changes (callbacks)
 */
const batchCardPropsAreEqual = (prevProps: BatchCardProps, nextProps: BatchCardProps) => {
  // Compare batch object (deep comparison of relevant fields)
  const batchEqual =
    prevProps.batch.id === nextProps.batch.id &&
    prevProps.batch.name === nextProps.batch.name &&
    prevProps.batch.variety === nextProps.batch.variety &&
    prevProps.batch.volume === nextProps.batch.volume &&
    (prevProps.batch.currentStage || prevProps.batch.current_stage) === (nextProps.batch.currentStage || nextProps.batch.current_stage) &&
    prevProps.batch.progress === nextProps.batch.progress &&
    (prevProps.batch.startDate || prevProps.batch.started_at) === (nextProps.batch.startDate || nextProps.batch.started_at);

  // Compare search query
  const searchEqual = prevProps.searchQuery === nextProps.searchQuery;

  // Compare selection state
  const selectionEqual = prevProps.showSelection === nextProps.showSelection;

  // Functions are always different references, but that's okay - we ignore them
  // The actual functionality won't change, only the reference

  return batchEqual && searchEqual && selectionEqual;
};

// Export memoized component
export const MemoizedBatchCard = memo(BatchCard, batchCardPropsAreEqual);
