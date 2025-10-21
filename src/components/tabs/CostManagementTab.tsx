import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, AlertTriangle, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import { useCostTemplates, useCreateCostTemplate, useCostScenarios, useCreateCostScenario, useSaveSimulationResult, useCostAlerts } from '@/hooks/useCostManagement';
import { runSimulation, formatCurrency, formatPercent, generateRecommendations } from '@/lib/costSimulation';
import { CostInputForm } from '@/components/cost/CostInputForm';
import { ScenarioManager } from '@/components/cost/ScenarioManager';
import { SimulationCharts } from '@/components/cost/SimulationCharts';
import { ExportTools } from '@/components/cost/ExportTools';
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
  const [activeView, setActiveView] = useState<'setup' | 'results'>('setup');
  
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

  const handleRunSimulation = () => {
    if (simulation) {
      setActiveView('results');
    }
  };

  const handleSaveTemplate = () => {
    createTemplate.mutate(template);
  };

  const handleSaveScenario = () => {
    if (!scenario.template_id) {
      // Need to save template first or select existing
      handleSaveTemplate();
    }
    createScenario.mutate(scenario);
  };

  const handleSaveSimulation = () => {
    if (simulation) {
      saveSimulation.mutate(simulation);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.length} cost alert(s) require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulation ? formatCurrency(simulation.total_revenue) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">11-year projection</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              EBITDA Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulation ? formatPercent(simulation.avg_ebitda_margin_percent) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Breakeven
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulation?.breakeven_year !== undefined ? `Year ${simulation.breakeven_year + 1}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Time to profitability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulation?.roi_percent ? formatPercent(simulation.roi_percent) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs & Scenario */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set up costs and scenario parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base Production Volume (L)</Label>
                <Input
                  type="number"
                  value={baseVolume}
                  onChange={(e) => setBaseVolume(Number(e.target.value))}
                  placeholder="e.g., 1000"
                />
                <p className="text-xs text-muted-foreground">Starting volume for year 1</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={template.name || ''}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="e.g., Standard Cost Model"
                />
              </div>

              <Button onClick={handleRunSimulation} className="w-full" disabled={!template.juice_per_liter}>
                <Play className="w-4 h-4 mr-2" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>

          {/* Quick Summary */}
          {simulation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-medium">{formatCurrency(simulation.total_revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total EBITDA:</span>
                  <span className="font-medium">{formatCurrency(simulation.total_ebitda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Income:</span>
                  <span className="font-medium">{formatCurrency(simulation.total_net_income)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Margin:</span>
                  <span className="font-medium">{formatPercent(simulation.avg_gross_margin_percent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EBITDA Margin:</span>
                  <span className="font-medium">{formatPercent(simulation.avg_ebitda_margin_percent)}</span>
                </div>
                {simulation.payback_period_years && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payback Period:</span>
                    <span className="font-medium">{simulation.payback_period_years.toFixed(1)} years</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cost Management & Simulation</CardTitle>
                  <CardDescription>Configure all cost parameters and run profitability scenarios</CardDescription>
                </div>
                <ExportTools
                  simulation={simulation}
                  onSave={handleSaveSimulation}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="costs">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="costs">Cost Inputs</TabsTrigger>
                  <TabsTrigger value="scenario">Scenario</TabsTrigger>
                  <TabsTrigger value="charts">Visualizations</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>

                <TabsContent value="costs" className="space-y-4">
                  <CostInputForm template={template} onChange={setTemplate} />
                  <Button onClick={handleSaveTemplate} variant="outline" className="w-full">
                    Save Cost Template
                  </Button>
                </TabsContent>

                <TabsContent value="scenario" className="space-y-4">
                  <ScenarioManager
                    scenario={scenario}
                    onChange={setScenario}
                    savedScenarios={scenarios}
                    onSave={handleSaveScenario}
                  />
                </TabsContent>

                <TabsContent value="charts">
                  {simulation ? (
                    <SimulationCharts simulation={simulation} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Run a simulation to see visualizations
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="table">
                  {simulation ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Year</th>
                            <th className="text-right p-2">Volume (L)</th>
                            <th className="text-right p-2">Revenue</th>
                            <th className="text-right p-2">COGS</th>
                            <th className="text-right p-2">EBITDA</th>
                            <th className="text-right p-2">EBITDA %</th>
                            <th className="text-right p-2">Net Income</th>
                            <th className="text-right p-2">Cash Flow</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulation.yearly_projections.map((p) => (
                            <tr key={p.year} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{p.year}</td>
                              <td className="text-right p-2">{p.production_liters.toFixed(0)}</td>
                              <td className="text-right p-2">{formatCurrency(p.total_revenue, 0)}</td>
                              <td className="text-right p-2">{formatCurrency(p.total_cogs, 0)}</td>
                              <td className="text-right p-2">{formatCurrency(p.ebitda, 0)}</td>
                              <td className="text-right p-2">
                                <Badge variant={p.ebitda_margin_percent > 20 ? 'default' : 'secondary'}>
                                  {formatPercent(p.ebitda_margin_percent)}
                                </Badge>
                              </td>
                              <td className="text-right p-2">{formatCurrency(p.net_income, 0)}</td>
                              <td className="text-right p-2">
                                <span className={p.cumulative_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(p.cumulative_cash_flow, 0)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Run a simulation to see detailed data
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Insights & Recommendations</CardTitle>
                <CardDescription>Strategic guidance based on your simulation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec, i) => (
                  <Alert key={i}>
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
