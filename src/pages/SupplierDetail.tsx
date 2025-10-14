import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { SupplierCharts } from "@/components/suppliers/SupplierCharts";
import { ContractsList } from "@/components/suppliers/ContractsList";
import { DeliveriesList } from "@/components/suppliers/DeliveriesList";
import { SupplierAlerts } from "@/components/suppliers/SupplierAlerts";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Supplier not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold">{supplier.name}</h1>
              {supplier.contact && (
                <p className="text-muted-foreground mt-1">{supplier.contact}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        {(supplier.terms || supplier.notes) && (
          <Card>
            <CardContent className="pt-6">
              {supplier.terms && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Terms</h3>
                  <p className="text-sm text-muted-foreground">{supplier.terms}</p>
                </div>
              )}
              {supplier.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        <SupplierAlerts supplierId={id!} />

        {/* Charts */}
        <SupplierCharts supplierId={id!} />

        {/* Tabs for Contracts and Deliveries */}
        <Tabs defaultValue="contracts" className="w-full">
          <TabsList>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contracts">
            <ContractsList supplierId={id!} />
          </TabsContent>
          
          <TabsContent value="deliveries">
            <DeliveriesList supplierId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}