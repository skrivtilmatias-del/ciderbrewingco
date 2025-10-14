import { ZoomIn, ZoomOut, Grid3x3, Trash2, Save, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { toast } from "sonner";
import { useRef } from "react";

interface FloorPlanToolbarProps {
  onExport?: () => void;
  onSave?: () => void;
}

export const FloorPlanToolbar = ({ onExport, onSave }: FloorPlanToolbarProps) => {
  const { zoomLevel, setZoomLevel, snapToGrid, setSnapToGrid, selectedItemId, removeItem, exportToCSV, importFromCSV } = useFloorPlanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleExportCSV = () => {
    try {
      const csv = exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorplan-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Floor plan exported to CSV");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };
  
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        importFromCSV(csv);
        toast.success("Floor plan imported from CSV");
      } catch (error) {
        toast.error("Failed to import CSV - check file format");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleExportCSV}
        title="Export to CSV"
      >
        <FileSpreadsheet className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleImportCSV}
        title="Import from CSV"
      >
        <Upload className="w-4 h-4" />
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      
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
