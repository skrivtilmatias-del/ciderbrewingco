import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { yieldLPerKg, costPerL } from "@/lib/supplierMetrics";
import { format } from "date-fns";

interface SupplierChartsProps {
  supplierId: string;
}

export function SupplierCharts({ supplierId }: SupplierChartsProps) {
  const { data: chartData } = useQuery({
    queryKey: ["supplier-charts", supplierId],
    queryFn: async () => {
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*, press_results(*)")
        .eq("supplier_id", supplierId)
        .order("delivery_date");
      
      if (!deliveries) return [];

      return deliveries
        .filter(d => d.press_results && d.press_results.length > 0)
        .map(d => {
          const pr = d.press_results[0];
          return {
            date: format(new Date(d.delivery_date), "MMM dd"),
            yield: yieldLPerKg(pr.juice_l, d.qty_kg),
            pricePerKg: d.price_per_kg,
            costPerL: costPerL(d.qty_kg, d.price_per_kg, pr.juice_l)
          };
        });
    },
  });

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No delivery data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Yield Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Yield Trend (L/kg)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Price Trend (€/kg)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pricePerKg" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost per L Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Cost per Liter Trend (€/L)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="costPerL" stroke="hsl(var(--chart-3))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}