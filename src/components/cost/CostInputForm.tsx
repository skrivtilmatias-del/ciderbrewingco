import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CostTemplate } from '@/types/costManagement.types';

interface CostInputFormProps {
  template: Partial<CostTemplate>;
  onChange: (template: Partial<CostTemplate>) => void;
}

export function CostInputForm({ template, onChange }: CostInputFormProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ingredients: true,
    packaging: true,
    labor: false,
    overhead: false,
    production: false,
    pricing: false,
    ebitda: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field: keyof CostTemplate, value: number) => {
    onChange({ ...template, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Ingredients Section */}
      <Collapsible open={openSections.ingredients} onOpenChange={() => toggleSection('ingredients')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ingredient Costs</CardTitle>
                {openSections.ingredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Juice Cost per Liter (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.juice_per_liter || 0}
                  onChange={(e) => updateField('juice_per_liter', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Yeast Cost per 1000L (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.yeast_per_1000l || 0}
                  onChange={(e) => updateField('yeast_per_1000l', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sugar Cost per Kg (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.sugar_per_kg || 0}
                  onChange={(e) => updateField('sugar_per_kg', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Other Costs per Bottle (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.other_per_bottle || 0}
                  onChange={(e) => updateField('other_per_bottle', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Additives, enzymes, etc.</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Packaging Section */}
      <Collapsible open={openSections.packaging} onOpenChange={() => toggleSection('packaging')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Packaging Costs</CardTitle>
                {openSections.packaging ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>75cl Bottle (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.bottle_75cl || 0}
                  onChange={(e) => updateField('bottle_75cl', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>150cl Bottle (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.bottle_150cl || 0}
                  onChange={(e) => updateField('bottle_150cl', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Label (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.label || 0}
                  onChange={(e) => updateField('label', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cap/Cork (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.cap || 0}
                  onChange={(e) => updateField('cap', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Box/Carton (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.box_cost || 0}
                  onChange={(e) => updateField('box_cost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Labor Section */}
      <Collapsible open={openSections.labor} onOpenChange={() => toggleSection('labor')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Labor Costs</CardTitle>
                {openSections.labor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hourly Rate (DKK)</Label>
                <Input
                  type="number"
                  step="1"
                  value={template.hourly_rate || 0}
                  onChange={(e) => updateField('hourly_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours per Batch</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={template.hours_per_batch || 0}
                  onChange={(e) => updateField('hours_per_batch', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Monthly Fixed Labor (DKK)</Label>
                <Input
                  type="number"
                  step="1000"
                  value={template.monthly_fixed_labor || 0}
                  onChange={(e) => updateField('monthly_fixed_labor', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Salaries, benefits for permanent staff</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Overhead Section */}
      <Collapsible open={openSections.overhead} onOpenChange={() => toggleSection('overhead')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Overhead Costs</CardTitle>
                {openSections.overhead ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Monthly Fixed Overhead (DKK)</Label>
                <Input
                  type="number"
                  step="1000"
                  value={template.monthly_fixed_overhead || 0}
                  onChange={(e) => updateField('monthly_fixed_overhead', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Rent, utilities, insurance, etc.</p>
              </div>
              <div className="space-y-2">
                <Label>Overhead per Liter (DKK)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={template.overhead_per_liter || 0}
                  onChange={(e) => updateField('overhead_per_liter', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Overhead as % of COGS</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={template.overhead_percent_of_cogs || 0}
                  onChange={(e) => updateField('overhead_percent_of_cogs', parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Production Section */}
      <Collapsible open={openSections.production} onOpenChange={() => toggleSection('production')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Production Parameters</CardTitle>
                {openSections.production ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wastage % (Spillage, Sampling)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={template.wastage_percent || 0}
                  onChange={(e) => updateField('wastage_percent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Yield Efficiency %</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={template.yield_efficiency || 0}
                  onChange={(e) => updateField('yield_efficiency', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Usable volume after fermentation</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Pricing Section */}
      <Collapsible open={openSections.pricing} onOpenChange={() => toggleSection('pricing')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pricing Strategy</CardTitle>
                {openSections.pricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>75cl Price (DKK, excl. VAT)</Label>
                <Input
                  type="number"
                  step="1"
                  value={template.bottle_75cl_price || 0}
                  onChange={(e) => updateField('bottle_75cl_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>150cl Price (DKK, excl. VAT)</Label>
                <Input
                  type="number"
                  step="1"
                  value={template.bottle_150cl_price || 0}
                  onChange={(e) => updateField('bottle_150cl_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Price Inflation (% yearly)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={template.price_inflation_yearly || 0}
                  onChange={(e) => updateField('price_inflation_yearly', parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* EBITDA Components */}
      <Collapsible open={openSections.ebitda} onOpenChange={() => toggleSection('ebitda')}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">EBITDA & Financial Components</CardTitle>
                {openSections.ebitda ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Depreciation (DKK/year)</Label>
                <Input
                  type="number"
                  step="1000"
                  value={template.depreciation_yearly || 0}
                  onChange={(e) => updateField('depreciation_yearly', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Equipment, facilities depreciation</p>
              </div>
              <div className="space-y-2">
                <Label>Interest Expense (DKK/year)</Label>
                <Input
                  type="number"
                  step="1000"
                  value={template.interest_expense_yearly || 0}
                  onChange={(e) => updateField('interest_expense_yearly', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Loan interest payments</p>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={template.tax_rate || 0}
                  onChange={(e) => updateField('tax_rate', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Corporate tax rate</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
