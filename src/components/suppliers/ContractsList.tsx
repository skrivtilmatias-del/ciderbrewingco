import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ContractDialog } from "./ContractDialog";

interface ContractsListProps {
  supplierId: string;
}

export function ContractsList({ supplierId }: ContractsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const { data: contracts } = useQuery({
    queryKey: ["contracts", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = () => {
    setSelectedContract(null);
    setDialogOpen(true);
  };

  const handleEdit = (contract: any) => {
    setSelectedContract(contract);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contracts</CardTitle>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleEdit(contract)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{contract.product}</h4>
                      <p className="text-sm text-muted-foreground">
                        Min Qty: {contract.min_qty} kg @ €{contract.price_per_unit}/kg
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(contract.start_date), "MMM dd, yyyy")}
                        {contract.end_date && ` - ${format(new Date(contract.end_date), "MMM dd, yyyy")}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {contract.end_date && new Date(contract.end_date) < new Date() ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          Expired
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No contracts yet
            </p>
          )}
        </CardContent>
      </Card>

      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplierId={supplierId}
        contract={selectedContract}
      />
    </>
  );
}