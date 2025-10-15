import { Card } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CellarOverview } from '@/components/CellarOverview';

interface CellarTabProps {
  blendBatches: any[];
}

export const CellarTab = ({ blendBatches }: CellarTabProps) => {
  const { setSelectedBlend, setBlendDetailsOpen } = useAppStore();

  const handleBlendClick = (blend: any) => {
    // Set showInventoryControls flag for cellar view
    setSelectedBlend({ ...blend, showInventoryControls: true });
    setBlendDetailsOpen(true);
  };

  if (blendBatches.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <div className="flex flex-col items-center gap-4">
          <Warehouse className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground mb-1">
              No inventory yet
            </p>
            <p className="text-sm text-muted-foreground">
              Create blend batches to track your cellar inventory
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <CellarOverview 
      blends={blendBatches}
      onBlendClick={handleBlendClick}
      onRefresh={() => {
        // Refresh handled by React Query in parent
      }}
    />
  );
};
