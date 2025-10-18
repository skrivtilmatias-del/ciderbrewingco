/**
 * BatchTimeline - Interactive timeline visualization for batch progression
 * Shows stages, progress, and metrics with responsive design
 */

import { useState, useMemo } from 'react';
import { Check, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGES } from '@/constants/ciderStages';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, differenceInDays } from 'date-fns';

export interface StageHistory {
  stage: string;
  started_at: string;
  completed_at?: string;
  duration_days?: number;
  notes?: string;
  photos?: string[];
  user_id: string;
  measurements?: {
    temperature?: number;
    ph?: number;
    specific_gravity?: number;
  };
}

export interface BatchWithTimeline {
  id: string;
  name: string;
  current_stage: string;
  started_at: string;
  completed_at?: string | null;
  stage_history?: StageHistory[];
  estimated_completion_date?: string;
  expected_stage_durations?: Record<string, { min: number; max: number }>;
}

type TimelineVariant = 'compact' | 'standard' | 'comparison';

interface BatchTimelineProps {
  batch: BatchWithTimeline;
  variant?: TimelineVariant;
  onStageClick?: (stage: string, history?: StageHistory) => void;
  showComparison?: boolean;
  comparisonBatches?: BatchWithTimeline[];
  className?: string;
}

const DEFAULT_STAGE_DURATIONS: Record<string, { min: number; max: number }> = {
  Pressing: { min: 1, max: 2 },
  Settling: { min: 1, max: 3 },
  Pitching: { min: 1, max: 1 },
  Fermentation: { min: 14, max: 21 },
  'Cold Crash': { min: 2, max: 5 },
  Racking: { min: 1, max: 2 },
  Malolactic: { min: 14, max: 30 },
  Stabilisation: { min: 7, max: 14 },
  Blending: { min: 1, max: 3 },
  Bottling: { min: 1, max: 2 },
  Conditioning: { min: 14, max: 60 },
  'Lees Aging': { min: 30, max: 180 },
};

