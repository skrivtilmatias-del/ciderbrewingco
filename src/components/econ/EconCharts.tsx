import { Card } from "@/components/ui/card";
import { EconResult } from "@/econ/types";
import { priceSensitivity } from "@/econ/calc";
import { EconInput } from "@/econ/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatPercent } from "@/econ/calc";

interface EconChartsProps {
  input: EconInput;
  result: EconResult;
}

export const EconCharts = ({ input, result }: EconChartsProps) => {
  // Generate price sensitivity data
  const priceData = priceSensitivity(input, {
    min: input.pricing.bottle75clExclVAT * 0.7,
    max: input.pricing.bottle75clExclVAT * 1.3,
    steps: 12,
  });

  // COGS breakdown for bar chart
  const cogsData = [
    { name: 'Juice', value: result.breakdown.juice, pct: (result.breakdown.juice / result.totalCOGS) * 100 },
    { name: 'Yeast', value: result.breakdown.yeast, pct: (result.breakdown.yeast / result.totalCOGS) * 100 },
    { name: 'Packaging', value: result.breakdown.packaging, pct: (result.breakdown.packaging / result.totalCOGS) * 100 },
    { name: 'Labor', value: result.breakdown.labor, pct: (result.breakdown.labor / result.totalCOGS) * 100 },
    { name: 'Overhead', value: result.breakdown.overhead, pct: (result.breakdown.overhead / result.totalCOGS) * 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Margin vs Price */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Margin vs Price (75cl)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="price"
              className="text-xs"
              tickFormatter={(value) => `${value} kr`}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              label={{ value: 'Revenue (kr)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number, name: string) => {
                if (name === 'marginPct') return [formatPercent(value), 'Margin %'];
                if (name === 'revenue') return [formatCurrency(value, 0), 'Revenue'];
                return [value, name];
              }}
            />
            <Legend />
            <ReferenceLine
              x={input.pricing.bottle75clExclVAT}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              label="Current"
              yAxisId="left"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="marginPct"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Margin %"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Revenue"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* COGS Breakdown Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">COGS Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cogsData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-2">
          {cogsData.map((item) => (
            <div
              key={item.name}
              className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
            >
              <span className="font-medium">{item.name}:</span>
              <span>{item.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Break-even Analysis */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Break-even Analysis</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Breakeven Bottles</div>
            <div className="text-3xl font-bold text-primary">{result.breakevenBottles75cl}</div>
            <div className="text-xs text-muted-foreground mt-1">75cl bottles</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Breakeven Volume</div>
            <div className="text-3xl font-bold text-primary">{result.breakevenVolumeLiters.toFixed(0)}L</div>
            <div className="text-xs text-muted-foreground mt-1">total liters</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Breakeven Revenue</div>
            <div className="text-3xl font-bold text-primary">{formatCurrency(result.breakevenRevenue, 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">excl. VAT</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Production:</span>
              <span className="ml-2 font-medium">{result.bottles75cl} bottles</span>
            </div>
            <div>
              <span className="text-muted-foreground">Above Breakeven:</span>
              <span className={`ml-2 font-medium ${result.bottles75cl > result.breakevenBottles75cl ? 'text-green-600' : 'text-red-600'}`}>
                {result.bottles75cl > result.breakevenBottles75cl ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Margin of Safety:</span>
              <span className="ml-2 font-medium">
                {result.bottles75cl > result.breakevenBottles75cl
                  ? `${((1 - result.breakevenBottles75cl / result.bottles75cl) * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Bottles to Break-even:</span>
              <span className="ml-2 font-medium">
                {Math.max(0, result.breakevenBottles75cl - result.bottles75cl)} more
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
