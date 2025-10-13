import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { EquipmentCategory } from "@/types/floorplan";

export const AddEquipmentDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("tank");
  const [widthM, setWidthM] = useState("1.0");
  const [heightM, setHeightM] = useState("1.0");
  const [capacityL, setCapacityL] = useState("");
  const [color, setColor] = useState("#4F8FFF");
  
  const addCatalogItem = useFloorPlanStore((s) => s.addCatalogItem);
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    addCatalogItem({
      name: name.trim(),
      category,
      widthM: parseFloat(widthM) || 1,
      heightM: parseFloat(heightM) || 1,
      capacityL: capacityL ? parseFloat(capacityL) : undefined,
      color,
      icon: "Box",
    });
    
    // Reset form
    setName("");
    setWidthM("1.0");
    setHeightM("1.0");
    setCapacityL("");
    setColor("#4F8FFF");
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
          <DialogDescription>
            Create a custom equipment item for your library
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 1000L Tank"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as EquipmentCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tank">Tanks</SelectItem>
                <SelectItem value="press">Press</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="bottling">Bottling</SelectItem>
                <SelectItem value="workstation">Tools</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (m)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                min="0.1"
                value={widthM}
                onChange={(e) => setWidthM(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                value={heightM}
                onChange={(e) => setHeightM(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (L) - Optional</Label>
            <Input
              id="capacity"
              type="number"
              step="1"
              min="0"
              value={capacityL}
              onChange={(e) => setCapacityL(e.target.value)}
              placeholder="e.g., 1000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#4F8FFF"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Add Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
