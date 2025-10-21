import { ProductionAnalytics } from '@/components/ProductionAnalytics';
import { ABVCalculator } from '@/components/calculators/ABVCalculator';
import { PrimingCalculator } from '@/components/calculators/PrimingCalculator';
import { SO2Calculator } from '@/components/calculators/SO2Calculator';
import { PrintQRCodes } from '@/components/PrintQRCodes';
import { FloorPlan } from '@/pages/FloorPlan';
import { CostManagementTab } from '@/components/tabs/CostManagementTab';
import Webhooks from '@/pages/Webhooks';
import Install from '@/pages/Install';
import { Card } from '@/components/ui/card';
import type { Batch } from '@/components/BatchCard';

interface ToolsTabProps {
  batches: Batch[];
  blendBatches: any[];
  toolView?: string;
}

export const ToolsTab = ({ batches, blendBatches, toolView }: ToolsTabProps) => {
  // Show calculators by default or when explicitly requested
  if (!toolView || toolView === 'calculators') {
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

  // Show unified cost management
  if (toolView === 'cost-calculation') {
    return <CostManagementTab />;
  }

  // Show webhooks
  if (toolView === 'webhooks') {
    return <Webhooks />;
  }

  // Show install
  if (toolView === 'install') {
    return <Install />;
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
