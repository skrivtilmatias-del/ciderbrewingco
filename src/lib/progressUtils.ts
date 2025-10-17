import { differenceInDays, addDays } from 'date-fns';
import type { Batch } from '@/components/BatchCard';

/**
 * Progress calculation types
 */
export interface ProgressCalculation {
  stageProgress: number;
  timeProgress: number;
  overallProgress: number;
  status: 'on-track' | 'ahead' | 'behind' | 'overdue';
  daysAhead: number;
}

export type ProgressStatus = ProgressCalculation['status'];

/**
 * Stage weights (cumulative percentages)
 */
export const STAGE_WEIGHTS: Record<string, { start: number; end: number }> = {
  'Harvest': { start: 0, end: 5 },
  'Sorting': { start: 5, end: 7 },
  'Washing': { start: 7, end: 9 },
  'Milling': { start: 9, end: 11 },
  'Pressing': { start: 11, end: 15 },
  'Settling': { start: 15, end: 18 },
  'Enzymes': { start: 18, end: 20 },
  'Pitching': { start: 20, end: 22 },
  'Fermentation': { start: 22, end: 50 },
  'Cold Crash': { start: 50, end: 55 },
  'Racking': { start: 55, end: 60 },
  'Malolactic': { start: 60, end: 70 },
  'Stabilisation': { start: 70, end: 75 },
  'Lees Aging': { start: 75, end: 85 },
  'Blending': { start: 85, end: 88 },
  'Backsweetening': { start: 88, end: 90 },
  'Bottling': { start: 90, end: 95 },
  'Conditioning': { start: 95, end: 98 },
  'Tasting': { start: 98, end: 99 },
  'Complete': { start: 99, end: 100 },
};

/**
 * Expected durations (in days)
 */
export const EXPECTED_DURATIONS: Record<string, { min: number; max: number; typical: number }> = {
  'Harvest': { min: 1, max: 1, typical: 1 },
  'Sorting': { min: 1, max: 1, typical: 1 },
  'Washing': { min: 1, max: 1, typical: 1 },
  'Milling': { min: 1, max: 1, typical: 1 },
  'Pressing': { min: 1, max: 2, typical: 1 },
  'Settling': { min: 1, max: 3, typical: 2 },
  'Enzymes': { min: 1, max: 1, typical: 1 },
  'Pitching': { min: 1, max: 1, typical: 1 },
  'Fermentation': { min: 10, max: 21, typical: 14 },
  'Cold Crash': { min: 2, max: 5, typical: 3 },
  'Racking': { min: 1, max: 2, typical: 1 },
  'Malolactic': { min: 14, max: 35, typical: 21 },
  'Stabilisation': { min: 5, max: 14, typical: 7 },
  'Lees Aging': { min: 21, max: 180, typical: 30 },
  'Blending': { min: 1, max: 3, typical: 2 },
  'Backsweetening': { min: 1, max: 2, typical: 1 },
  'Bottling': { min: 1, max: 3, typical: 2 },
  'Conditioning': { min: 7, max: 21, typical: 14 },
  'Tasting': { min: 1, max: 7, typical: 3 },
  'Complete': { min: 0, max: 0, typical: 0 },
};

/**
 * Get days batch has been in current stage
 */
export const getDaysInStage = (batch: Batch): number => {
  // Use started_at if available, otherwise fall back to created_at
  const startDate = new Date(batch.startDate);
  return Math.max(0, differenceInDays(new Date(), startDate));
};

/**
 * Calculate batch progress
 */
export const calculateProgress = (batch: Batch): ProgressCalculation => {
  const currentStageWeight = STAGE_WEIGHTS[batch.currentStage] || { start: 0, end: 100 };
  const stageProgress = currentStageWeight.start;
  
  // Calculate progress within current stage
  const daysInStage = getDaysInStage(batch);
  const expectedDuration = EXPECTED_DURATIONS[batch.currentStage] || { min: 1, max: 1, typical: 1 };
  const stageCompletion = Math.min(
    daysInStage / expectedDuration.typical,
    1
  );
  
  // Progress within stage range
  const stageRange = currentStageWeight.end - currentStageWeight.start;
  const progressInStage = stageCompletion * stageRange;
  
  const overallProgress = Math.min(
    stageProgress + progressInStage,
    100
  );
  
  // Calculate status
  const expectedDays = expectedDuration.typical;
  const variance = daysInStage - expectedDays;
  
  let status: ProgressStatus;
  if (daysInStage > expectedDuration.max) {
    status = 'overdue';
  } else if (variance > 2) {
    status = 'behind';
  } else if (variance < -2) {
    status = 'ahead';
  } else {
    status = 'on-track';
  }
  
  return {
    stageProgress,
    timeProgress: stageCompletion * 100,
    overallProgress,
    status,
    daysAhead: -variance,
  };
};

