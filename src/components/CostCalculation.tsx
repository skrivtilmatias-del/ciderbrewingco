import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Building2, AlertCircle, Download, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Target, ArrowUpRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";
import { useCostCalculationStore } from "@/stores/costCalculationStore";
import { calculateYearlyProjections, calculateCOGSBreakdown, generateRecommendations } from "@/lib/costCalculations";
import { toast } from "sonner";

export const CostCalculation = () => {
  const { inputs, scenario, updateInput, updateScenario, resetToDefaults } = useCostCalculationStore();
  const [activeInputSection, setActiveInputSection] = useState<string | null>("costs");
  const [showScenarioPanel, setShowScenarioPanel] = useState(true);

  // Calculate all projections based on current inputs
  const yearlyData = useMemo(() => calculateYearlyProjections(inputs, scenario), [inputs, scenario]);
  const cogsBreakdown = useMemo(() => calculateCOGSBreakdown(inputs), [inputs]);
  const recommendations = useMemo(() => generateRecommendations(yearlyData, inputs), [yearlyData, inputs]);

  // Calculate summary metrics
  const totalRevenue11Years = yearlyData.reduce((sum, year) => sum + year.revenue, 0);
  const totalProfit11Years = yearlyData.reduce((sum, year) => sum + year.profit, 0);
  const totalCapex = yearlyData.reduce((sum, year) => sum + year.capex, 0);
  const totalInvestment = yearlyData.reduce((sum, year) => sum + year.investment, 0);
  const breakEvenYear = yearlyData.find(y => y.profit > 0)?.year || "Year 11+";
  const negativeYears = yearlyData.filter(y => y.cashBalance < 0);

  // Export functionality
  const handleExportJSON = () => {
    const exportData = {
      inputs,
      scenario,
      projections: yearlyData,
      cogsBreakdown,
      recommendations,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cider-financial-plan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Financial plan exported to JSON");
  };

  const handleExportCSV = () => {
    const headers = ['Year', 'Production', 'Revenue', 'COGS', 'Labour', 'Overheads', 'Profit', 'Margin%'];
    const rows = yearlyData.map(y => [
      y.year,
      y.production,
      y.revenue,
      y.cogs,
      y.labourCost,
      y.overheads,
      y.profit,
      y.profitMargin
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cider-projections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Projections exported to CSV");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Sticky Header with Key Metrics */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Interactive Financial Planner</h1>
              <p className="text-muted-foreground mt-1">
                Real-time cost simulation & strategic planning
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="text-2xl font-bold">{(totalRevenue11Years / 1000000).toFixed(1)}M kr</span>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground">Profit</span>
                <span className={`text-2xl font-bold ${totalProfit11Years > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(totalProfit11Years / 1000000).toFixed(1)}M kr
                </span>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground">Margin</span>
                <span className="text-2xl font-bold">{((totalProfit11Years / totalRevenue11Years) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <Button 
            variant={showScenarioPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowScenarioPanel(!showScenarioPanel)}
          >
            <Target className="h-4 w-4 mr-2" />
            Scenario Planner
          </Button>
        </div>
      </div>

      {/* Cash Flow Warning */}
      {negativeYears.length > 0 && (
        <div className="container max-w-7xl mx-auto px-6">
          <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6 rounded-r-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Cash Flow Alert</h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Negative cash balance in: <strong>{negativeYears.map(y => y.year).join(", ")}</strong>
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                  <strong>Required:</strong> {Math.abs(Math.min(...negativeYears.map(y => y.cashBalance)) / 1000).toFixed(0)}k kr credit facility
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inputs & Scenario Planning */}
          <div className="lg:col-span-1 space-y-6">
            {showScenarioPanel && (
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Scenario Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Price Strategy</Label>
                  <Select 
                    value={scenario.priceStrategy} 
                    onValueChange={(value) => updateScenario('priceStrategy', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative (-10%)</SelectItem>
                      <SelectItem value="moderate">Moderate (Base)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (+15%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Cost Inflation: {scenario.costInflation}% yearly
                  </Label>
                  <Slider
                    value={[scenario.costInflation]}
                    onValueChange={([value]) => updateScenario('costInflation', value)}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Demand Growth: {scenario.demandGrowth}% yearly
                  </Label>
                  <Slider
                    value={[scenario.demandGrowth]}
                    onValueChange={([value]) => updateScenario('demandGrowth', value)}
                    min={0}
                    max={200}
                    step={10}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Yield Efficiency: {inputs.yieldEfficiency}%
                  </Label>
                  <Slider
                    value={[inputs.yieldEfficiency]}
                    onValueChange={([value]) => updateInput('yieldEfficiency', value)}
                    min={85}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {100 - inputs.yieldEfficiency}% production loss
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Editable Cost Inputs */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cost Inputs (DKK)
            </h3>

            <Collapsible open={activeInputSection === "costs"} onOpenChange={(open) => setActiveInputSection(open ? "costs" : null)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
                Ingredient Costs
                {activeInputSection === "costs" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Juice (kr/L)</Label>
                  <Input
                    type="number"
                    value={inputs.juiceCostPerLiter}
                    onChange={(e) => updateInput('juiceCostPerLiter', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Yeast (kr/1000L)</Label>
                  <Input
                    type="number"
                    value={inputs.yeastCostPer1000L}
                    onChange={(e) => updateInput('yeastCostPer1000L', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bottle 75cl (kr)</Label>
                  <Input
                    type="number"
                    value={inputs.bottleCost75cl}
                    onChange={(e) => updateInput('bottleCost75cl', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label (kr)</Label>
                  <Input
                    type="number"
                    value={inputs.labelCost}
                    onChange={(e) => updateInput('labelCost', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Other (kr/bottle)</Label>
                  <Input
                    type="number"
                    value={inputs.otherCostsPerBottle}
                    onChange={(e) => updateInput('otherCostsPerBottle', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={activeInputSection === "pricing"} onOpenChange={(open) => setActiveInputSection(open ? "pricing" : null)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium border-t mt-2 pt-2">
                Pricing & Labor
                {activeInputSection === "pricing" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Bottle Price (kr excl. VAT)</Label>
                  <Input
                    type="number"
                    value={inputs.bottlePriceExclVAT}
                    onChange={(e) => updateInput('bottlePriceExclVAT', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price Growth (%/year)</Label>
                  <Input
                    type="number"
                    value={inputs.priceInflationYearly}
                    onChange={(e) => updateInput('priceInflationYearly', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Labor Cost (kr/month)</Label>
                  <Input
                    type="number"
                    value={inputs.laborCostMonthly}
                    onChange={(e) => updateInput('laborCostMonthly', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Overhead (kr/month)</Label>
                  <Input
                    type="number"
                    value={inputs.overheadCostMonthly}
                    onChange={(e) => updateInput('overheadCostMonthly', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* AI-Generated Recommendations */}
          <Card className="p-6 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Strategic Insights
            </h3>
            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-background/80 backdrop-blur-sm rounded-lg border border-blue-200 dark:border-blue-800 text-sm leading-relaxed">
                    {rec}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Adjust inputs to generate insights</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Charts & Projections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue & Profit Chart */}
          <Card className="p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Revenue vs Profit Projection</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" angle={-45} textAnchor="end" height={80} />
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

          {/* COGS Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6">COGS per Bottle by Scale</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cogsBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="volume" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => `${value.toFixed(2)} kr`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} name="Total COGS" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Profit Margin Evolution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" angle={-45} textAnchor="end" height={80} />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="profitMargin" fill="hsl(var(--chart-3))" name="Margin %" />
                  <Line type="monotone" dataKey="profitMargin" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* COGS Component Breakdown */}
          <Card className="p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">COGS Component Breakdown</h3>
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
          </Card>

          {/* Detailed Projections Table */}
          <Card className="p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Detailed Financial Projections</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-2 font-semibold">Year</th>
                    <th className="p-2 font-semibold text-right">Production</th>
                    <th className="p-2 font-semibold text-right">Revenue</th>
                    <th className="p-2 font-semibold text-right">COGS</th>
                    <th className="p-2 font-semibold text-right">Profit</th>
                    <th className="p-2 font-semibold text-right">Margin</th>
                    <th className="p-2 font-semibold text-right">Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((year, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">{year.year}</td>
                      <td className="p-2 text-right">{year.production.toLocaleString()}</td>
                      <td className="p-2 text-right">{(year.revenue / 1000).toFixed(0)}k</td>
                      <td className="p-2 text-right">{(year.cogs / 1000).toFixed(0)}k</td>
                      <td className={`p-2 text-right font-semibold ${year.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {(year.profit / 1000).toFixed(0)}k
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant={year.profitMargin >= 0 ? "default" : "destructive"}>
                          {year.profitMargin}%
                        </Badge>
                      </td>
                      <td className={`p-2 text-right ${year.cashBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {(year.cashBalance / 1000).toFixed(0)}k
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
};