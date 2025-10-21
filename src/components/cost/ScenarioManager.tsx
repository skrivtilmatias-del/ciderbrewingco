import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, Trash2, BarChart3 } from 'lucide-react';
import type { CostScenario } from '@/types/costManagement.types';

interface ScenarioManagerProps {
  scenario: Partial<CostScenario>;
  onChange: (scenario: Partial<CostScenario>) => void;
  savedScenarios?: any[];
  onSave?: () => void;
  onClone?: () => void;
}

export function ScenarioManager({ scenario, onChange, savedScenarios, onSave, onClone }: ScenarioManagerProps) {
  const [showCapacity, setShowCapacity] = useState(false);
  
  const updateField = (field: keyof CostScenario, value: any) => {
    onChange({ ...scenario, [field]: value });
  };

  const scenarioPresets = [
    { type: 'best', label: 'Best Case', color: 'bg-green-500', volume: 1.5, price: 1.2, cost: 0.9 },
    { type: 'realistic', label: 'Base Case', color: 'bg-blue-500', volume: 1, price: 1, cost: 1 },
    { type: 'worst', label: 'Worst Case', color: 'bg-red-500', volume: 0.7, price: 0.9, cost: 1.2 },
  ];

  const applyPreset = (preset: any) => {
    onChange({
      ...scenario,
      scenario_type: preset.type,
      volume_multiplier: preset.volume,
      price_multiplier: preset.price,
      cost_multiplier: preset.cost,
    });
  };

  return (
    <div className="space-y-6">
      {/* Scenario Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenario Type</CardTitle>
          <CardDescription>Choose a preset or customize your own</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {scenarioPresets.map((preset) => (
              <Button
                key={preset.type}
                variant={scenario.scenario_type === preset.type ? 'default' : 'outline'}
                onClick={() => applyPreset(preset)}
                className="flex-1"
              >
                <div className={`w-2 h-2 rounded-full ${preset.color} mr-2`} />
                {preset.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label>Scenario Name</Label>
            <Input
              value={scenario.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., High Growth Strategy"
            />
          </div>
        </CardContent>
      </Card>

      {/* Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenario Multipliers</CardTitle>
          <CardDescription>Adjust key drivers for what-if analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Volume Multiplier</Label>
              <span className="text-sm text-muted-foreground">{scenario.volume_multiplier?.toFixed(2)}x</span>
            </div>
            <Slider
              value={[scenario.volume_multiplier! * 100]}
              onValueChange={([v]) => updateField('volume_multiplier', v / 100)}
              min={10}
              max={500}
              step={10}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Multiplier</Label>
              <span className="text-sm text-muted-foreground">{scenario.price_multiplier?.toFixed(2)}x</span>
            </div>
            <Slider
              value={[scenario.price_multiplier! * 100]}
              onValueChange={([v]) => updateField('price_multiplier', v / 100)}
              min={50}
              max={200}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Cost Multiplier</Label>
              <span className="text-sm text-muted-foreground">{scenario.cost_multiplier?.toFixed(2)}x</span>
            </div>
            <Slider
              value={[scenario.cost_multiplier! * 100]}
              onValueChange={([v]) => updateField('cost_multiplier', v / 100)}
              min={50}
              max={200}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Labor Multiplier</Label>
              <span className="text-sm text-muted-foreground">{scenario.labor_multiplier?.toFixed(2)}x</span>
            </div>
            <Slider
              value={[scenario.labor_multiplier! * 100]}
              onValueChange={([v]) => updateField('labor_multiplier', v / 100)}
              min={50}
              max={200}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Demand Growth (% yearly)</Label>
              <span className="text-sm text-muted-foreground">{scenario.demand_growth_yearly}%</span>
            </div>
            <Slider
              value={[scenario.demand_growth_yearly!]}
              onValueChange={([v]) => updateField('demand_growth_yearly', v)}
              min={-50}
              max={200}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Channel Mix</CardTitle>
          <CardDescription>Distribution and pricing by channel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Direct Sales %</Label>
              <Input
                type="number"
                value={scenario.direct_sales_percent || 0}
                onChange={(e) => updateField('direct_sales_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Wholesale %</Label>
              <Input
                type="number"
                value={scenario.wholesale_percent || 0}
                onChange={(e) => updateField('wholesale_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Retail %</Label>
              <Input
                type="number"
                value={scenario.retail_percent || 0}
                onChange={(e) => updateField('retail_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wholesale Discount %</Label>
              <Input
                type="number"
                value={scenario.wholesale_discount_percent || 0}
                onChange={(e) => updateField('wholesale_discount_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Retail Discount %</Label>
              <Input
                type="number"
                value={scenario.retail_discount_percent || 0}
                onChange={(e) => updateField('retail_discount_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Constraints (Optional) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Capacity Constraints</CardTitle>
              <CardDescription>Optional production and storage limits</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCapacity(!showCapacity)}>
              {showCapacity ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showCapacity && (
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Production (L/year)</Label>
              <Input
                type="number"
                value={scenario.max_production_liters_yearly || ''}
                onChange={(e) => updateField('max_production_liters_yearly', parseFloat(e.target.value) || undefined)}
                placeholder="No limit"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Storage (bottles)</Label>
              <Input
                type="number"
                value={scenario.max_storage_bottles || ''}
                onChange={(e) => updateField('max_storage_bottles', parseFloat(e.target.value) || undefined)}
                placeholder="No limit"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Holding Cost per Bottle/Month (DKK)</Label>
              <Input
                type="number"
                step="0.01"
                value={scenario.holding_cost_per_bottle_monthly || 0}
                onChange={(e) => updateField('holding_cost_per_bottle_monthly', parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {onSave && (
          <Button onClick={onSave} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Save Scenario
          </Button>
        )}
        {onClone && (
          <Button variant="outline" onClick={onClone}>
            <Copy className="w-4 h-4 mr-2" />
            Clone
          </Button>
        )}
      </div>

      {/* Saved Scenarios List */}
      {savedScenarios && savedScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedScenarios.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent/50">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.scenario_type} • {s.created_at}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">Load</Button>
                    <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
