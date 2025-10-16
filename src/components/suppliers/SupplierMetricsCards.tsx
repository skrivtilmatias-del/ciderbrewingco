import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, Award, Star } from "lucide-react";

interface SupplierMetricsCardsProps {
  totalSuppliers: number;
  activeSuppliers: number;
  contractsValue: number;
  avgQualityScore: number;
  totalDeliveries: number;
  topSupplier: string | null;
}

export const SupplierMetricsCards = ({
  totalSuppliers,
  activeSuppliers,
  contractsValue,
  avgQualityScore,
  totalDeliveries,
  topSupplier,
}: SupplierMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSuppliers}</div>
          <p className="text-xs text-muted-foreground">of {totalSuppliers} total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contracts Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{contractsValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total active contracts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgQualityScore.toFixed(1)}/10</div>
          <p className="text-xs text-muted-foreground">Across all suppliers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deliveries This Month</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDeliveries}</div>
          {topSupplier && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Star className="h-3 w-3 mr-1" />
              Top: {topSupplier}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
