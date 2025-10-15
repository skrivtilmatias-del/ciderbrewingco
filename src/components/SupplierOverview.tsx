import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, AlertTriangle, ArrowRight, Package, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { avgYield, avgCostPerL, detectPriceIncrease, detectYieldDecrease } from "@/lib/supplierMetrics";
import { paths } from "@/routes/paths";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";

export function SupplierOverview() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["supplier-overview-stats"],
    queryFn: async () => {
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*, press_results(*)")
        .order("delivery_date", { ascending: false })
        .limit(10);
      
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*");
      
      const activeContracts = contracts?.filter(
        c => !c.end_date || new Date(c.end_date) > new Date()
      ).length || 0;

      // Calculate alerts
      const alerts: any[] = [];
      
      if (suppliers && deliveries) {
        for (const supplier of suppliers.slice(0, 5)) {
          const supplierDeliveries = deliveries.filter(d => d.supplier_id === supplier.id);
          
          if (supplierDeliveries.length >= 2) {
            const priceAlert = detectPriceIncrease(supplierDeliveries);
            if (priceAlert.alert) {
              alerts.push({
                supplier: supplier.name,
                type: "price",
                message: `Price increased ${priceAlert.change}%`,
              });
            }

            const pressResults = supplierDeliveries
              .filter(d => d.press_results && d.press_results.length > 0)
              .map(d => ({
                juice_l: d.press_results[0].juice_l,
                delivery_id: d.id
              }));

            const yieldAlert = detectYieldDecrease(supplierDeliveries, pressResults);
            if (yieldAlert.alert) {
              alerts.push({
                supplier: supplier.name,
                type: "yield",
                message: `Yield decreased ${Math.abs(yieldAlert.change)}%`,
              });
            }
          }
        }
      }

      return {
        totalSuppliers: suppliers?.length || 0,
        activeContracts,
        recentDeliveries: deliveries?.slice(0, 5) || [],
        alerts: alerts.slice(0, 3),
      };
    },
  });

  const filteredSuppliers = suppliers?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeContracts || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentDeliveries.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Active Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate(paths.suppliers())}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.alerts.map((alert: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{alert.supplier}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    alert.type === "price" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    {alert.type === "price" ? "Price ↑" : "Yield ↓"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Deliveries</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(paths.suppliers())}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentDeliveries && stats.recentDeliveries.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDeliveries.map((delivery: any) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{delivery.product}</p>
                    <p className="text-xs text-muted-foreground">
                      Lot: {delivery.lot_code} • {delivery.qty_kg} kg @ €{delivery.price_per_kg}/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(delivery.delivery_date), "MMM dd")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No deliveries yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Supplier Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suppliers</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAllSuppliers(!showAllSuppliers)}>
                {showAllSuppliers ? "Show Less" : "Show All"}
              </Button>
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAllSuppliers && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
          
          {filteredSuppliers && filteredSuppliers.length > 0 ? (
            <div className="space-y-2">
              {(showAllSuppliers ? filteredSuppliers : filteredSuppliers.slice(0, 3)).map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                >
                  <div>
                    <h3 className="font-semibold text-sm">{supplier.name}</h3>
                    {supplier.contact && (
                      <p className="text-xs text-muted-foreground">{supplier.contact}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(supplier);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No suppliers yet</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Supplier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
      />
    </div>
  );
}
