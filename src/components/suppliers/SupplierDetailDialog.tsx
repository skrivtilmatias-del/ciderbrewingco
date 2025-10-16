import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Supplier } from "@/types/supplier.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Award,
  CheckCircle,
  XCircle,
  Star,
  Building2
} from "lucide-react";
import { ContractsList } from "./ContractsList";
import { DeliveriesList } from "./DeliveriesList";

interface SupplierDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export const SupplierDetailDialog = ({
  open,
  onOpenChange,
  supplier,
}: SupplierDetailDialogProps) => {
  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {supplier.name}
                {supplier.is_preferred && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Preferred
                  </Badge>
                )}
                <Badge variant={supplier.status === "active" ? "secondary" : "outline"}>
                  {supplier.status}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{supplier.primary_contact_name}</p>
            </div>
            {supplier.quality_score && (
              <div className="text-right">
                <div className="text-2xl font-bold">{supplier.quality_score.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Quality Score</p>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="press">Press Results</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-4 m-0">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {supplier.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.tax_id && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tax ID / VAT</p>
                        <p className="text-sm font-medium">{supplier.tax_id}</p>
                      </div>
                    </div>
                  )}
                  {supplier.payment_net_days && (
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Terms</p>
                      <p className="text-sm font-medium">Net {supplier.payment_net_days} days</p>
                    </div>
                  )}
                  {supplier.category && (
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="text-sm font-medium">{supplier.category}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <p className="text-lg font-bold">
                          {supplier.quality_score ? `${supplier.quality_score.toFixed(1)}/10` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reliability</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-lg font-bold">
                          {supplier.reliability_rating ? `${supplier.reliability_rating.toFixed(1)}/10` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">On-Time Rate</p>
                      <p className="text-lg font-bold">
                        {supplier.on_time_delivery_rate ? `${supplier.on_time_delivery_rate.toFixed(0)}%` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">YTD Spend</p>
                      <p className="text-lg font-bold">€{supplier.total_spend_ytd.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Organic Certified</span>
                    {supplier.organic_certified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Food Safety Certified</span>
                    {supplier.food_safety_certified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="m-0">
              <ContractsList supplierId={supplier.id} />
            </TabsContent>

            <TabsContent value="deliveries" className="m-0">
              <DeliveriesList supplierId={supplier.id} />
            </TabsContent>

            <TabsContent value="press" className="m-0">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Press results will be shown here
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="m-0">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Quality issues and tracking will be shown here
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {supplier.notes || "No notes available"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
