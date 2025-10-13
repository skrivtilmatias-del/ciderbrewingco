import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { InteractiveCanvas } from "@/components/floorplan/InteractiveCanvas";
import { EquipmentLibraryPanel } from "@/components/floorplan/EquipmentLibraryPanel";
import { FloorPlanToolbar } from "@/components/floorplan/FloorPlanToolbar";
import { ItemInspector } from "@/components/floorplan/ItemInspector";
import { totalCapacityL, utilizationPct, freeAreaM2 } from "@/lib/floorplan-metrics";
import { toast } from "sonner";

export const FloorPlan = () => {
  const { plan, savePlan } = useFloorPlanStore();
  
  const totalCapacity = totalCapacityL(plan.items);
  const utilization = utilizationPct(plan.items, plan.roomWidthM, plan.roomHeightM);
  const freeArea = freeAreaM2(plan.items, plan.roomWidthM, plan.roomHeightM);
  
  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      savePlan();
    }, 500);
    return () => clearTimeout(timer);
  }, [plan.items, plan.roomWidthM, plan.roomHeightM]);
  
  const handleSave = () => {
    savePlan();
    toast.success("Floor plan saved!");
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card flex-shrink-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold">Production Floor Plan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Design your {plan.roomWidthM}m × {plan.roomHeightM}m production space
            </p>
          </div>
          
          <FloorPlanToolbar onSave={handleSave} />
        </div>
      </div>
      
      {/* Metrics */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 bg-muted/30 border-b flex-shrink-0 overflow-x-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-max lg:min-w-0">
          <Card className="p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap">{totalCapacity.toLocaleString()} L</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Utilization</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{utilization} %</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Equipment</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{plan.items.length}</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Free Area</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap">{freeArea.toFixed(1)} m²</p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        <InteractiveCanvas />
        <EquipmentLibraryPanel />
        <ItemInspector />
      </div>
    </div>
  );
};
