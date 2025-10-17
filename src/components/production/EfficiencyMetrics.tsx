import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { EfficiencyData } from '@/types/production-metrics.types';

interface EfficiencyMetricsProps {
  efficiency: EfficiencyData;
}

export const EfficiencyMetrics = ({ efficiency }: EfficiencyMetricsProps) => {
  return (
    <div className="space-y-4">
      {/* Overall Efficiency */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Overall Efficiency</span>
          <Badge
            variant={
              efficiency.onTimeCompletions >= 90
                ? 'default'
                : efficiency.onTimeCompletions >= 75
                ? 'secondary'
                : 'destructive'
            }
          >
            {efficiency.onTimeCompletions}%
          </Badge>
        </div>
        <Progress value={efficiency.onTimeCompletions} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {efficiency.averageDelayDays > 0
            ? `Average delay: ${efficiency.averageDelayDays.toFixed(1)} days`
            : 'All batches on schedule'}
        </p>
      </div>

      {/* Stage Duration Analysis */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Stage Duration vs Target</h4>
        {efficiency.stageDurations.map((stage) => {
          const isOverTarget = stage.averageDays > stage.targetDays;
          const variance = Math.abs(stage.variance);

          return (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate" title={stage.stage}>
                  {stage.stage}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-semibold',
                      isOverTarget ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {stage.averageDays.toFixed(1)}d
                  </span>
                  <span className="text-muted-foreground text-xs">/ {stage.targetDays}d</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min((stage.averageDays / stage.targetDays) * 100, 100)}
                  className={cn('h-1.5 flex-1', isOverTarget && '[&>div]:bg-red-500')}
                />
                <Badge
                  variant={isOverTarget ? 'destructive' : 'default'}
                  className="text-xs min-w-[60px] justify-center"
                >
                  {isOverTarget ? '+' : '-'}
                  {variance.toFixed(0)}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