export const BatchTimeline = ({
  batch,
  variant = 'standard',
  onStageClick,
  showComparison = false,
  comparisonBatches = [],
  className,
}: BatchTimelineProps) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Calculate timeline metrics
  const metrics = useMemo(() => {
    const totalDays = differenceInDays(
      batch.completed_at ? new Date(batch.completed_at) : new Date(),
      new Date(batch.started_at)
    );

    const currentStageIndex = STAGES.indexOf(batch.current_stage as typeof STAGES[number]);
    const progressPercentage = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

    // Calculate expected completion
    const expectedDuration = batch.expected_stage_durations || DEFAULT_STAGE_DURATIONS;
    let expectedTotalDays = 0;
    Object.keys(expectedDuration).forEach((stage) => {
      const duration = expectedDuration[stage];
      if (duration) {
        expectedTotalDays += (duration.min + duration.max) / 2;
      }
    });

    const variance = totalDays - expectedTotalDays;
    const onSchedule = Math.abs(variance) <= 3;

    return {
      totalDays,
      progressPercentage,
      expectedTotalDays,
      variance,
      onSchedule,
    };
  }, [batch]);

  // Get stage status
  const getStageStatus = (stage: string): 'completed' | 'current' | 'future' | 'overdue' => {
    const currentIndex = STAGES.indexOf(batch.current_stage as typeof STAGES[number]);
    const stageIndex = STAGES.indexOf(stage as typeof STAGES[number]);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) {
      // Check if overdue
      const history = batch.stage_history?.find((h) => h.stage === stage);
      if (history?.started_at) {
        const daysSinceStart = differenceInDays(new Date(), new Date(history.started_at));
        const expectedDuration = batch.expected_stage_durations?.[stage] || DEFAULT_STAGE_DURATIONS[stage];
        if (expectedDuration && daysSinceStart > expectedDuration.max) {
          return 'overdue';
        }
      }
      return 'current';
    }
    return 'future';
  };

  // Get stage history
  const getStageHistory = (stage: string): StageHistory | undefined => {
    return batch.stage_history?.find((h) => h.stage === stage);
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', className)}>
          {STAGES.slice(0, 8).map((stage, index) => {
            const status = getStageStatus(stage);
            return (
              <Tooltip key={stage}>
                <TooltipTrigger>
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full transition-all cursor-pointer',
                      status === 'completed' && 'bg-green-500',
                      status === 'current' && 'bg-accent animate-pulse',
                      status === 'overdue' && 'bg-destructive animate-pulse',
                      status === 'future' && 'bg-muted border border-muted-foreground'
                    )}
                    onClick={() => onStageClick?.(stage, getStageHistory(stage))}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{stage}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Render standard variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Metrics Header */}
      {variant === 'standard' && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{metrics.totalDays} days in production</span>
          </div>
          <Badge
            variant={
              metrics.onSchedule ? 'default' : metrics.variance > 0 ? 'destructive' : 'secondary'
            }
          >
            {metrics.onSchedule ? (
              '✓ On schedule'
            ) : metrics.variance > 0 ? (
              `⚠ ${Math.abs(metrics.variance)} days behind`
            ) : (
              `⚡ ${Math.abs(metrics.variance)} days ahead`
            )}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>
            <span className="font-medium">{metrics.progressPercentage}% complete</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <TooltipProvider>
        <div className="relative">
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden md:flex items-start justify-between gap-2">
            {STAGES.map((stage, index) => {
              const status = getStageStatus(stage);
              const history = getStageHistory(stage);
              const isLast = index === STAGES.length - 1;

              return (
                <div key={stage} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    {/* Connecting Line */}
                    {!isLast && (
                      <div
                        className={cn(
                          'absolute top-5 left-1/2 w-full h-0.5 transition-all',
                          status === 'completed' && 'bg-green-500',
                          status === 'current' && 'bg-accent',
                          status === 'overdue' && 'bg-destructive',
                          status === 'future' && 'bg-muted border-t border-dashed'
                        )}
                      />
                    )}

                    {/* Stage Node */}
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'relative z-10 rounded-full transition-all cursor-pointer',
                            'hover:scale-110 active:scale-95',
                            status === 'completed' &&
                              'w-10 h-10 bg-green-500 text-white flex items-center justify-center',
                            status === 'current' &&
                              'w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center animate-pulse ring-4 ring-accent/20',
                            status === 'overdue' &&
                              'w-12 h-12 bg-destructive text-destructive-foreground flex items-center justify-center animate-pulse ring-4 ring-destructive/20',
                            status === 'future' &&
                              'w-10 h-10 border-2 border-muted-foreground bg-background'
                          )}
                          onClick={() => onStageClick?.(stage, history)}
                          onMouseEnter={() => setHoveredStage(stage)}
                          onMouseLeave={() => setHoveredStage(null)}
                        >
                          {status === 'completed' && <Check className="h-5 w-5" />}
                          {status === 'current' && (
                            <span className="text-sm font-bold">{metrics.progressPercentage}%</span>
                          )}
                          {status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{stage}</p>
                          <p className="text-xs capitalize text-muted-foreground">{status}</p>
                          {history?.started_at && (
                            <>
                              <p className="text-xs">
                                Started: {format(new Date(history.started_at), 'MMM d, yyyy')}
                              </p>
                              {history.completed_at && (
                                <p className="text-xs">
                                  Duration: {history.duration_days} days
                                </p>
                              )}
                              {!history.completed_at && status === 'current' && (
                                <p className="text-xs">
                                  Days in stage:{' '}
                                  {differenceInDays(new Date(), new Date(history.started_at))}
                                </p>
                              )}
                            </>
                          )}
                          {status === 'overdue' && history?.started_at && (
                            <p className="text-xs text-destructive font-medium">
                              {differenceInDays(new Date(), new Date(history.started_at)) -
                                (DEFAULT_STAGE_DURATIONS[stage]?.max || 0)}{' '}
                              days overdue
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Stage Label */}
                    <p
                      className={cn(
                        'mt-2 text-xs text-center transition-all',
                        status === 'completed' && 'text-green-600 dark:text-green-400 font-medium',
                        status === 'current' && 'text-accent-foreground font-bold',
                        status === 'overdue' && 'text-destructive font-bold',
                        status === 'future' && 'text-muted-foreground'
                      )}
                    >
                      {stage}
                    </p>

                    {/* Duration Info */}
                    {variant === 'standard' && history && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {history.duration_days
                          ? `${history.duration_days}d`
                          : `${differenceInDays(new Date(), new Date(history.started_at))}d`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden space-y-4">
            {STAGES.map((stage, index) => {
              const status = getStageStatus(stage);
              const history = getStageHistory(stage);
              const isLast = index === STAGES.length - 1;

              return (
                <div key={stage} className="relative flex items-start gap-4">
                  {/* Vertical Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute left-5 top-12 w-0.5 h-12 transition-all',
                        status === 'completed' && 'bg-green-500',
                        status === 'current' && 'bg-accent',
                        status === 'overdue' && 'bg-destructive',
                        status === 'future' && 'bg-muted border-l border-dashed'
                      )}
                    />
                  )}

                  {/* Stage Node */}
                  <div
                    className={cn(
                      'relative z-10 rounded-full transition-all flex-shrink-0',
                      status === 'completed' &&
                        'w-10 h-10 bg-green-500 text-white flex items-center justify-center',
                      status === 'current' &&
                        'w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center animate-pulse ring-4 ring-accent/20',
                      status === 'overdue' &&
                        'w-12 h-12 bg-destructive text-destructive-foreground flex items-center justify-center animate-pulse ring-4 ring-destructive/20',
                      status === 'future' &&
                        'w-10 h-10 border-2 border-muted-foreground bg-background'
                    )}
                    onClick={() => onStageClick?.(stage, history)}
                  >
                    {status === 'completed' && <Check className="h-5 w-5" />}
                    {status === 'current' && (
                      <span className="text-sm font-bold">{metrics.progressPercentage}%</span>
                    )}
                    {status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 pt-1">
                    <p
                      className={cn(
                        'font-medium',
                        status === 'completed' && 'text-green-600 dark:text-green-400',
                        status === 'current' && 'text-accent-foreground',
                        status === 'overdue' && 'text-destructive',
                        status === 'future' && 'text-muted-foreground'
                      )}
                    >
                      {stage}
                    </p>
                    {history?.started_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Started: {format(new Date(history.started_at), 'MMM d')}
                      </p>
                    )}
                    {history?.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {history.duration_days} days
                      </p>
                    )}
                    {!history?.completed_at && status === 'current' && history?.started_at && (
                      <p className="text-xs text-muted-foreground">
                        {differenceInDays(new Date(), new Date(history.started_at))} days in stage
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};
