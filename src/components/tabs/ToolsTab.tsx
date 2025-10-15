import { ProductionAnalytics } from '@/components/ProductionAnalytics';
import { ABVCalculator } from '@/components/calculators/ABVCalculator';
import { PrimingCalculator } from '@/components/calculators/PrimingCalculator';
import { SO2Calculator } from '@/components/calculators/SO2Calculator';
import { PrintQRCodes } from '@/components/PrintQRCodes';
import { FloorPlan } from '@/pages/FloorPlan';
import { CostCalculation } from '@/components/CostCalculation';
import { Card } from '@/components/ui/card';
import type { Batch } from '@/components/BatchCard';

interface ToolsTabProps {
  batches: Batch[];
  blendBatches: any[];
  toolView?: string;
}

export const ToolsTab = ({ batches, blendBatches, toolView }: ToolsTabProps) => {
  // Show analytics by default
  if (!toolView || toolView === 'analytics') {
    return <ProductionAnalytics batches={batches} />;
  }

  // Show calculators
  if (toolView === 'calculators') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ABVCalculator />
          <PrimingCalculator />
          <SO2Calculator />
        </div>
      </div>
    );
  }

  // Show print labels
  if (toolView === 'print-labels') {
    return (
      <PrintQRCodes 
        blendBatches={blendBatches} 
      />
    );
  }

  // Show floor plan
  if (toolView === 'floor-plan') {
    return <FloorPlan />;
  }

  // Show cost calculation
  if (toolView === 'cost-calculation') {
    return <CostCalculation />;
  }

  // Fallback for unknown tool views
  return (
    <Card className="p-12 text-center border-dashed">
      <p className="text-muted-foreground">
        Unknown tool view: {toolView}
      </p>
    </Card>
  );
};
