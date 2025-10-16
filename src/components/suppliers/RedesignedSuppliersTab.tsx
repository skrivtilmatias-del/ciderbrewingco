import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Plus,
  Filter,
  Download,
  SortAsc
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupplierMetricsCards } from "./SupplierMetricsCards";
import { SupplierCard } from "./SupplierCard";
import { EnhancedSupplierDialog } from "./EnhancedSupplierDialog";
import { SupplierDetailDialog } from "./SupplierDetailDialog";
import { DeliveryDialog } from "./DeliveryDialog";
import { ContractDialog } from "./ContractDialog";
import { Supplier } from "@/types/supplier.types";
import { startOfMonth } from "date-fns";
import { useSuppliers } from "@/hooks/useSuppliers";

export const RedesignedSuppliersTab = () => {
  const { deleteSupplier } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch deliveries
  const { data: deliveries = [] } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("delivery_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeSuppliers = suppliers.filter(s => s.status === "active").length;
    const activeContracts = contracts.filter(
      c => !c.end_date || new Date(c.end_date) > new Date()
    );
    const contractsValue = activeContracts.reduce((sum, c) => sum + (c.price_per_unit * c.min_qty), 0);
    
    const avgQualityScore = suppliers.length > 0
      ? suppliers.reduce((sum, s) => sum + (s.quality_score || 0), 0) / suppliers.filter(s => s.quality_score).length
      : 0;
    
    const currentMonth = startOfMonth(new Date());
    const monthDeliveries = deliveries.filter(
      d => new Date(d.delivery_date) >= currentMonth
    );
    
    // Find top supplier by delivery count this month
    const deliveryCountBySupplierId = monthDeliveries.reduce((acc, d) => {
      acc[d.supplier_id] = (acc[d.supplier_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSupplierId = Object.entries(deliveryCountBySupplierId)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const topSupplier = topSupplierId 
      ? suppliers.find(s => s.id === topSupplierId)?.name || null
      : null;

    return {
      totalSuppliers: suppliers.length,
      activeSuppliers,
      contractsValue,
      avgQualityScore: isNaN(avgQualityScore) ? 0 : avgQualityScore,
      totalDeliveries: monthDeliveries.length,
      topSupplier,
    };
  }, [suppliers, contracts, deliveries]);

  // Get supplier statistics
  const getSupplierStats = (supplierId: string) => {
    const supplierDeliveries = deliveries.filter(d => d.supplier_id === supplierId);
    const supplierContracts = contracts.filter(c => c.supplier_id === supplierId);
    const lastDelivery = supplierDeliveries[0]?.delivery_date || null;

    return {
      deliveryCount: supplierDeliveries.length,
      contractCount: supplierContracts.length,
      lastDeliveryDate: lastDelivery,
    };
  };

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "quality":
          return (b.quality_score || 0) - (a.quality_score || 0);
        case "spend":
          return b.total_spend_ytd - a.total_spend_ytd;
        default:
          return 0;
      }
    });

    return result;
  }, [suppliers, searchQuery, statusFilter, sortBy]);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setSupplierDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierDialogOpen(true);
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailDialogOpen(true);
  };

  const handleNewDelivery = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeliveryDialogOpen(true);
  };

  const handleNewContract = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setContractDialogOpen(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    deleteSupplier(supplierId);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Dashboard */}
      <SupplierMetricsCards {...metrics} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers by name, email, contact, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="spend">Spend</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>

          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {loadingSuppliers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const stats = getSupplierStats(supplier.id);
            return (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                deliveryCount={stats.deliveryCount}
                contractCount={stats.contractCount}
                lastDeliveryDate={stats.lastDeliveryDate}
                onViewDetails={() => handleViewDetails(supplier)}
                onEdit={() => handleEditSupplier(supplier)}
                onNewDelivery={() => handleNewDelivery(supplier)}
                onNewContract={() => handleNewContract(supplier)}
                onDelete={() => handleDeleteSupplier(supplier.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No suppliers found</p>
          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Supplier
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <EnhancedSupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={selectedSupplier}
      />

      <SupplierDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        supplier={selectedSupplier}
      />

      <DeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        supplierId={selectedSupplier?.id || ""}
      />

      <ContractDialog
        open={contractDialogOpen}
        onOpenChange={setContractDialogOpen}
        supplierId={selectedSupplier?.id || ""}
      />
    </div>
  );
};
