import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/costSimulation';
import type { SimulationResult } from '@/types/costManagement.types';

interface SimulationChartsProps {
  simulation: SimulationResult;
}

const COLORS = {
  primary: '#3b82f6',      // Blue
  secondary: '#10b981',    // Green
  accent: '#f59e0b',       // Orange
  danger: '#ef4444',       // Red
  purple: '#8b5cf6',       // Purple
  teal: '#14b8a6',         // Teal
  pink: '#ec4899',         // Pink
  indigo: '#6366f1',       // Indigo
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.purple,
  COLORS.teal,
  COLORS.pink,
  COLORS.indigo,
  COLORS.danger,
];

export function SimulationCharts({ simulation }: SimulationChartsProps) {
  const projections = simulation.yearly_projections;
  
  // Prepare revenue breakdown data for first year
  const revenueBreakdown = projections[0] ? [
    { name: 'Direct', value: projections[0].revenue_direct },
    { name: 'Wholesale', value: projections[0].revenue_wholesale },
    { name: 'Retail', value: projections[0].revenue_retail },
  ] : [];

  // Prepare COGS breakdown data for first year
  const cogsBreakdown = projections[0] ? [
    { name: 'Ingredients', value: projections[0].cogs_ingredients },
    { name: 'Packaging', value: projections[0].cogs_packaging },
    { name: 'Labor', value: projections[0].cogs_labor },
    { name: 'Overhead', value: projections[0].overhead },
  ] : [];

  // Prepare margin trends
  const marginTrends = projections.map(p => ({
    year: p.year,
    grossMargin: p.gross_margin_percent,
    ebitdaMargin: p.ebitda_margin_percent,
    netMargin: p.net_margin_percent,
  }));

  // Prepare cash flow data
  const cashFlowData = projections.map(p => ({
    year: p.year,
    cash: p.cash_balance,
    cumulative: p.cumulative_cash_flow,
  }));

  // Prepare P&L waterfall for year 1
  const plWaterfall = projections[0] ? [
    { name: 'Revenue', value: projections[0].total_revenue },
    { name: 'COGS', value: -projections[0].total_cogs },
    { name: 'Gross Profit', value: projections[0].gross_profit },
    { name: 'Overhead', value: -projections[0].overhead },
    { name: 'EBITDA', value: projections[0].ebitda },
    { name: 'Depreciation', value: -projections[0].depreciation },
    { name: 'EBIT', value: projections[0].ebit },
    { name: 'Interest', value: -projections[0].interest_expense },
    { name: 'Tax', value: -projections[0].tax },
    { name: 'Net Income', value: projections[0].net_income },
  ] : [];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="profitability">Profitability</TabsTrigger>
        <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & EBITDA Projection</CardTitle>
            <CardDescription>11-year financial trajectory</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total_revenue"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.7}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="ebitda"
                  stackId="2"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.7}
                  name="EBITDA"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Channel (Year 1)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill={COLORS.primary}
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>COGS Breakdown (Year 1)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cogsBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={80}
                    fill={COLORS.accent}
                    dataKey="value"
                  >
                    {cogsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Profitability Tab */}
      <TabsContent value="profitability" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Margin Evolution</CardTitle>
            <CardDescription>Gross, EBITDA, and Net margins over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={marginTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip formatter={(value: number) => formatPercent(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Line type="monotone" dataKey="grossMargin" stroke={COLORS.primary} strokeWidth={3} name="Gross Margin %" />
                <Line type="monotone" dataKey="ebitdaMargin" stroke={COLORS.secondary} strokeWidth={3} name="EBITDA Margin %" />
                <Line type="monotone" dataKey="netMargin" stroke={COLORS.accent} strokeWidth={3} name="Net Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss (Year 1)</CardTitle>
            <CardDescription>Income statement waterfall</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={plWaterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {plWaterfall.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? COLORS.secondary : COLORS.danger} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Breakdown Tab */}
      <TabsContent value="breakdown" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Bar dataKey="revenue_direct" stackId="a" fill={COLORS.primary} name="Direct" />
                <Bar dataKey="revenue_wholesale" stackId="a" fill={COLORS.secondary} name="Wholesale" />
                <Bar dataKey="revenue_retail" stackId="a" fill={COLORS.accent} name="Retail" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Structure Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Area type="monotone" dataKey="cogs_ingredients" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.8} name="Ingredients" />
                <Area type="monotone" dataKey="cogs_packaging" stackId="1" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.8} name="Packaging" />
                <Area type="monotone" dataKey="cogs_labor" stackId="1" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.8} name="Labor" />
                <Area type="monotone" dataKey="overhead" stackId="1" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.8} name="Overhead" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cash Flow Tab */}
      <TabsContent value="cashflow" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Cash Flow</CardTitle>
            <CardDescription>Track to breakeven and beyond</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Bar dataKey="cash" fill={COLORS.secondary} name="Annual Cash" />
                <Line type="monotone" dataKey="cumulative" stroke={COLORS.primary} strokeWidth={4} name="Cumulative" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Metrics Tab */}
      <TabsContent value="metrics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Line type="monotone" dataKey="cost_per_liter" stroke={COLORS.primary} strokeWidth={3} name="Cost/Liter" />
                <Line type="monotone" dataKey="cost_per_bottle_75cl" stroke={COLORS.accent} strokeWidth={3} name="Cost/75cl" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Volume Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                <Legend />
                <Bar dataKey="production_liters" fill={COLORS.teal} name="Liters Produced" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
