import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { differenceInDays, subWeeks, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import type { Batch } from '@/types/batch.types';
import type { 
  ProductionMetrics, 
  TimePeriod,
  VolumeByStageData,
  StageDistribution,
  ProductionAlert,
  Milestone,
} from '@/types/production-metrics.types';
import { toast } from 'sonner';

const STAGE_COLORS: Record<string, string> = {
  'Pressed/Racked': '#3b82f6',
  'Primary Fermentation': '#10b981',
  'Secondary/MLF': '#f59e0b',
  'Aging/Maturation': '#8b5cf6',
  'Clarification': '#ec4899',
  'Bottling': '#6366f1',
  'Quality Control': '#f43f5e',
  'Complete': '#6b7280',
};

const STAGE_TARGETS: Record<string, number> = {
  'Pressed/Racked': 1,
  'Primary Fermentation': 14,
  'Secondary/MLF': 30,
  'Aging/Maturation': 90,
  'Clarification': 7,
  'Bottling': 3,
  'Quality Control': 7,
};

export const useProductionMetrics = (batches: Batch[], timePeriod: TimePeriod) => {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['production-metrics', timePeriod, batches.length],
    queryFn: () => calculateMetrics(batches, timePeriod),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Simulate real-time updates (in production, use WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
    }, 60000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return { metrics, isLoading, error };
};

function calculateMetrics(batches: Batch[], timePeriod: TimePeriod): ProductionMetrics {
  // Filter batches by time period
  const filteredBatches = filterBatchesByPeriod(batches, timePeriod);
  
  // Calculate volume by stage
  const volumeByStage = calculateVolumeByStage(filteredBatches);
  
  // Calculate stage distribution
  const stageDistribution = calculateStageDistribution(filteredBatches);
  
  // Calculate fermentation time
  const averageFermentationTime = calculateAverageFermentationTime(filteredBatches, batches);
  
  // Generate alerts
  const alerts = generateAlerts(filteredBatches);
  
  // Calculate velocity
  const velocity = calculateVelocity(filteredBatches, batches, timePeriod);
  
  // Calculate efficiency
  const efficiency = calculateEfficiency(filteredBatches);
  
  // Get upcoming milestones
  const upcomingMilestones = calculateUpcomingMilestones(filteredBatches);
  
  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(filteredBatches);

  return {
    volumeByStage,
    averageFermentationTime,
    stageDistribution,
    alerts,
    velocity,
    efficiency,
    upcomingMilestones,
    qualityMetrics,
  };
}

function filterBatchesByPeriod(batches: Batch[], period: TimePeriod): Batch[] {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return batches.filter(b => {
        const date = new Date(b.created_at);
        return date >= startOfDay(now) && date <= endOfDay(now);
      });
    case 'week':
      return batches.filter(b => new Date(b.created_at) >= subWeeks(now, 1));
    case 'month':
      return batches.filter(b => new Date(b.created_at) >= subMonths(now, 1));
    case 'quarter':
      return batches.filter(b => new Date(b.created_at) >= subMonths(now, 3));
    case 'year':
      return batches.filter(b => new Date(b.created_at) >= subMonths(now, 12));
    case 'all':
    default:
      return batches;
  }
}

function calculateVolumeByStage(batches: Batch[]): VolumeByStageData[] {
  const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);
  
  const byStage = batches.reduce((acc, batch) => {
    const stage = batch.current_stage;
    if (!acc[stage]) {
      acc[stage] = { volume: 0, count: 0 };
    }
    acc[stage].volume += batch.volume;
    acc[stage].count += 1;
    return acc;
  }, {} as Record<string, { volume: number; count: number }>);

  return Object.entries(byStage)
    .map(([stage, data]) => ({
      stage,
      volume: data.volume,
      batchCount: data.count,
      percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
    }))
    .sort((a, b) => b.volume - a.volume);
}

