import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { SupplierLeaderboard } from "@/components/suppliers/SupplierLeaderboard";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";

export default function Suppliers() {
  const navigate = useNavigate();
  const { userRole, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { data: suppliers, isLoading } = useQuery({
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
    queryKey: ["supplier-stats"],
    queryFn: async () => {
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("*, press_results(*), qc_incidents(*)");
      
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*");
      
      return {
        totalDeliveries: deliveries?.length || 0,
        activeContracts: contracts?.filter(c => !c.end_date || new Date(c.end_date) > new Date()).length || 0,
        totalSuppliers: suppliers?.length || 0
      };
    },
  });

  const filteredSuppliers = suppliers?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

  return (
    <AppLayout userRole={userRole} userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Supplier Ledger</h1>
            <p className="text-muted-foreground mt-2">
              Track contracts, deliveries, yield, and quality metrics
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        {/* Stats Cards */}
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
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDeliveries || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <SupplierLeaderboard />

        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Suppliers</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
              <div className="space-y-2">
                {filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    <div>
                      <h3 className="font-semibold">{supplier.name}</h3>
                      {supplier.contact && (
                        <p className="text-sm text-muted-foreground">{supplier.contact}</p>
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
                No suppliers found. Add your first supplier to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
      />
    </AppLayout>
  );
}