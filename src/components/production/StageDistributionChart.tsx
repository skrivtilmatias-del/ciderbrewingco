import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { StageDistribution } from '@/types/production-metrics.types';

interface StageDistributionChartProps {
  data: StageDistribution[];
}

export const StageDistributionChart = ({ data }: StageDistributionChartProps) => {
  const total = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as StageDistribution;
              const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0';
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                  <p className="font-semibold text-sm">{data.stage}</p>
                  <p className="text-sm">{data.count} batches</p>
                  <p className="text-sm text-muted-foreground">{percentage}%</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.map((stage) => {
          const percentage = total > 0 ? ((stage.count / total) * 100).toFixed(0) : '0';
          return (
            <div key={stage.stage} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
              <span className="flex-1 truncate" title={stage.stage}>
                {stage.stage}
              </span>
              <span className="font-semibold">{stage.count}</span>
              <span className="text-xs text-muted-foreground">({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
