import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EconVariance } from "@/econ/types";
import { formatCurrency, formatPercent } from "@/econ/calc";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VarianceTableProps {
  variances: EconVariance[];
}

export const VarianceTable = ({ variances }: VarianceTableProps) => {
  if (variances.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Planned vs Actuals</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No actual data available yet. Complete batches will appear here for variance analysis.
        </p>
      </Card>
    );
  }

  const getVarianceIcon = (pct: number) => {
    if (Math.abs(pct) < 1) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (pct > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <TrendingDown className="h-4 w-4 text-green-600" />;
  };

  const getVarianceColor = (pct: number, inverse: boolean = false) => {
    if (Math.abs(pct) < 1) return 'text-muted-foreground';
    const isUnfavorable = inverse ? pct < 0 : pct > 0;
    return isUnfavorable ? 'text-red-600 font-medium' : 'text-green-600 font-medium';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Planned vs Actuals</h3>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">COGS/L (Plan)</TableHead>
              <TableHead className="text-right">COGS/L (Actual)</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Margin % (Plan)</TableHead>
              <TableHead className="text-right">Margin % (Actual)</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Profit Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variances.map((v) => (
              <TableRow key={v.batchId}>
                <TableCell className="font-medium">{v.batchName}</TableCell>
                
                {/* COGS per Liter */}
                <TableCell className="text-right">
                  {formatCurrency(v.planned.cogsPerLiter)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(v.actual.cogsPerLiter)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getVarianceIcon(v.variances.cogsPerLiter.pct)}
                    <span className={getVarianceColor(v.variances.cogsPerLiter.pct)}>
                      {formatPercent(v.variances.cogsPerLiter.pct)}
                    </span>
                  </div>
                </TableCell>

                {/* Margin % */}
                <TableCell className="text-right">
                  {formatPercent(v.planned.grossMarginPct75cl)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(v.actual.grossMarginPct75cl)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getVarianceIcon(-v.variances.grossMarginPct75cl.pct)}
                    <span className={getVarianceColor(v.variances.grossMarginPct75cl.pct, true)}>
                      {formatPercent(v.variances.grossMarginPct75cl.pct)}
                    </span>
                  </div>
                </TableCell>

                {/* Profit Delta */}
                <TableCell className="text-right">
                  <Badge
                    variant={v.variances.totalProfit.value >= 0 ? "default" : "destructive"}
                    className="font-mono"
                  >
                    {formatCurrency(v.variances.totalProfit.value, 0)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
        <div>
          <TrendingUp className="h-3 w-3 text-red-600 inline mr-1" />
          Red = Unfavorable variance
        </div>
        <div className="ml-4">
          <TrendingDown className="h-3 w-3 text-green-600 inline mr-1" />
          Green = Favorable variance
        </div>
      </div>
    </Card>
  );
};
