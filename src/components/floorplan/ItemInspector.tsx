import { useEffect, useState } from "react";
import { Copy, Trash2, Lock, Unlock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { toast } from "sonner";

export const ItemInspector = () => {
  const { plan, selectedItemId, updateItem, removeItem, duplicateItem, setSelectedItemId } = useFloorPlanStore();
  const item = plan.items.find(i => i.id === selectedItemId);
  
  const [name, setName] = useState("");
  const [widthM, setWidthM] = useState("");
  const [heightM, setHeightM] = useState("");
  const [capacityL, setCapacityL] = useState("");
  const [rotationDeg, setRotationDeg] = useState("");
  const [lockedAspect, setLockedAspect] = useState(false);
  
  useEffect(() => {
    if (item) {
      setName(item.name);
      setWidthM(item.widthM.toFixed(2));
      setHeightM(item.heightM.toFixed(2));
      setCapacityL(item.capacityL?.toString() || "");
      setRotationDeg(item.rotationDeg.toString());
      setLockedAspect(item.lockedAspect || false);
    }
  }, [item]);
  
  if (!item || !selectedItemId) return null;
  
  const handleUpdate = (field: string, value: any) => {
    updateItem(selectedItemId, { [field]: value });
  };
  
  const handleDelete = () => {
    removeItem(selectedItemId);
    toast.success("Item deleted");
  };
  
  const handleDuplicate = () => {
    duplicateItem(selectedItemId);
    toast.success("Item duplicated");
  };
  
  return (
    <Card className="absolute right-4 top-20 w-80 p-4 space-y-4 shadow-lg z-50 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Item Properties</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedItemId(null)}
          className="h-6 w-6"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="item-name">Name</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleUpdate('name', e.target.value);
            }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-width">Width (m)</Label>
            <Input
              id="item-width"
              type="number"
              step="0.1"
              min="0.3"
              value={widthM}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0.3;
                setWidthM(e.target.value);
                handleUpdate('widthM', val);
                if (lockedAspect && item) {
                  const ratio = item.heightM / item.widthM;
                  const newHeight = val * ratio;
                  setHeightM(newHeight.toFixed(2));
                  handleUpdate('heightM', newHeight);
                }
              }}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="item-height">Height (m)</Label>
            <Input
              id="item-height"
              type="number"
              step="0.1"
              min="0.3"
              value={heightM}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0.3;
                setHeightM(e.target.value);
                handleUpdate('heightM', val);
                if (lockedAspect && item) {
                  const ratio = item.widthM / item.heightM;
                  const newWidth = val * ratio;
                  setWidthM(newWidth.toFixed(2));
                  handleUpdate('widthM', newWidth);
                }
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newLocked = !lockedAspect;
              setLockedAspect(newLocked);
              handleUpdate('lockedAspect', newLocked);
            }}
            className="gap-2"
          >
            {lockedAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            Lock Aspect
          </Button>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="item-capacity">Capacity (L)</Label>
          <Input
            id="item-capacity"
            type="number"
            step="1"
            min="0"
            value={capacityL}
            onChange={(e) => {
              setCapacityL(e.target.value);
              handleUpdate('capacityL', e.target.value ? parseFloat(e.target.value) : undefined);
            }}
            placeholder="Optional"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="item-rotation">Rotation (°)</Label>
          <Input
            id="item-rotation"
            type="number"
            step="15"
            min="0"
            max="360"
            value={rotationDeg}
            onChange={(e) => {
              setRotationDeg(e.target.value);
              handleUpdate('rotationDeg', parseFloat(e.target.value) || 0);
            }}
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDuplicate}
          className="flex-1 gap-2"
        >
          <Copy className="w-3 h-3" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="flex-1 gap-2"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>
    </Card>
  );
};
