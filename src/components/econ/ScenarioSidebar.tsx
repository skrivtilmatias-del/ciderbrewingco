import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scenario, DEFAULT_SCENARIOS } from "@/econ/types";
import { Target, Zap } from "lucide-react";

interface ScenarioSidebarProps {
  activeScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

export const ScenarioSidebar = ({ activeScenario, onScenarioChange }: ScenarioSidebarProps) => {
  const updateScenario = (field: keyof Scenario, value: number | string) => {
    onScenarioChange({ ...activeScenario, [field]: value });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Scenario Planning</h3>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-2 mb-6">
        <Label className="text-xs text-muted-foreground">Quick Scenarios</Label>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_SCENARIOS.map((scenario) => (
            <Button
              key={scenario.name}
              variant={activeScenario.name === scenario.name ? "default" : "outline"}
              size="sm"
              onClick={() => onScenarioChange(scenario)}
              className="justify-start text-xs h-auto py-2"
            >
              {scenario.name === 'Base Case' && '📊'}
              {scenario.name === 'High Volume' && '📈'}
              {scenario.name === 'Premium Pricing' && '💎'}
              {scenario.name === 'Cost Pressure' && '⚠️'}
              <span className="ml-1">{scenario.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Active Scenario */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Scenario</span>
          <Badge variant="secondary">{activeScenario.name}</Badge>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm">Volume Multiplier: {activeScenario.volumeMultiplier.toFixed(1)}x</Label>
          <Slider
            value={[activeScenario.volumeMultiplier]}
            onValueChange={([value]) => updateScenario('volumeMultiplier', value)}
            min={0.1}
            max={10}
            step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0.1x</span>
            <span>10x</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">Price Multiplier: {activeScenario.priceMultiplier.toFixed(2)}x</Label>
          <Slider
            value={[activeScenario.priceMultiplier]}
            onValueChange={([value]) => updateScenario('priceMultiplier', value)}
            min={0.5}
            max={2}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>-50%</span>
            <span>+100%</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">Apple Cost: {activeScenario.appleCostMultiplier.toFixed(2)}x</Label>
          <Slider
            value={[activeScenario.appleCostMultiplier]}
            onValueChange={([value]) => updateScenario('appleCostMultiplier', value)}
            min={0.5}
            max={2}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>-50%</span>
            <span>+100%</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">Labor Cost: {activeScenario.laborMultiplier.toFixed(2)}x</Label>
          <Slider
            value={[activeScenario.laborMultiplier]}
            onValueChange={([value]) => updateScenario('laborMultiplier', value)}
            min={0.5}
            max={2}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>-50%</span>
            <span>+100%</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">Inflation: {activeScenario.inflationYearly.toFixed(1)}%/year</Label>
          <Slider
            value={[activeScenario.inflationYearly]}
            onValueChange={([value]) => updateScenario('inflationYearly', value)}
            min={0}
            max={10}
            step={0.5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900 dark:text-blue-200">
            Adjust sliders to test different scenarios. All calculations update instantly.
          </p>
        </div>
      </div>
    </Card>
  );
};
