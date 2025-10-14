import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, TrendingDown } from "lucide-react";
import { detectPriceIncrease, detectYieldDecrease } from "@/lib/supplierMetrics";

interface SupplierAlertsProps {
  supplierId: string;
}

export function SupplierAlerts({ supplierId }: SupplierAlertsProps) {
  const { data: alerts } = useQuery({
    queryKey: ["supplier-alerts", supplierId],
    queryFn: async () => {
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*, press_results(*)")
        .eq("supplier_id", supplierId)
        .order("delivery_date", { ascending: false })
        .limit(10);
      
      if (!deliveries || deliveries.length < 2) return [];

      const alerts = [];

      // Check price increase
      const priceAlert = detectPriceIncrease(deliveries);
      if (priceAlert.alert) {
        alerts.push({
          type: "price",
          message: `Price increased by ${priceAlert.change}% compared to previous deliveries`,
          severity: "warning"
        });
      }

      // Check yield decrease
      const pressResults = deliveries
        .filter(d => d.press_results && d.press_results.length > 0)
        .map(d => ({
          juice_l: d.press_results[0].juice_l,
          delivery_id: d.id
        }));

      const yieldAlert = detectYieldDecrease(deliveries, pressResults);
      if (yieldAlert.alert) {
        alerts.push({
          type: "yield",
          message: `Yield decreased by ${Math.abs(yieldAlert.change)}% compared to rolling average`,
          severity: "warning"
        });
      }

      return alerts;
    },
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <Alert key={idx} variant={alert.severity === "warning" ? "default" : "destructive"}>
          {alert.type === "price" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <AlertTitle>Alert</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}