import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  TrendingUp, 
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  Star
} from "lucide-react";
import { Supplier } from "@/types/supplier.types";
import { format } from "date-fns";

interface SupplierCardProps {
  supplier: Supplier;
  deliveryCount: number;
  contractCount: number;
  lastDeliveryDate: string | null;
  onViewDetails: () => void;
  onEdit: () => void;
  onNewDelivery: () => void;
  onNewContract: () => void;
}

const getQualityBadgeColor = (score: number | null) => {
  if (!score) return "secondary";
  if (score >= 8) return "default";
  if (score >= 6) return "secondary";
  return "destructive";
};

const getStatusBadgeVariant = (status: string, isPreferred: boolean) => {
  if (isPreferred) return "default";
  if (status === "active") return "secondary";
  return "outline";
};

export const SupplierCard = ({
  supplier,
  deliveryCount,
  contractCount,
  lastDeliveryDate,
  onViewDetails,
  onEdit,
  onNewDelivery,
  onNewContract,
}: SupplierCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{supplier.name}</h3>
              {supplier.is_preferred && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Preferred
                </Badge>
              )}
              <Badge variant={supplier.status === "active" ? "secondary" : "outline"}>
                {supplier.status}
              </Badge>
            </div>
            {supplier.primary_contact_name && (
              <p className="text-sm text-muted-foreground">{supplier.primary_contact_name}</p>
            )}
          </div>
          {supplier.quality_score && (
            <Badge variant={getQualityBadgeColor(supplier.quality_score)} className="ml-2">
              <Award className="h-3 w-3 mr-1" />
              {supplier.quality_score.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{supplier.address}</span>
            </div>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contracts</p>
              <p className="text-sm font-semibold">{contractCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">YTD Spend</p>
              <p className="text-sm font-semibold">€{supplier.total_spend_ytd.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deliveries</p>
              <p className="text-sm font-semibold">{deliveryCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">On-time</p>
              <p className="text-sm font-semibold">
                {supplier.on_time_delivery_rate ? `${supplier.on_time_delivery_rate.toFixed(0)}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Last Delivery */}
        {lastDeliveryDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            Last delivery: {format(new Date(lastDeliveryDate), "MMM dd, yyyy")}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onNewDelivery} className="flex-1">
            New Delivery
          </Button>
          <Button variant="outline" size="sm" onClick={onNewContract} className="flex-1">
            New Contract
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
