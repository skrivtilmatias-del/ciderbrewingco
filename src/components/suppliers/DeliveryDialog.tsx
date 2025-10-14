import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  delivery?: any;
}

export function DeliveryDialog({ open, onOpenChange, supplierId, delivery }: DeliveryDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    product: delivery?.product || "",
    qty_kg: delivery?.qty_kg || "",
    price_per_kg: delivery?.price_per_kg || "",
    lot_code: delivery?.lot_code || "",
    delivery_date: delivery?.delivery_date
      ? new Date(delivery.delivery_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: delivery?.notes || "",
  });

  const [pressData, setPressData] = useState({
    juice_l: delivery?.press_results?.[0]?.juice_l || "",
    pomace_kg: delivery?.press_results?.[0]?.pomace_kg || "",
    brix: delivery?.press_results?.[0]?.brix || "",
    ph: delivery?.press_results?.[0]?.ph || "",
    notes: delivery?.press_results?.[0]?.notes || "",
  });

  const [qcData, setQcData] = useState({
    incident_type: "",
    severity: "1",
    qty_kg: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deliveryPayload = {
        ...deliveryData,
        supplier_id: supplierId,
      };

      let deliveryId = delivery?.id;

      if (delivery) {
        const { error } = await supabase
          .from("deliveries")
          .update(deliveryPayload)
          .eq("id", delivery.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("deliveries")
          .insert([deliveryPayload])
          .select()
          .single();
        
        if (error) throw error;
        deliveryId = data.id;
      }

      // Update or create press results if provided
      if (pressData.juice_l && deliveryId) {
        const pressPayload = {
          ...pressData,
          delivery_id: deliveryId,
        };

        if (delivery?.press_results?.[0]) {
          await supabase
            .from("press_results")
            .update(pressPayload)
            .eq("id", delivery.press_results[0].id);
        } else {
          await supabase
            .from("press_results")
            .insert([pressPayload]);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-charts"] });
      toast.success(delivery ? "Delivery updated" : "Delivery created");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{delivery ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="delivery" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="press">Press Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="delivery" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Input
                  id="product"
                  value={deliveryData.product}
                  onChange={(e) => setDeliveryData({ ...deliveryData, product: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty_kg">Quantity (kg) *</Label>
                  <Input
                    id="qty_kg"
                    type="number"
                    step="0.01"
                    value={deliveryData.qty_kg}
                    onChange={(e) => setDeliveryData({ ...deliveryData, qty_kg: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">Price per kg (€) *</Label>
                  <Input
                    id="price_per_kg"
                    type="number"
                    step="0.01"
                    value={deliveryData.price_per_kg}
                    onChange={(e) => setDeliveryData({ ...deliveryData, price_per_kg: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lot_code">Lot Code *</Label>
                  <Input
                    id="lot_code"
                    value={deliveryData.lot_code}
                    onChange={(e) => setDeliveryData({ ...deliveryData, lot_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={deliveryData.delivery_date}
                    onChange={(e) => setDeliveryData({ ...deliveryData, delivery_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_notes">Notes</Label>
                <Textarea
                  id="delivery_notes"
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="press" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="juice_l">Juice (L)</Label>
                  <Input
                    id="juice_l"
                    type="number"
                    step="0.01"
                    value={pressData.juice_l}
                    onChange={(e) => setPressData({ ...pressData, juice_l: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pomace_kg">Pomace (kg)</Label>
                  <Input
                    id="pomace_kg"
                    type="number"
                    step="0.01"
                    value={pressData.pomace_kg}
                    onChange={(e) => setPressData({ ...pressData, pomace_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brix">Brix</Label>
                  <Input
                    id="brix"
                    type="number"
                    step="0.1"
                    value={pressData.brix}
                    onChange={(e) => setPressData({ ...pressData, brix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    value={pressData.ph}
                    onChange={(e) => setPressData({ ...pressData, ph: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="press_notes">Notes</Label>
                <Textarea
                  id="press_notes"
                  value={pressData.notes}
                  onChange={(e) => setPressData({ ...pressData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : delivery ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}