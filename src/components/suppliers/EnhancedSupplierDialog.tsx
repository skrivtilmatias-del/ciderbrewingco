import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier, CreateSupplierInput } from "@/types/supplier.types";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Separator } from "@/components/ui/separator";

interface EnhancedSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export const EnhancedSupplierDialog = ({
  open,
  onOpenChange,
  supplier,
}: EnhancedSupplierDialogProps) => {
  const { createSupplier, updateSupplier, isCreating, isUpdating } = useSuppliers();
  const [formData, setFormData] = useState<Partial<CreateSupplierInput>>({
    name: "",
    primary_contact_name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    tax_id: "",
    payment_net_days: 30,
    category: "",
    status: "active",
    is_preferred: false,
    quality_score: undefined,
    reliability_rating: undefined,
    organic_certified: false,
    food_safety_certified: false,
    terms: "",
    notes: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        primary_contact_name: supplier.primary_contact_name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        website: supplier.website || "",
        tax_id: supplier.tax_id || "",
        payment_net_days: supplier.payment_net_days || 30,
        category: supplier.category || "",
        status: supplier.status,
        is_preferred: supplier.is_preferred,
        quality_score: supplier.quality_score || undefined,
        reliability_rating: supplier.reliability_rating || undefined,
        organic_certified: supplier.organic_certified,
        food_safety_certified: supplier.food_safety_certified,
        terms: supplier.terms || "",
        notes: supplier.notes || "",
      });
    }
  }, [supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (supplier) {
      updateSupplier({ id: supplier.id, updates: formData });
    } else {
      createSupplier(formData as CreateSupplierInput);
    }
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      primary_contact_name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      tax_id: "",
      payment_net_days: 30,
      category: "",
      status: "active",
      is_preferred: false,
      quality_score: undefined,
      reliability_rating: undefined,
      organic_certified: false,
      food_safety_certified: false,
      terms: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="primary_contact_name">Contact Person</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Apples, Bottles"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="payment_net_days">Payment Terms (Days)</Label>
                <Input
                  id="payment_net_days"
                  type="number"
                  value={formData.payment_net_days}
                  onChange={(e) => setFormData({ ...formData, payment_net_days: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quality Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quality Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quality_score">Quality Score (0-10)</Label>
                <Input
                  id="quality_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.quality_score || ""}
                  onChange={(e) => setFormData({ ...formData, quality_score: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="reliability_rating">Reliability Rating (0-10)</Label>
                <Input
                  id="reliability_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.reliability_rating || ""}
                  onChange={(e) => setFormData({ ...formData, reliability_rating: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Certifications & Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Certifications & Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_preferred">Preferred Supplier</Label>
                <Switch
                  id="is_preferred"
                  checked={formData.is_preferred}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_preferred: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="organic_certified">Organic Certified</Label>
                <Switch
                  id="organic_certified"
                  checked={formData.organic_certified}
                  onCheckedChange={(checked) => setFormData({ ...formData, organic_certified: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="food_safety_certified">Food Safety Certified</Label>
                <Switch
                  id="food_safety_certified"
                  checked={formData.food_safety_certified}
                  onCheckedChange={(checked) => setFormData({ ...formData, food_safety_certified: checked })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {supplier ? "Update" : "Create"} Supplier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
