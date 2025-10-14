import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, DollarSign, CheckCircle } from "lucide-react";
import { avgYield, avgCostPerL, defectRatePct } from "@/lib/supplierMetrics";

export function SupplierLeaderboard() {
  const { data: leaderboard } = useQuery({
    queryKey: ["supplier-leaderboard"],
    queryFn: async () => {
      const { data: suppliers } = await supabase
        .from("suppliers")
        .select("id, name");
      
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*, press_results(*), qc_incidents(*)");
      
      if (!suppliers || !deliveries) return null;

      const supplierMetrics = suppliers.map(supplier => {
        const supplierDeliveries = deliveries.filter(d => d.supplier_id === supplier.id);
        const pressResults = supplierDeliveries
          .flatMap(d => d.press_results || [])
          .map(pr => ({ juice_l: pr.juice_l, delivery_id: pr.delivery_id }));
        
        const incidents = supplierDeliveries
          .flatMap(d => d.qc_incidents || [])
          .map(i => ({ severity: i.severity, qty_kg: i.qty_kg }));

        return {
          supplier_id: supplier.id,
          name: supplier.name,
          yield: avgYield(supplierDeliveries, pressResults),
          costPerL: avgCostPerL(supplierDeliveries, pressResults),
          defectRate: defectRatePct(incidents),
          deliveryCount: supplierDeliveries.length
        };
      }).filter(m => m.deliveryCount > 0);

      return {
        bestYield: [...supplierMetrics].sort((a, b) => b.yield - a.yield).slice(0, 3),
        lowestCost: [...supplierMetrics].sort((a, b) => a.costPerL - b.costPerL).slice(0, 3),
        lowestDefects: [...supplierMetrics].sort((a, b) => a.defectRate - b.defectRate).slice(0, 3),
      };
    },
  });

  if (!leaderboard) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Best Yield (L/kg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.bestYield.length > 0 ? (
              leaderboard.bestYield.map((s, idx) => (
                <div key={s.supplier_id} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    {idx === 0 && <Trophy className="h-3 w-3 mr-1 text-yellow-500" />}
                    {s.name}
                  </span>
                  <span className="font-semibold">{s.yield.toFixed(3)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Lowest Cost (€/L)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.lowestCost.length > 0 ? (
              leaderboard.lowestCost.map((s, idx) => (
                <div key={s.supplier_id} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    {idx === 0 && <Trophy className="h-3 w-3 mr-1 text-yellow-500" />}
                    {s.name}
                  </span>
                  <span className="font-semibold">€{s.costPerL.toFixed(4)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Lowest Defects (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.lowestDefects.length > 0 ? (
              leaderboard.lowestDefects.map((s, idx) => (
                <div key={s.supplier_id} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    {idx === 0 && <Trophy className="h-3 w-3 mr-1 text-yellow-500" />}
                    {s.name}
                  </span>
                  <span className="font-semibold">{s.defectRate.toFixed(2)}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}