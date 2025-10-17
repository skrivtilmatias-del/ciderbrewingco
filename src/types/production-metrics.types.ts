/**
 * Production metrics types
 */

export interface ProductionMetrics {
  volumeByStage: VolumeByStageData[];
  averageFermentationTime: FermentationTimeMetric;
  stageDistribution: StageDistribution[];
  alerts: ProductionAlert[];
  velocity: VelocityMetrics;
  efficiency: EfficiencyData;
  upcomingMilestones: Milestone[];
  qualityMetrics: QualityMetrics;
}

export interface VolumeByStageData {
  stage: string;
  volume: number;
  batchCount: number;
  percentage: number;
}

export interface FermentationTimeMetric {
  current: number; // days
  historical: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface StageDistribution {
  stage: string;
  count: number;
  color: string;
}

export interface ProductionAlert {
  id: string;
  type: 'overdue' | 'action_needed' | 'quality_issue' | 'capacity_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  batchId?: string;
  batchNumber?: string;
  actionRequired: string;
  dueDate?: Date;
  createdAt: Date;
}

export interface VelocityMetrics {
  batchesPerWeek: number;
  volumePerWeek: number;
  trend: 'up' | 'down' | 'stable';
  comparedToLastPeriod: number; // percentage
}

export interface EfficiencyData {
  onTimeCompletions: number; // percentage
  averageDelayDays: number;
  stageDurations: StageDuration[];
}

export interface StageDuration {
  stage: string;
  averageDays: number;
  targetDays: number;
  variance: number; // percentage
}

export interface Milestone {
  id: string;
  batchId: string;
  batchNumber: string;
  type: 'stage_change' | 'completion' | 'bottling' | 'measurement';
  description: string;
  dueDate: Date;
  isOverdue: boolean;
  daysUntil: number;
}

export interface QualityMetrics {
  averagePh: number;
  phTrend: number[];
  averageSg: number;
  sgTrend: number[];
  outOfSpecCount: number;
}

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
