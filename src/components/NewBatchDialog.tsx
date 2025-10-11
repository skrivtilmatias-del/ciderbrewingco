import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface NewBatchDialogProps {
  onBatchCreated: (batch: any) => void;
}

export const NewBatchDialog = ({ onBatchCreated }: NewBatchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    volume: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBatch = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      variety: formData.variety,
      volume: parseFloat(formData.volume),
      startDate: new Date().toISOString(),
      currentStage: "pressing" as const,
      progress: 10,
      notes: formData.notes,
    };

    onBatchCreated(newBatch);
    toast.success("Batch created successfully!");
    setOpen(false);
    setFormData({ name: "", variety: "", volume: "", notes: "" });
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
