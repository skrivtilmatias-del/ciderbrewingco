import { cn } from "@/lib/utils";
import { STAGE_WEIGHTS } from "@/lib/progressUtils";

interface LinearProgressProps {
  progress: number;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * LinearProgress - Multi-segment progress bar showing all stages
 * 
 * Features:
 * - Shows all production stages
 * - Highlights completed, current, and future stages
 * - Optional stage labels
 * - Compact mode for cards
 */
export const LinearProgress = ({
  progress,
  showLabels = false,
  compact = false,
  className,
}: LinearProgressProps) => {
  const stages = Object.entries(STAGE_WEIGHTS);

  return (
    <div className={cn("space-y-1", className)}>
      {/* Multi-segment bar */}
      <div className={cn(
        "flex w-full rounded-full overflow-hidden bg-muted",
        compact ? "h-1.5" : "h-2"
      )}>
        {stages.map(([stage, weights]) => {
          const width = weights.end - weights.start;
          const isCompleted = weights.end <= progress;
          const isCurrent = weights.start <= progress && progress < weights.end;
          const progressInSegment = isCurrent 
            ? ((progress - weights.start) / (weights.end - weights.start)) * 100
            : 0;

          return (
            <div
              key={stage}
              className="relative transition-all duration-500"
              style={{ width: `${width}%` }}
            >
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  isCompleted && "bg-success",
                  isCurrent && "bg-primary animate-pulse",
                  !isCompleted && !isCurrent && "bg-muted"
                )}
                style={{
                  width: isCurrent ? `${progressInSegment}%` : '100%'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Stage labels */}
      {showLabels && !compact && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {stages.map(([stage]) => (
            <span key={stage} className="truncate">
              {stage.slice(0, 3)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
