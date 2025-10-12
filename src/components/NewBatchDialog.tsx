import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { batchSchema } from "@/lib/validationSchemas";

interface NewBatchDialogProps {
  onBatchCreated: (batch: any) => void;
}

export const NewBatchDialog = ({ onBatchCreated }: NewBatchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    volume: "",
    yeastType: "",
    startOG: "",
    endOG: "",
    startPH: "",
    endPH: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = batchSchema.safeParse({
      name: formData.name.trim(),
      variety: formData.variety.trim(),
      volume: parseFloat(formData.volume),
      yeast_type: formData.yeastType.trim() || undefined,
      target_og: formData.startOG ? parseFloat(formData.startOG) : undefined,
      target_fg: formData.endOG ? parseFloat(formData.endOG) : undefined,
      target_ph: formData.startPH ? parseFloat(formData.startPH) : undefined,
      target_end_ph: formData.endPH ? parseFloat(formData.endPH) : undefined,
      notes: formData.notes.trim() || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const newBatch = {
      name: validation.data.name,
      variety: validation.data.variety,
      volume: validation.data.volume,
      yeast_type: validation.data.yeast_type,
      target_og: validation.data.target_og,
      target_fg: validation.data.target_fg,
      target_ph: validation.data.target_ph,
      target_end_ph: validation.data.target_end_ph,
      startDate: new Date().toISOString(),
      currentStage: "Harvest" as const,
      progress: 0,
      notes: validation.data.notes,
    };

    onBatchCreated(newBatch as any);
    toast.success("Batch created successfully!");
    setOpen(false);
    setFormData({ name: "", variety: "", volume: "", yeastType: "", startOG: "", endOG: "", startPH: "", endPH: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
            <Input
              id="name"
              placeholder="e.g., Autumn Harvest 2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variety">Apple Variety</Label>
            <Input
              id="variety"
              placeholder="e.g., Kingston Black"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume">Volume (Liters)</Label>
            <Input
              id="volume"
              type="number"
              step="0.1"
              placeholder="e.g., 100"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yeastType">Yeast Type (Optional)</Label>
            <Input
              id="yeastType"
              placeholder="e.g., EC-1118, SafCider"
              value={formData.yeastType}
              onChange={(e) => setFormData({ ...formData, yeastType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startOG">OG (Optional)</Label>
              <Input
                id="startOG"
                type="number"
                step="0.001"
                placeholder="e.g., 1.050"
                value={formData.startOG}
                onChange={(e) => setFormData({ ...formData, startOG: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endOG">FG (Optional)</Label>
              <Input
                id="endOG"
                type="number"
                step="0.001"
                placeholder="e.g., 1.000"
                value={formData.endOG}
                onChange={(e) => setFormData({ ...formData, endOG: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startPH">Start PH (Optional)</Label>
              <Input
                id="startPH"
                type="number"
                step="0.1"
                placeholder="e.g., 3.5"
                value={formData.startPH}
                onChange={(e) => setFormData({ ...formData, startPH: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endPH">End PH (Optional)</Label>
              <Input
                id="endPH"
                type="number"
                step="0.1"
                placeholder="e.g., 3.8"
                value={formData.endPH}
                onChange={(e) => setFormData({ ...formData, endPH: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any observations or special notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            Create Batch
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
