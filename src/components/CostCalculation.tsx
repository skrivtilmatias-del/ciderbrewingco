import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Building2, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export const CostCalculation = () => {
  // Production volume data from the Excel file
  const yearlyData = [
    {
      year: "Year 1 (2026)",
      production: 1000,
      availableSales: 200,
      bottlePrice: 100,
      revenue: 20000,
      cogs: 26901,
      cogsPerBottle: 27,
      labourCost: 0,
      overheads: 10000,
      profit: -16901,
      profitMargin: -85,
      capex: 18000,
      investment: 20000,
      cashBalance: -14901,
    },
    {
      year: "Year 2 (2027)",
      production: 2000,
      availableSales: 1000,
      bottlePrice: 100,
      revenue: 100000,
      cogs: 53802,
      cogsPerBottle: 27,
      labourCost: 0,
      overheads: 20000,
      profit: 26198,
      profitMargin: 26,
      capex: 8000,
      investment: 0,
      cashBalance: 3297,
    },
    {
      year: "Year 3 (2028)",
      production: 5000,
      availableSales: 2000,
      bottlePrice: 110,
      revenue: 220000,
      cogs: 80000,
      cogsPerBottle: 16,
      labourCost: 0,
      overheads: 30000,
      profit: 110000,
      profitMargin: 50,
      capex: 9000,
      investment: 0,
      cashBalance: 104297,
    },
    {
      year: "Year 4 (2029)",
      production: 15000,
      availableSales: 5000,
      bottlePrice: 113,
      revenue: 566500,
      cogs: 383100,
      cogsPerBottle: 26,
      labourCost: 1000000,
      overheads: 300000,
      profit: -1116600,
      profitMargin: -197,
      capex: 300000,
      investment: 1500000,
      cashBalance: 187697,
    },
    {
      year: "Year 5 (2030)",
      production: 20000,
      availableSales: 15000,
      bottlePrice: 117,
      revenue: 1750485,
      cogs: 487200,
      cogsPerBottle: 24,
      labourCost: 1000000,
      overheads: 300000,
      profit: -36715,
      profitMargin: -2,
      capex: 90000,
      investment: 0,
      cashBalance: 60982,
    },
    {
      year: "Year 6",
      production: 30000,
      availableSales: 20000,
      bottlePrice: 120,
      revenue: 2403999,
      cogs: 730800,
      cogsPerBottle: 24,
      labourCost: 1200000,
      overheads: 300000,
      profit: 173199,
      profitMargin: 7,
      capex: 300000,
      investment: 0,
      cashBalance: -65819,
    },
    {
      year: "Year 7",
      production: 50000,
      availableSales: 30000,
      bottlePrice: 124,
      revenue: 3714179,
      cogs: 1165500,
      cogsPerBottle: 23,
      labourCost: 1500000,
      overheads: 600000,
      profit: 448679,
      profitMargin: 12,
      capex: 120000,
      investment: 0,
      cashBalance: 262860,
    },
    {
      year: "Year 8",
      production: 60000,
      availableSales: 50000,
      bottlePrice: 128,
      revenue: 6376007,
      cogs: 1398600,
      cogsPerBottle: 23,
      labourCost: 1700000,
      overheads: 800000,
      profit: 2477407,
      profitMargin: 39,
      capex: 100000,
      investment: 0,
      cashBalance: 2640268,
    },
    {
      year: "Year 9",
      production: 70000,
      availableSales: 60000,
      bottlePrice: 131,
      revenue: 7880745,
      cogs: 1631700,
      cogsPerBottle: 23,
      labourCost: 2000000,
      overheads: 1000000,
      profit: 3249045,
      profitMargin: 41,
      capex: 100000,
      investment: 0,
      cashBalance: 5789313,
    },
    {
      year: "Year 10",
      production: 150000,
      availableSales: 70000,
      bottlePrice: 135,
      revenue: 9470029,
      cogs: 1500000,
      cogsPerBottle: 10,
      labourCost: 2500000,
      overheads: 1500000,
      profit: 3970029,
      profitMargin: 42,
      capex: 650000,
      investment: 0,
      cashBalance: 9109342,
    },
    {
      year: "Year 11",
      production: 150000,
      availableSales: 150000,
      bottlePrice: 139,
      revenue: 20901706,
      cogs: 1500000,
      cogsPerBottle: 10,
      labourCost: 4500000,
      overheads: 2000000,
      profit: 12901706,
      profitMargin: 62,
      capex: 0,
      investment: 0,
      cashBalance: 22011048,
    },
  ];

  // COGS breakdown by volume (from Excel)
  const cogsBreakdown = [
    { volume: 200, total: 51.11, juice: 20, yeast: 3.8, bottle: 10, cap: 0.2, label: 6, sugar: 0.15, other: 10.96 },
    { volume: 500, total: 46.31, juice: 18, yeast: 2, bottle: 10, cap: 0.2, label: 5, sugar: 0.15, other: 10.96 },
    { volume: 1000, total: 26.9, juice: 8, yeast: 0.741, bottle: 3, cap: 0.1, label: 4, sugar: 0.1, other: 10.96 },
    { volume: 5000, total: 25.54, juice: 8, yeast: 0.48, bottle: 3, cap: 0.05, label: 3, sugar: 0.05, other: 10.96 },
    { volume: 10000, total: 26.43, juice: 10, yeast: 0.37, bottle: 3, cap: 0.05, label: 2, sugar: 0.05, other: 10.96 },
    { volume: 20000, total: 24.36, juice: 10, yeast: 0.3, bottle: 2, cap: 0.05, label: 1, sugar: 0.05, other: 10.96 },
    { volume: 50000, total: 23.31, juice: 10, yeast: 0.25, bottle: 1.5, cap: 0.05, label: 0.5, sugar: 0.05, other: 10.96 },
  ];

  // Calculate key metrics
  const totalRevenue11Years = yearlyData.reduce((sum, year) => sum + year.revenue, 0);
  const totalProfit11Years = yearlyData.reduce((sum, year) => sum + year.profit, 0);
  const totalCapex = yearlyData.reduce((sum, year) => sum + year.capex, 0);
  const totalInvestment = yearlyData.reduce((sum, year) => sum + year.investment, 0);
  const breakEvenYear = yearlyData.find(y => y.profit > 0)?.year || "Year 11+";

  // Find years with negative cash flow
  const negativeYears = yearlyData.filter(y => y.cashBalance < 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Cost Calculation & Economics</h2>
        <p className="text-muted-foreground mt-2">
          Comprehensive financial overview of your cider production business (DKK)
        </p>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue (11Y)</p>
              <p className="text-2xl font-bold">
                {(totalRevenue11Years / 1000000).toFixed(1)}M kr
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit (11Y)</p>
              <p className="text-2xl font-bold">
                {(totalProfit11Years / 1000000).toFixed(1)}M kr
              </p>
              <Badge variant={totalProfit11Years > 0 ? "default" : "destructive"} className="mt-2">
                {totalProfit11Years > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {((totalProfit11Years / totalRevenue11Years) * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total CAPEX</p>
              <p className="text-2xl font-bold">
                {(totalCapex / 1000).toFixed(0)}k kr
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                + {(totalInvestment / 1000000).toFixed(1)}M kr investment
              </p>
            </div>
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Break-even</p>
              <p className="text-2xl font-bold">{breakEvenYear.replace("Year ", "Y")}</p>
              <Badge variant="outline" className="mt-2">Profitability timeline</Badge>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Cash Flow Warning */}
      {negativeYears.length > 0 && (
        <Card className="p-6 border-amber-500/50 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">Cash Flow Alert</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Negative cash balance detected in: {negativeYears.map(y => y.year).join(", ")}
              </p>
              <p className="text-sm mt-2">
                <strong>Recommendation:</strong> Secure additional working capital or adjust investment timing to cover operational expenses during growth phases.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Revenue & Profit Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Revenue vs Profit Projection</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => `${(value / 1000).toFixed(0)}k kr`}
            />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Cost Structure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COGS Per Bottle by Scale */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">COGS per Bottle by Production Scale</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cogsBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="volume" label={{ value: "Production Volume", position: "insideBottom", offset: -5 }} className="text-xs" />
              <YAxis label={{ value: "Cost (DKK)", angle: -90, position: "insideLeft" }} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => `${value.toFixed(2)} kr`}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} name="Total COGS" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Key Insight:</strong> COGS drops dramatically from <strong>51 kr</strong> at 200 bottles to <strong>10 kr</strong> at 150,000 bottles.
              Major savings come from economies of scale in bottles, labels, and juice procurement.
            </p>
          </div>
        </Card>

        {/* Profit Margin Evolution */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Profit Margin Evolution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" className="text-xs" />
              <YAxis className="text-xs" label={{ value: "Margin %", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="profitMargin" fill="hsl(var(--chart-3))" name="Profit Margin %" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Key Insight:</strong> Margins turn positive in Year 2, then dip negative again in Years 4-5 due to major investment and labor costs.
              Achieve sustainable 40%+ margins from Year 9 onwards.
            </p>
          </div>
        </Card>
      </div>

      {/* COGS Component Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">COGS Component Breakdown by Volume</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cogsBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="volume" type="category" className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => `${value.toFixed(2)} kr`}
            />
            <Legend />
            <Bar dataKey="juice" stackId="a" fill="hsl(var(--chart-1))" name="Juice" />
            <Bar dataKey="yeast" stackId="a" fill="hsl(var(--chart-2))" name="Yeast" />
            <Bar dataKey="bottle" stackId="a" fill="hsl(var(--chart-3))" name="Bottle" />
            <Bar dataKey="label" stackId="a" fill="hsl(var(--chart-4))" name="Label" />
            <Bar dataKey="other" stackId="a" fill="hsl(var(--chart-5))" name="Other" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm">
            <strong>Recommendation:</strong> Focus negotiation efforts on juice, bottles, and labels as these show the most significant cost reduction potential with volume scaling.
            The "Other" category (10.96 kr) remains constant - investigate opportunities to reduce fixed costs per unit.
          </p>
        </div>
      </Card>

      {/* CAPEX & Investment Timeline */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">CAPEX & Investment Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => `${(value / 1000).toFixed(0)}k kr`}
            />
            <Legend />
            <Bar dataKey="capex" fill="hsl(var(--chart-1))" name="CAPEX" />
            <Bar dataKey="investment" fill="hsl(var(--chart-5))" name="Investment" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Major Investment Points:</h4>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Year 1:</strong> 20k kr investment + 18k kr equipment (initial setup)</li>
            <li>• <strong>Year 4:</strong> 1.5M kr investment + 300k kr CAPEX (major expansion phase)</li>
            <li>• <strong>Year 6:</strong> 300k kr CAPEX (production scaling)</li>
            <li>• <strong>Year 10:</strong> 650k kr CAPEX (final capacity upgrade)</li>
          </ul>
        </div>
      </Card>

      {/* Detailed Year-by-Year Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Detailed Financial Projections</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-2 font-semibold">Year</th>
                <th className="p-2 font-semibold text-right">Production</th>
                <th className="p-2 font-semibold text-right">Revenue</th>
                <th className="p-2 font-semibold text-right">COGS</th>
                <th className="p-2 font-semibold text-right">Labour</th>
                <th className="p-2 font-semibold text-right">Overheads</th>
                <th className="p-2 font-semibold text-right">Profit</th>
                <th className="p-2 font-semibold text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((year, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{year.year}</td>
                  <td className="p-2 text-right">{year.production.toLocaleString()}</td>
                  <td className="p-2 text-right">{(year.revenue / 1000).toFixed(0)}k</td>
                  <td className="p-2 text-right">{(year.cogs / 1000).toFixed(0)}k</td>
                  <td className="p-2 text-right">{(year.labourCost / 1000).toFixed(0)}k</td>
                  <td className="p-2 text-right">{(year.overheads / 1000).toFixed(0)}k</td>
                  <td className={`p-2 text-right font-semibold ${year.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(year.profit / 1000).toFixed(0)}k
                  </td>
                  <td className="p-2 text-right">
                    <Badge variant={year.profitMargin >= 0 ? "default" : "destructive"}>
                      {year.profitMargin}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Strategic Recommendations */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Strategic Recommendations
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-2">1. Pricing Strategy</h4>
            <p className="text-sm text-muted-foreground">
              Current pricing shows 3-4% annual increases. Consider implementing tiered pricing based on production volume and market positioning.
              Premium positioning could support 120-150 kr bottle prices in later years.
            </p>
          </div>
          
          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-2">2. Cost Optimization</h4>
            <p className="text-sm text-muted-foreground">
              COGS drops from 27 kr to 10 kr per bottle with scale. Negotiate long-term contracts with suppliers at Year 4 volumes to lock in 15-20 kr/bottle rates earlier.
              Focus on the "Other" category (10.96 kr) which remains constant - this represents the biggest per-unit optimization opportunity.
            </p>
          </div>
          
          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-2">3. Cash Flow Management</h4>
            <p className="text-sm text-muted-foreground">
              Year 6 shows negative cash balance despite positive profits. Secure a 300-500k kr credit line before Year 4 expansion to smooth working capital requirements.
              Consider phasing CAPEX investments across 2-3 quarters rather than lump sums.
            </p>
          </div>
          
          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-2">4. Labour Planning</h4>
            <p className="text-sm text-muted-foreground">
              Labour jumps from 0 to 1M kr in Year 4 (68% of revenue!). Consider gradual hiring in Year 3 (500k kr) and implement automation where possible
              to keep labour costs below 30% of revenue. Target ratio: Year 4-7 labour should be 25-30% of revenue, not 53-177%.
            </p>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-2">5. Investment Timing</h4>
            <p className="text-sm text-muted-foreground">
              The 1.5M kr Year 4 investment coincides with negative profits. Consider spreading this across Years 3-5 (500k each year) or securing investment earlier
              to avoid cash crunch. Alternatively, delay expansion to Year 5 when cash flow improves.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};