import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  contract?: any;
}

export function ContractDialog({ open, onOpenChange, supplierId, contract }: ContractDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product: contract?.product || "",
    min_qty: contract?.min_qty || "",
    price_per_unit: contract?.price_per_unit || "",
    start_date: contract?.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : "",
    end_date: contract?.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : "",
    notes: contract?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        supplier_id: supplierId,
        end_date: formData.end_date || null
      };

      if (contract) {
        const { error } = await supabase
          .from("contracts")
          .update(data)
          .eq("id", contract.id);
        
        if (error) throw error;
        toast.success("Contract updated");
      } else {
        const { error } = await supabase
          .from("contracts")
          .insert([data]);
        
        if (error) throw error;
        toast.success("Contract created");
      }

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Contract" : "Add Contract"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_qty">Min Quantity (kg) *</Label>
              <Input
                id="min_qty"
                type="number"
                step="0.01"
                value={formData.min_qty}
                onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_unit">Price per kg (€) *</Label>
              <Input
                id="price_per_unit"
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : contract ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}