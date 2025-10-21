import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Save, Copy, Download, TrendingUp, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { useCostTemplates, useCreateCostTemplate, useCostScenarios, useCreateCostScenario, useSaveSimulationResult, useCostAlerts } from '@/hooks/useCostManagement';
import { runSimulation, formatCurrency, formatPercent, generateRecommendations } from '@/lib/costSimulation';
import type { CostTemplate, CostScenario } from '@/types/costManagement.types';

const DEFAULT_TEMPLATE: Partial<CostTemplate> = {
  name: 'Standard Template',
  template_type: 'standard',
  juice_per_liter: 8,
  yeast_per_1000l: 741,
  sugar_per_kg: 0.1,
  other_per_bottle: 10.96,
  bottle_75cl: 3,
  bottle_150cl: 5,
  label: 4,
  cap: 0.1,
  box_cost: 2,
  hourly_rate: 350,
  hours_per_batch: 8,
  monthly_fixed_labor: 0,
  monthly_fixed_overhead: 10000,
  overhead_per_liter: 0.5,
  overhead_percent_of_cogs: 15,
  wastage_percent: 5,
  yield_efficiency: 95,
  bottle_75cl_price: 110,
  bottle_150cl_price: 200,
  price_inflation_yearly: 3,
  depreciation_yearly: 50000,
  interest_expense_yearly: 0,
  tax_rate: 22,
};

const DEFAULT_SCENARIO: Partial<CostScenario> = {
  name: 'Base Case',
  scenario_type: 'realistic',
  volume_multiplier: 1,
  price_multiplier: 1,
  cost_multiplier: 1,
  labor_multiplier: 1,
  demand_growth_yearly: 50,
  direct_sales_percent: 40,
  wholesale_percent: 40,
  retail_percent: 20,
  wholesale_discount_percent: 15,
  retail_discount_percent: 10,
  holding_cost_per_bottle_monthly: 0.5,
  seasonal_demand_factors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export function CostManagementTab() {
  const [template, setTemplate] = useState<Partial<CostTemplate>>(DEFAULT_TEMPLATE);
  const [scenario, setScenario] = useState<Partial<CostScenario>>(DEFAULT_SCENARIO);
  const [baseVolume, setBaseVolume] = useState(1000);
  
  const { data: templates } = useCostTemplates();
  const { data: scenarios } = useCostScenarios();
  const { data: alerts } = useCostAlerts();
  const createTemplate = useCreateCostTemplate();
  const createScenario = useCreateCostScenario();
  const saveSimulation = useSaveSimulationResult();
  
  const simulation = useMemo(() => {
    if (!template.juice_per_liter) return null;
    return runSimulation(template as CostTemplate, scenario as CostScenario, 11, baseVolume);
  }, [template, scenario, baseVolume]);
  
  const recommendations = useMemo(() => {
    return simulation ? generateRecommendations(simulation) : [];
  }, [simulation]);
  
  return (
    <div className="space-y-6">
      {alerts && alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.length} cost alert(s) require attention
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulation ? formatCurrency(simulation.total_revenue) : '-'}</div>
            <p className="text-xs text-muted-foreground">11-year projection</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">EBITDA Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulation ? formatPercent(simulation.avg_ebitda_margin_percent) : '-'}</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Breakeven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulation?.breakeven_year !== undefined ? `Year ${simulation.breakeven_year + 1}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Time to profitability</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost Management & Simulation</CardTitle>
              <CardDescription>Configure costs, run scenarios, and analyze profitability</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => createTemplate.mutate(template)}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
              <Button size="sm" onClick={() => simulation && saveSimulation.mutate(simulation)}>
                <Download className="w-4 h-4 mr-2" />
                Save Results
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inputs" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="scenario">Scenario</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inputs" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Production Volume (L)</Label>
                  <Input type="number" value={baseVolume} onChange={(e) => setBaseVolume(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Juice Cost per Liter (DKK)</Label>
                  <Input type="number" value={template.juice_per_liter} onChange={(e) => setTemplate({...template, juice_per_liter: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Bottle 75cl Price (DKK)</Label>
                  <Input type="number" value={template.bottle_75cl_price} onChange={(e) => setTemplate({...template, bottle_75cl_price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Overhead (DKK)</Label>
                  <Input type="number" value={template.monthly_fixed_overhead} onChange={(e) => setTemplate({...template, monthly_fixed_overhead: Number(e.target.value)})} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="scenario" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Demand Growth (% yearly)</Label>
                  <Slider value={[scenario.demand_growth_yearly || 50]} onValueChange={([v]) => setScenario({...scenario, demand_growth_yearly: v})} max={200} />
                  <p className="text-sm text-muted-foreground mt-1">{scenario.demand_growth_yearly}%</p>
                </div>
                <div>
                  <Label>Price Multiplier</Label>
                  <Slider value={[scenario.price_multiplier! * 100]} onValueChange={([v]) => setScenario({...scenario, price_multiplier: v / 100})} max={200} />
                  <p className="text-sm text-muted-foreground mt-1">{scenario.price_multiplier}x</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              {simulation && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Year</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">COGS</th>
                        <th className="text-right p-2">EBITDA</th>
                        <th className="text-right p-2">Net Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulation.yearly_projections.slice(0, 5).map((p) => (
                        <tr key={p.year} className="border-b">
                          <td className="p-2">{p.year}</td>
                          <td className="text-right p-2">{formatCurrency(p.total_revenue)}</td>
                          <td className="text-right p-2">{formatCurrency(p.total_cogs)}</td>
                          <td className="text-right p-2">{formatCurrency(p.ebitda)}</td>
                          <td className="text-right p-2">{formatCurrency(p.net_income)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="charts">
              {simulation && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={simulation.yearly_projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="total_revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Revenue" />
                    <Area type="monotone" dataKey="ebitda" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" name="EBITDA" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              {recommendations.map((rec, i) => (
                <Alert key={i}>
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
