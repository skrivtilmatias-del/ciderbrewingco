import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: string;
  value: number | null;
}

interface ParameterTrendChartProps {
  title: string;
  data: DataPoint[];
  color: string;
  unit: string;
  targetValue?: number;
}

export const ParameterTrendChart = ({ 
  title, 
  data, 
  color, 
  unit,
  targetValue 
}: ParameterTrendChartProps) => {
  console.log(`${title} Chart - Raw data received:`, data);
  
  const chartData = data
    .filter(d => d.value !== null)
    .map(d => ({
      date: format(new Date(d.date), "MMM dd"),
      value: d.value,
      target: targetValue
    }));

  console.log(`${title} Chart - Processed chartData:`, chartData);
  const hasData = chartData.length > 0;
  console.log(`${title} Chart - hasData:`, hasData);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">{title}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              className="text-muted-foreground"
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value.toFixed(3)} ${unit}`, title]}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
            />
            {targetValue && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      )}
    </Card>
  );
};
