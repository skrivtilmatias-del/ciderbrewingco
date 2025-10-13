import { ZoomIn, ZoomOut, Grid3x3, Trash2, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { toast } from "sonner";

interface FloorPlanToolbarProps {
  onExport?: () => void;
  onSave?: () => void;
}

export const FloorPlanToolbar = ({ onExport, onSave }: FloorPlanToolbarProps) => {
  const { zoomLevel, setZoomLevel, snapToGrid, setSnapToGrid, selectedItemId, removeItem } = useFloorPlanStore();
  
  const handleZoomIn = () => {
    setZoomLevel(zoomLevel + 0.2);
  };
  
  const handleZoomOut = () => {
    setZoomLevel(zoomLevel - 0.2);
  };
  
  const handleDelete = () => {
    if (selectedItemId) {
      removeItem(selectedItemId);
      toast.success("Item deleted");
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomOut}
        disabled={zoomLevel <= 0.5}
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <span className="text-sm text-muted-foreground min-w-12 text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomIn}
        disabled={zoomLevel >= 3}
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant={snapToGrid ? "default" : "outline"}
        size="icon"
        onClick={() => setSnapToGrid(!snapToGrid)}
        title="Snap to Grid"
      >
        <Grid3x3 className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleDelete}
        disabled={!selectedItemId}
        title="Delete Selected (Del)"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      
      {onExport && (
        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          title="Export PNG"
        >
          <Download className="w-4 h-4" />
        </Button>
      )}
      
      {onSave && (
        <Button
          onClick={onSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </Button>
      )}
    </div>
  );
};
