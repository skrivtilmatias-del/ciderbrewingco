import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { z } from "zod";

const blendSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  total_volume: z.number().positive("Total volume must be positive"),
  bottles_75cl: z.number().int().min(0, "Bottles must be a positive number").optional(),
  bottles_150cl: z.number().int().min(0, "Bottles must be a positive number").optional(),
  storage_location: z.string().trim().max(200, "Storage location must be less than 200 characters").optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  components: z.array(z.object({
    source_batch_id: z.string().min(1, "Batch is required"),
    percentage: z.number().min(0).max(100).nullable(),
    volume_liters: z.number().positive().nullable(),
    spillage: z.number().min(0).optional(),
  })).min(1, "At least one component is required"),
});

interface Batch {
  id: string;
  name: string;
  variety: string;
}

interface BlendComponent {
  source_batch_id: string;
  percentage: string;
  volume_liters: string;
  spillage: string;
}

interface NewBlendDialogProps {
  availableBatches: Batch[];
  onBlendCreated: (blend: z.infer<typeof blendSchema>) => void;
}

export function NewBlendDialog({ availableBatches, onBlendCreated }: NewBlendDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalVolume, setTotalVolume] = useState("");
  const [bottles75cl, setBottles75cl] = useState("");
  const [bottles150cl, setBottles150cl] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [components, setComponents] = useState<BlendComponent[]>([
    { source_batch_id: "", percentage: "", volume_liters: "", spillage: "" }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  const addComponent = () => {
    setComponents([...components, { source_batch_id: "", percentage: "", volume_liters: "", spillage: "" }]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof BlendComponent, value: string) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleCreate = () => {
    setErrors([]);
    
    const parsedComponents = components.map(comp => ({
      source_batch_id: comp.source_batch_id,
      percentage: comp.percentage ? parseFloat(comp.percentage) : null,
      volume_liters: comp.volume_liters ? parseFloat(comp.volume_liters) : null,
      spillage: comp.spillage ? parseFloat(comp.spillage) : 0,
    }));

    const validation = blendSchema.safeParse({
      name: name.trim(),
      total_volume: parseFloat(totalVolume),
      bottles_75cl: bottles75cl ? parseInt(bottles75cl) : 0,
      bottles_150cl: bottles150cl ? parseInt(bottles150cl) : 0,
      storage_location: storageLocation.trim(),
      notes: notes.trim(),
      components: parsedComponents,
    });

    if (!validation.success) {
      setErrors(validation.error.errors.map(e => e.message));
      return;
    }

    onBlendCreated({
      name: validation.data.name,
      total_volume: validation.data.total_volume,
      bottles_75cl: validation.data.bottles_75cl,
      bottles_150cl: validation.data.bottles_150cl,
      storage_location: validation.data.storage_location,
      notes: validation.data.notes,
      components: validation.data.components,
    });
    
    // Reset form
    setName("");
    setTotalVolume("");
    setBottles75cl("");
    setBottles150cl("");
    setStorageLocation("");
    setNotes("");
    setComponents([{ source_batch_id: "", percentage: "", volume_liters: "", spillage: "" }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Blend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Blend Batch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive rounded p-3">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="name">Blend Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2024 Premium Blend"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="volume">Total Volume (L)</Label>
            <Input
              id="volume"
              type="number"
              step="0.1"
              value={totalVolume}
              onChange={(e) => setTotalVolume(e.target.value)}
              placeholder="e.g., 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bottles-75">Bottles 75cl</Label>
              <Input
                id="bottles-75"
                type="number"
                min="0"
                value={bottles75cl}
                onChange={(e) => setBottles75cl(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="bottles-150">Bottles 150cl</Label>
              <Input
                id="bottles-150"
                type="number"
                min="0"
                value={bottles150cl}
                onChange={(e) => setBottles150cl(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storage">Storage Location</Label>
            <Input
              id="storage"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g., Rack A3, Cellar Room 2"
              maxLength={200}
            />
          </div>

          <div>
            <Label>Components</Label>
            <div className="space-y-3 mt-2">
              {components.map((component, index) => (
                <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Component {index + 1}</span>
                    {components.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`batch-${index}`}>Source Batch</Label>
                    <Select
                      value={component.source_batch_id}
                      onValueChange={(value) => updateComponent(index, 'source_batch_id', value)}
                    >
                      <SelectTrigger id={`batch-${index}`}>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.variety})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`percentage-${index}`} className="text-xs">Percentage (%)</Label>
                      <Input
                        id={`percentage-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={component.percentage}
                        onChange={(e) => updateComponent(index, 'percentage', e.target.value)}
                        placeholder="e.g., 40"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`volume-${index}`} className="text-xs">Volume (L)</Label>
                      <Input
                        id={`volume-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={component.volume_liters}
                        onChange={(e) => updateComponent(index, 'volume_liters', e.target.value)}
                        placeholder="e.g., 40"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`spillage-${index}`} className="text-xs">Spillage (L)</Label>
                      <Input
                        id={`spillage-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={component.spillage}
                        onChange={(e) => updateComponent(index, 'spillage', e.target.value)}
                        placeholder="0"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={addComponent}
              className="mt-3 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this blend..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Blend
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
