import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Batch } from '@/components/BatchCard';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Props for ProductionMetricsWidget
 */
interface ProductionMetricsWidgetProps {
  batches: Batch[];
}

/**
 * Color palette for charts
 */
const STAGE_COLORS = {
  'Juice Preparation': '#3b82f6',
  'Fermentation': '#8b5cf6',
  'Maturation': '#10b981',
  'Clarification': '#f59e0b',
  'Blending': '#ec4899',
  'Bottling': '#06b6d4',
  'Complete': '#22c55e',
  'Aging': '#a855f7',
} as const;

/**
 * Calculate production metrics from batches
 */
const useProductionMetrics = (batches: Batch[]) => {
  return useMemo(() => {
    const activeBatches = batches.filter(b => b.currentStage !== 'Complete');
    
    // 1. Volume in Production
    const totalVolume = activeBatches.reduce((sum, b) => sum + b.volume, 0);
    const volumeByStage = Object.entries(
      activeBatches.reduce((acc, b) => {
        acc[b.currentStage] = (acc[b.currentStage] || 0) + b.volume;
        return acc;
      }, {} as Record<string, number>)
    ).map(([stage, volume]) => ({
      stage,
      volume: Math.round(volume),
      fill: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#6b7280',
    }));

    // 2. Average Fermentation Time
    const now = new Date();
    const avgDaysInProduction = activeBatches.length > 0
      ? Math.round(
          activeBatches.reduce((sum, b) => {
            const days = Math.floor((now.getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / activeBatches.length
        )
      : 0;

    // 3. Batches by Stage (for donut chart)
    const batchesByStage = Object.entries(
      batches.reduce((acc, b) => {
        acc[b.currentStage] = (acc[b.currentStage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([stage, count]) => ({
      name: stage,
      value: count,
      fill: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#6b7280',
    }));

    // 4. Stage Alerts
    const overdueThreshold = 60; // days
    const overdueBatches = activeBatches.filter(b => {
      const days = Math.floor((now.getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24));
      return days > overdueThreshold;
    });

    // 5. Production Velocity
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const completedThisMonth = batches.filter(b => 
      b.currentStage === 'Complete' && 
      new Date(b.startDate) >= thirtyDaysAgo
    ).length;

    const efficiencyScore = activeBatches.length > 0
      ? Math.min(100, Math.round((completedThisMonth / (activeBatches.length + completedThisMonth)) * 100))
      : 0;

    // 6. Upcoming Milestones
    const upcomingBatches = activeBatches
      .map(b => ({
        ...b,
        daysInStage: Math.floor((now.getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 5);

    return {
      totalVolume,
      volumeByStage,
      avgDaysInProduction,
      batchesByStage,
      overdueBatches,
      completedThisMonth,
      efficiencyScore,
      upcomingBatches,
      activeBatchesCount: activeBatches.length,
      totalBatchesCount: batches.length,
    };
  }, [batches]);
};

/**
 * ProductionMetricsWidget - Comprehensive production analytics dashboard
 */
export const ProductionMetricsWidget = ({ batches }: ProductionMetricsWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    volume: true,
    fermentation: false,
    distribution: true,
    alerts: true,
    velocity: false,
    milestones: false,
  });

  const metrics = useProductionMetrics(batches);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Production Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metrics.activeBatchesCount} active batches • {metrics.totalVolume.toFixed(0)}L in production
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Activity className="h-3 w-3" />
                  Live
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume in Production */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Volume in Production
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('volume')}
                  >
                    {expandedSections.volume ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {expandedSections.volume && (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{metrics.totalVolume.toFixed(0)}</span>
                      <span className="text-muted-foreground">liters</span>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={metrics.volumeByStage}>
                        <XAxis dataKey="stage" fontSize={12} angle={-45} textAnchor="end" height={80} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="volume" radius={[8, 8, 0, 0]}>
                          {metrics.volumeByStage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>

              {/* Batches by Stage - Donut Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Batches by Stage
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('distribution')}
                  >
                    {expandedSections.distribution ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {expandedSections.distribution && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={metrics.batchesByStage}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {metrics.batchesByStage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <Separator />

            {/* Metrics Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Average Fermentation Time */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg. Days in Production</p>
                      <p className="text-2xl font-bold">{metrics.avgDaysInProduction}</p>
                      <p className="text-xs text-muted-foreground mt-1">days</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              {/* Production Velocity */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completed This Month</p>
                      <p className="text-2xl font-bold">{metrics.completedThisMonth}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <p className="text-xs text-green-500">On track</p>
                      </div>
                    </div>
                    <Zap className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              {/* Efficiency Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Efficiency Score</p>
                      <p className="text-2xl font-bold">{metrics.efficiencyScore}%</p>
                      <Progress value={metrics.efficiencyScore} className="mt-2" />
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stage Alerts */}
            {metrics.overdueBatches.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Stage Alerts
                    </h3>
                    <Badge variant="destructive">{metrics.overdueBatches.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {metrics.overdueBatches.slice(0, 3).map(batch => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800"
                      >
                        <div>
                          <p className="font-medium text-sm">{batch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch.currentStage} • {Math.floor((Date.now() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Attention Needed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Upcoming Milestones */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Longest in Current Stage
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('milestones')}
                >
                  {expandedSections.milestones ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedSections.milestones && (
                <div className="space-y-2">
                  {metrics.upcomingBatches.map((batch, index) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{batch.name}</p>
                          <p className="text-xs text-muted-foreground">{batch.variety}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{batch.currentStage}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {batch.daysInStage} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
