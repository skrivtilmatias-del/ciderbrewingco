import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { EconInput } from "@/econ/types";

interface BOMTableProps {
  input: EconInput;
  onChange: (input: EconInput) => void;
}

export const BOMTable = ({ input, onChange }: BOMTableProps) => {
  const updateIngredient = (field: keyof EconInput['ingredients'], value: number) => {
    onChange({
      ...input,
      ingredients: { ...input.ingredients, [field]: value },
    });
  };

  const updatePackaging = (field: keyof EconInput['packaging'], value: number) => {
    onChange({
      ...input,
      packaging: { ...input.packaging, [field]: value },
    });
  };

  const updateLabor = (field: keyof EconInput['labor'], value: number) => {
    onChange({
      ...input,
      labor: { ...input.labor, [field]: value },
    });
  };

  const updateOverhead = (field: keyof EconInput['overhead'], value: number) => {
    onChange({
      ...input,
      overhead: { ...input.overhead, [field]: value },
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Bill of Materials</h3>
      
      <div className="space-y-6">
        {/* Ingredients */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Ingredients</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Juice (kr/L)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.ingredients.juicePerLiter}
                onChange={(e) => updateIngredient('juicePerLiter', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Yeast (kr/1000L)</Label>
              <Input
                type="number"
                step="1"
                value={input.ingredients.yeastPer1000L}
                onChange={(e) => updateIngredient('yeastPer1000L', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Sugar (kr/kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={input.ingredients.sugarPerKg}
                onChange={(e) => updateIngredient('sugarPerKg', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Other (kr/bottle)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.ingredients.otherPerBottle}
                onChange={(e) => updateIngredient('otherPerBottle', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Packaging */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Packaging</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bottle 75cl (kr)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.packaging.bottle75cl}
                onChange={(e) => updatePackaging('bottle75cl', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Bottle 150cl (kr)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.packaging.bottle150cl}
                onChange={(e) => updatePackaging('bottle150cl', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Label (kr)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.packaging.label}
                onChange={(e) => updatePackaging('label', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Cap (kr)</Label>
              <Input
                type="number"
                step="0.01"
                value={input.packaging.cap}
                onChange={(e) => updatePackaging('cap', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Labor */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Labor</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Hourly Rate (kr/h)</Label>
              <Input
                type="number"
                step="10"
                value={input.labor.hourlyRate}
                onChange={(e) => updateLabor('hourlyRate', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hours per Batch</Label>
              <Input
                type="number"
                step="0.5"
                value={input.labor.hoursPerBatch}
                onChange={(e) => updateLabor('hoursPerBatch', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Overhead */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Overhead</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Per Liter (kr/L)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.overhead.perLiter}
                onChange={(e) => updateOverhead('perLiter', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">% of COGS</Label>
              <Input
                type="number"
                step="1"
                value={input.overhead.percentOfCOGS}
                onChange={(e) => updateOverhead('percentOfCOGS', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
