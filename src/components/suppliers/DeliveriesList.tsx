import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { format } from "date-fns";
import { DeliveryDialog } from "./DeliveryDialog";
import { CSVImportDialog } from "./CSVImportDialog";
import { yieldLPerKg, costPerL } from "@/lib/supplierMetrics";

interface DeliveriesListProps {
  supplierId: string;
}

export function DeliveriesList({ supplierId }: DeliveriesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const { data: deliveries } = useQuery({
    queryKey: ["deliveries", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, press_results(*), qc_incidents(*)")
        .eq("supplier_id", supplierId)
        .order("delivery_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = () => {
    setSelectedDelivery(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deliveries</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Delivery
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {deliveries && deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map((delivery) => {
                const pressResult = delivery.press_results?.[0];
                const yield_val = pressResult
                  ? yieldLPerKg(pressResult.juice_l, delivery.qty_kg)
                  : null;
                const cost = pressResult
                  ? costPerL(delivery.qty_kg, delivery.price_per_kg, pressResult.juice_l)
                  : null;

                return (
                  <div
                    key={delivery.id}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{delivery.product}</h4>
                        <p className="text-sm text-muted-foreground">
                          Lot: {delivery.lot_code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.qty_kg} kg @ €{delivery.price_per_kg}/kg
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(delivery.delivery_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {yield_val && (
                          <p className="text-muted-foreground">
                            Yield: {yield_val} L/kg
                          </p>
                        )}
                        {cost && (
                          <p className="text-muted-foreground">
                            Cost: €{cost}/L
                          </p>
                        )}
                        {delivery.qc_incidents && delivery.qc_incidents.length > 0 && (
                          <p className="text-amber-600 text-xs mt-1">
                            {delivery.qc_incidents.length} QC incident(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No deliveries yet
            </p>
          )}
        </CardContent>
      </Card>

      <DeliveryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplierId={supplierId}
        delivery={selectedDelivery}
      />

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        supplierId={supplierId}
      />
    </>
  );
}