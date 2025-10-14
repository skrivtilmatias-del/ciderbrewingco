import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOMTable } from "@/components/econ/BOMTable";
import { BreakdownCard } from "@/components/econ/BreakdownCard";
import { ScenarioSidebar } from "@/components/econ/ScenarioSidebar";
import { EconCharts } from "@/components/econ/EconCharts";
import { VarianceTable } from "@/components/econ/VarianceTable";
import { EconInput, DEFAULT_ECON_INPUT, Scenario, DEFAULT_SCENARIOS, EconVariance } from "@/econ/types";
import { calcEconomics, applyScenario } from "@/econ/calc";
import { exportToExcel, importFromExcel } from "@/econ/excel";
import { Download, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";

export default function PlanningTool() {
  const { userRole, userProfile } = useAuth();
  const [baseInput, setBaseInput] = useState<EconInput>(DEFAULT_ECON_INPUT);
  const [activeScenario, setActiveScenario] = useState<Scenario>(DEFAULT_SCENARIOS[0]);
  const [variances] = useState<EconVariance[]>([]); // TODO: Load from actual batches

  // Apply scenario to base input with <50ms performance
  const scenarioInput = useMemo(
    () => applyScenario(baseInput, activeScenario),
    [baseInput, activeScenario]
  );

  // Calculate results instantly (<50ms)
  const result = useMemo(() => calcEconomics(scenarioInput), [scenarioInput]);

  // Handle input changes with immediate recalculation
  const handleInputChange = useCallback((newInput: EconInput) => {
    setBaseInput(newInput);
  }, []);

  const handleScenarioChange = useCallback((scenario: Scenario) => {
    setActiveScenario(scenario);
  }, []);

  const handleExport = () => {
    exportToExcel(scenarioInput, result);
    toast.success("Exported to Excel successfully");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importFromExcel(file);
      setBaseInput(imported);
      toast.success("Imported from Excel successfully");
    } catch (error) {
      toast.error("Failed to import: " + (error as Error).message);
    }
  };

  const handleReset = () => {
    setBaseInput(DEFAULT_ECON_INPUT);
    setActiveScenario(DEFAULT_SCENARIOS[0]);
    toast.info("Reset to default values");
  };

  // Update production volume
  const updateVolume = (volume: number) => {
    setBaseInput({
      ...baseInput,
      production: { ...baseInput.production, volumeLiters: volume },
    });
  };

  // Update pricing
  const updatePrice75 = (price: number) => {
    setBaseInput({
      ...baseInput,
      pricing: { ...baseInput.pricing, bottle75clExclVAT: price },
    });
  };

  const updatePrice150 = (price: number) => {
    setBaseInput({
      ...baseInput,
      pricing: { ...baseInput.pricing, bottle150clExclVAT: price },
    });
  };

  return (
    <AppLayout userRole={userRole} userProfile={userProfile}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Economic Planning Tool</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Instant calculations • Scenario testing • Excel integration
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Scenario */}
          <div className="lg:col-span-1">
            <ScenarioSidebar
              activeScenario={activeScenario}
              onScenarioChange={handleScenarioChange}
            />

            {/* Quick Production Config */}
            <Card className="p-4 mt-6">
              <h4 className="font-semibold mb-3 text-sm">Production</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Volume (L)</Label>
                  <Input
                    type="number"
                    value={baseInput.production.volumeLiters}
                    onChange={(e) => updateVolume(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price 75cl (kr)</Label>
                  <Input
                    type="number"
                    value={baseInput.pricing.bottle75clExclVAT}
                    onChange={(e) => updatePrice75(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price 150cl (kr)</Label>
                  <Input
                    type="number"
                    value={baseInput.pricing.bottle150clExclVAT}
                    onChange={(e) => updatePrice150(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold mt-1">{(result.totalRevenue / 1000).toFixed(0)}k kr</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total COGS</div>
                <div className="text-2xl font-bold mt-1">{(result.totalCOGS / 1000).toFixed(0)}k kr</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Profit</div>
                <div className={`text-2xl font-bold mt-1 ${result.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(result.totalProfit / 1000).toFixed(0)}k kr
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Margin %</div>
                <div className="text-2xl font-bold mt-1">
                  {result.grossMarginPct75cl.toFixed(1)}%
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="breakdown" className="space-y-4">
              <TabsList>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
                <TabsTrigger value="charts">Analytics</TabsTrigger>
                <TabsTrigger value="variance">Plan vs Actual</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="space-y-6">
                <BreakdownCard result={result} />
              </TabsContent>

              <TabsContent value="bom" className="space-y-6">
                <BOMTable input={baseInput} onChange={handleInputChange} />
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <EconCharts input={scenarioInput} result={result} />
              </TabsContent>

              <TabsContent value="variance" className="space-y-6">
                <VarianceTable variances={variances} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