function calculateStageDistribution(batches: Batch[]): StageDistribution[] {
  const distribution = batches.reduce((acc, batch) => {
    const stage = batch.current_stage;
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(distribution).map(([stage, count]) => ({
    stage,
    count,
    color: STAGE_COLORS[stage] || '#64748b',
  }));
}

function calculateAverageFermentationTime(current: Batch[], all: Batch[]) {
  const completedBatches = current.filter(b => b.completed_at);
  
  if (completedBatches.length === 0) {
    return {
      current: 0,
      historical: 0,
      trend: 'stable' as 'up' | 'down' | 'stable',
      percentageChange: 0,
    };
  }

  const currentAvg = completedBatches.reduce((sum, b) => {
    const days = differenceInDays(new Date(b.completed_at!), new Date(b.started_at));
    return sum + days;
  }, 0) / completedBatches.length;

  const allCompleted = all.filter(b => b.completed_at);
  const historicalAvg = allCompleted.length > 0
    ? allCompleted.reduce((sum, b) => {
        const days = differenceInDays(new Date(b.completed_at!), new Date(b.started_at));
        return sum + days;
      }, 0) / allCompleted.length
    : currentAvg;

  const change = historicalAvg > 0 ? ((currentAvg - historicalAvg) / historicalAvg) * 100 : 0;

  return {
    current: currentAvg,
    historical: historicalAvg,
    trend: (change > 5 ? 'up' : change < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    percentageChange: Math.abs(change),
  };
}

function generateAlerts(batches: Batch[]): ProductionAlert[] {
  const alerts: ProductionAlert[] = [];
  const now = new Date();

  batches.forEach(batch => {
    const daysInStage = differenceInDays(now, new Date(batch.updated_at));
    const targetDays = STAGE_TARGETS[batch.current_stage] || 30;

    // Overdue alert
    if (daysInStage > targetDays * 1.5) {
      alerts.push({
        id: `overdue-${batch.id}`,
        type: 'overdue',
        severity: daysInStage > targetDays * 2 ? 'critical' : 'high',
        title: 'Batch Overdue',
        description: `${batch.name} has been in ${batch.current_stage} for ${daysInStage} days`,
        batchId: batch.id,
        batchNumber: batch.name,
        actionRequired: 'Review batch status and advance to next stage',
        dueDate: new Date(batch.updated_at),
        createdAt: now,
      });
    }

    // Action needed (approaching target)
    if (daysInStage > targetDays * 0.9 && daysInStage <= targetDays * 1.5) {
      alerts.push({
        id: `action-${batch.id}`,
        type: 'action_needed',
        severity: 'medium',
        title: 'Action Needed Soon',
        description: `${batch.name} approaching target duration in ${batch.current_stage}`,
        batchId: batch.id,
        batchNumber: batch.name,
        actionRequired: 'Plan next stage transition',
        createdAt: now,
      });
    }

    // Quality issues (placeholder - would check actual measurements)
    if (batch.target_ph && Math.random() > 0.9) {
      alerts.push({
        id: `quality-${batch.id}`,
        type: 'quality_issue',
        severity: 'high',
        title: 'Quality Parameter Out of Range',
        description: `${batch.name} may have pH outside target range`,
        batchId: batch.id,
        batchNumber: batch.name,
        actionRequired: 'Check pH and take corrective action',
        createdAt: now,
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  }).slice(0, 10);
}

function calculateVelocity(current: Batch[], all: Batch[], period: TimePeriod) {
  const weeksMultiplier = {
    today: 1 / 7,
    week: 1,
    month: 4,
    quarter: 13,
    year: 52,
    all: 52,
  }[period];

  const batchesPerWeek = current.length / weeksMultiplier;
  const volumePerWeek = current.reduce((sum, b) => sum + b.volume, 0) / weeksMultiplier;

  // Compare to previous period
  const previousPeriodBatches = all.length > current.length ? all.length - current.length : 0;
  const change = previousPeriodBatches > 0
    ? ((current.length - previousPeriodBatches) / previousPeriodBatches) * 100
    : 0;

  return {
    batchesPerWeek: Math.round(batchesPerWeek * 10) / 10,
    volumePerWeek: Math.round(volumePerWeek),
    trend: (change > 5 ? 'up' : change < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    comparedToLastPeriod: Math.round(change),
  };
}

function calculateEfficiency(batches: Batch[]) {
  const completed = batches.filter(b => b.completed_at);
  const onTime = completed.filter(b => {
    if (!b.estimated_completion_date) return true;
    return isBefore(new Date(b.completed_at!), new Date(b.estimated_completion_date));
  });

  const onTimeCompletions = completed.length > 0
    ? Math.round((onTime.length / completed.length) * 100)
    : 100;

  const delays = completed
    .filter(b => b.estimated_completion_date)
    .map(b => {
      return differenceInDays(
        new Date(b.completed_at!),
        new Date(b.estimated_completion_date!)
      );
    })
    .filter(d => d > 0);

  const averageDelayDays = delays.length > 0
    ? delays.reduce((sum, d) => sum + d, 0) / delays.length
    : 0;

  const stageDurations = Object.entries(STAGE_TARGETS).map(([stage, target]) => {
    const batchesInStage = batches.filter(b => b.current_stage === stage);
    const avgDays = batchesInStage.length > 0
      ? batchesInStage.reduce((sum, b) => {
          return sum + differenceInDays(new Date(), new Date(b.updated_at));
        }, 0) / batchesInStage.length
      : target;

    return {
      stage,
      averageDays: Math.round(avgDays * 10) / 10,
      targetDays: target,
      variance: target > 0 ? ((avgDays - target) / target) * 100 : 0,
    };
  });

  return {
    onTimeCompletions,
    averageDelayDays: Math.round(averageDelayDays * 10) / 10,
    stageDurations,
  };
}

function calculateUpcomingMilestones(batches: Batch[]): Milestone[] {
  const now = new Date();
  const milestones: Milestone[] = [];

  batches.forEach(batch => {
    const daysInStage = differenceInDays(now, new Date(batch.updated_at));
    const targetDays = STAGE_TARGETS[batch.current_stage] || 30;
    const dueDate = new Date(batch.updated_at);
    dueDate.setDate(dueDate.getDate() + targetDays);

    milestones.push({
      id: `milestone-${batch.id}`,
      batchId: batch.id,
      batchNumber: batch.name,
      type: 'stage_change',
      description: `Advance ${batch.name} from ${batch.current_stage}`,
      dueDate,
      isOverdue: daysInStage > targetDays,
      daysUntil: differenceInDays(dueDate, now),
    });

    if (batch.estimated_completion_date) {
      const completionDate = new Date(batch.estimated_completion_date);
      milestones.push({
        id: `completion-${batch.id}`,
        batchId: batch.id,
        batchNumber: batch.name,
        type: 'completion',
        description: `Complete ${batch.name}`,
        dueDate: completionDate,
        isOverdue: isAfter(now, completionDate),
        daysUntil: differenceInDays(completionDate, now),
      });
    }
  });

  return milestones
    .filter(m => Math.abs(m.daysUntil) <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);
}

function calculateQualityMetrics(batches: Batch[]) {
  const withPh = batches.filter(b => b.target_ph);
  const withSg = batches.filter(b => b.target_fg);

  const averagePh = withPh.length > 0
    ? withPh.reduce((sum, b) => sum + (b.target_ph || 0), 0) / withPh.length
    : 3.5;

  const averageSg = withSg.length > 0
    ? withSg.reduce((sum, b) => sum + (b.target_fg || 0), 0) / withSg.length
    : 1.010;

  // Generate trend data (placeholder - would come from measurements)
  const phTrend = Array.from({ length: 10 }, () => 3.3 + Math.random() * 0.4);
  const sgTrend = Array.from({ length: 10 }, () => 1.005 + Math.random() * 0.015);

  return {
    averagePh: Math.round(averagePh * 100) / 100,
    phTrend,
    averageSg: Math.round(averageSg * 1000) / 1000,
    sgTrend,
    outOfSpecCount: Math.floor(Math.random() * 3), // Placeholder
  };
}
