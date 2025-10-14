import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EconResult } from "@/econ/types";
import { formatCurrency, formatPercent } from "@/econ/calc";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BreakdownCardProps {
  result: EconResult;
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export const BreakdownCard = ({ result }: BreakdownCardProps) => {
  const breakdownData = [
    { name: 'Juice', value: result.breakdown.juice },
    { name: 'Yeast', value: result.breakdown.yeast },
    { name: 'Packaging', value: result.breakdown.packaging },
    { name: 'Labor', value: result.breakdown.labor },
    { name: 'Overhead', value: result.breakdown.overhead },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={(entry) => `${entry.name} ${((entry.value / result.totalCOGS) * 100).toFixed(0)}%`}
              >
                {breakdownData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per Unit Costs */}
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Per Liter</div>
            <div className="text-2xl font-bold">{formatCurrency(result.cogsPerLiter)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">75cl Bottle</div>
              <div className="text-xl font-semibold">{formatCurrency(result.cogsPerBottle75cl)}</div>
              <Badge variant="outline" className="mt-1">
                Margin: {formatPercent(result.grossMarginPct75cl)}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">150cl Bottle</div>
              <div className="text-xl font-semibold">{formatCurrency(result.cogsPerBottle150cl)}</div>
              <Badge variant="outline" className="mt-1">
                Margin: {formatPercent(result.grossMarginPct150cl)}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total COGS</span>
              <span className="text-xl font-bold">{formatCurrency(result.totalCOGS)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Total Profit</span>
              <span className={`text-xl font-bold ${result.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(result.totalProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
