import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VolumeByStageData } from '@/types/production-metrics.types';

interface VolumeByStageChartProps {
  data: VolumeByStageData[];
}

export const VolumeByStageChart = ({ data }: VolumeByStageChartProps) => {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="stage"
            className="text-xs"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs"
            tick={{ fontSize: 11 }}
            label={{ value: 'Liters', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as VolumeByStageData;
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3">
                  <p className="font-semibold text-sm">{data.stage}</p>
                  <p className="text-sm">Volume: {data.volume.toLocaleString()} L</p>
                  <p className="text-sm">Batches: {data.batchCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.percentage.toFixed(1)}% of total
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
          <span className="text-muted-foreground">Total Volume:</span>
          <span className="font-semibold">
            {data.reduce((sum, s) => sum + s.volume, 0).toLocaleString()} L
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
          <span className="text-muted-foreground">Total Batches:</span>
          <span className="font-semibold">
            {data.reduce((sum, s) => sum + s.batchCount, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
