import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { VelocityMetrics } from '@/types/production-metrics.types';

interface VelocityIndicatorProps {
  velocity: VelocityMetrics;
}

export const VelocityIndicator = ({ velocity }: VelocityIndicatorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Batches/Week</span>
          {velocity.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
          {velocity.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          {velocity.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="text-2xl font-bold">{velocity.batchesPerWeek}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {velocity.comparedToLastPeriod > 0 ? '+' : ''}
          {velocity.comparedToLastPeriod}% vs last period
        </p>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Volume/Week</span>
          {velocity.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
          {velocity.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          {velocity.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
        </div>
        <p className="text-2xl font-bold">{velocity.volumePerWeek.toLocaleString()} L</p>
        <p className="text-xs text-muted-foreground mt-1">
          {velocity.comparedToLastPeriod > 0 ? '+' : ''}
          {velocity.comparedToLastPeriod}% vs last period
        </p>
      </div>
    </div>
  );
};