/**
 * Get estimated completion date
 */
export const getEstimatedCompletionDate = (batch: Batch): Date => {
  const currentProgress = calculateProgress(batch);
  const remainingProgress = 100 - currentProgress.overallProgress;
  
  if (remainingProgress <= 0) {
    return new Date();
  }
  
  // Calculate average days per percent
  const totalDays = getDaysInStage(batch);
  const daysPerPercent = currentProgress.overallProgress > 0 
    ? totalDays / currentProgress.overallProgress 
    : 1;
  
  // Estimate remaining days
  const estimatedRemainingDays = Math.ceil(remainingProgress * daysPerPercent);
  
  return addDays(new Date(), estimatedRemainingDays);
};

/**
 * Get next milestone description
 */
export const getNextMilestone = (batch: Batch): string => {
  const stages = Object.keys(STAGE_WEIGHTS);
  const currentIndex = stages.indexOf(batch.currentStage);
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return 'Batch is complete!';
  }
  
  const nextStage = stages[currentIndex + 1];
  const daysInCurrentStage = getDaysInStage(batch);
  const expectedDuration = EXPECTED_DURATIONS[batch.currentStage]?.typical || 1;
  const daysUntilNext = Math.max(0, expectedDuration - daysInCurrentStage);
  
  if (daysUntilNext === 0) {
    return `Ready to move to ${nextStage}`;
  }
  
  return `${nextStage} in ~${daysUntilNext} days`;
};

/**
 * Check if batch needs action
 */
export const needsAction = (batch: Batch): boolean => {
  const daysInStage = getDaysInStage(batch);
  const expectedMax = EXPECTED_DURATIONS[batch.currentStage]?.max || 999;
  
  // Needs action if past maximum expected duration
  return daysInStage > expectedMax;
};

/**
 * Calculate batch health score (0-100)
 */
export const getBatchHealthScore = (batch: Batch): number => {
  const progress = calculateProgress(batch);
  
  let score = 100;
  
  // Deduct points for being behind
  if (progress.status === 'behind') {
    score -= Math.min(20, -progress.daysAhead * 2);
  }
  
  // Deduct more for overdue
  if (progress.status === 'overdue') {
    score -= Math.min(40, -progress.daysAhead * 4);
  }
  
  // Add points for being ahead
  if (progress.status === 'ahead') {
    score = Math.min(100, score + progress.daysAhead);
  }
  
  return Math.max(0, score);
};

/**
 * Get color configuration for progress percentage
 */
export const getColorForProgress = (progress: number) => {
  if (progress < 30) {
    // Blue - Early stages
    return {
      start: 'hsl(var(--info))',
      end: 'hsl(var(--info) / 0.7)',
      textClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
    };
  } else if (progress < 70) {
    // Amber - Mid production
    return {
      start: 'hsl(var(--warning))',
      end: 'hsl(var(--warning) / 0.7)',
      textClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
    };
  } else if (progress < 100) {
    // Green - Nearing completion
    return {
      start: 'hsl(var(--success))',
      end: 'hsl(var(--success) / 0.7)',
      textClass: 'text-green-600',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
    };
  } else {
    // Success green with sparkle
    return {
      start: 'hsl(var(--success))',
      end: 'hsl(var(--success))',
      textClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
    };
  }
};

/**
 * Get color configuration for status
 */
export const getColorForStatus = (status: ProgressStatus) => {
  switch (status) {
    case 'overdue':
      return {
        textClass: 'text-red-600',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
      };
    case 'behind':
      return {
        textClass: 'text-orange-600',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-200',
      };
    case 'on-track':
      return {
        textClass: 'text-green-600',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
      };
    case 'ahead':
      return {
        textClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
      };
  }
};
