import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .trim()
    .max(50, { message: "Phone must be less than 50 characters" })
    .optional(),
  address: z.string()
    .trim()
    .max(500, { message: "Address must be less than 500 characters" })
    .optional(),
  website: z.string()
    .trim()
    .url({ message: "Invalid website URL" })
    .max(255, { message: "Website must be less than 255 characters" })
    .optional()
    .or(z.literal("")),
  tax_id: z.string()
    .trim()
    .max(100, { message: "Tax ID must be less than 100 characters" })
    .optional(),
  primary_contact_name: z.string()
    .trim()
    .max(100, { message: "Contact name must be less than 100 characters" })
    .optional(),
  category: z.string()
    .trim()
    .max(100, { message: "Category must be less than 100 characters" })
    .optional(),
  payment_net_days: z.number()
    .int({ message: "Must be a whole number" })
    .min(0, { message: "Must be 0 or greater" })
    .max(365, { message: "Must be less than 365 days" })
    .optional(),
  rating: z.number()
    .int({ message: "Must be a whole number" })
    .min(1, { message: "Rating must be between 1 and 5" })
    .max(5, { message: "Rating must be between 1 and 5" })
    .optional(),
  contact: z.string()
    .trim()
    .max(500, { message: "Contact info must be less than 500 characters" })
    .optional(),
  terms: z.string()
    .trim()
    .max(2000, { message: "Terms must be less than 2000 characters" })
    .optional(),
  notes: z.string()
    .trim()
    .max(2000, { message: "Notes must be less than 2000 characters" })
    .optional(),
});

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: any;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    tax_id: "",
    primary_contact_name: "",
    category: "",
    payment_net_days: 30,
    rating: undefined as number | undefined,
    contact: "",
    terms: "",
    notes: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        website: supplier.website || "",
        tax_id: supplier.tax_id || "",
        primary_contact_name: supplier.primary_contact_name || "",
        category: supplier.category || "",
        payment_net_days: supplier.payment_net_days ?? 30,
        rating: supplier.rating || undefined,
        contact: supplier.contact || "",
        terms: supplier.terms || "",
        notes: supplier.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        tax_id: "",
        primary_contact_name: "",
        category: "",
        payment_net_days: 30,
        rating: undefined,
        contact: "",
        terms: "",
        notes: "",
      });
    }
    setErrors({});
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    try {
      // Prepare data for validation (convert empty strings to undefined)
      const dataToValidate = {
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        website: formData.website || undefined,
        tax_id: formData.tax_id || undefined,
        primary_contact_name: formData.primary_contact_name || undefined,
        category: formData.category || undefined,
        contact: formData.contact || undefined,
        terms: formData.terms || undefined,
        notes: formData.notes || undefined,
      };

      const validatedData = supplierSchema.parse(dataToValidate);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare data for submission (remove empty strings, set nulls)
      const submissionData = {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        website: validatedData.website || null,
        tax_id: validatedData.tax_id || null,
        primary_contact_name: validatedData.primary_contact_name || null,
        category: validatedData.category || null,
        payment_net_days: validatedData.payment_net_days ?? 30,
        rating: validatedData.rating || null,
        contact: validatedData.contact || null,
        terms: validatedData.terms || null,
        notes: validatedData.notes || null,
      };

      if (supplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(submissionData)
          .eq("id", supplier.id);
        
        if (error) throw error;
        toast.success("Supplier updated successfully");
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert([{ ...submissionData, user_id: user.id }]);
        
        if (error) throw error;
        toast.success("Supplier created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-overview-stats"] });
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error.message || "Failed to save supplier");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                  placeholder="Acme Orchards Ltd."
                  required
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  maxLength={100}
                  placeholder="e.g., Apple Grower, Equipment, Packaging"
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Supplier Rating (1-5 stars)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating || ""}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Rate 1-5"
                />
                {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID / Business Registration</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  maxLength={100}
                  placeholder="VAT/Tax identification number"
                />
                {errors.tax_id && <p className="text-sm text-destructive">{errors.tax_id}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Primary Contact Person</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  maxLength={100}
                  placeholder="John Smith"
                />
                {errors.primary_contact_name && <p className="text-sm text-destructive">{errors.primary_contact_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  maxLength={255}
                  placeholder="contact@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  maxLength={50}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  maxLength={255}
                  placeholder="https://example.com"
                />
                {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Physical/Mailing Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                maxLength={500}
                placeholder="123 Orchard Lane, Cidertown, AB 12345"
                rows={2}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>
          </div>

          {/* Legacy Contact Field (for backwards compatibility) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Additional Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contact">Other Contact Information</Label>
              <Textarea
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                maxLength={500}
                placeholder="Additional phone numbers, contacts, or other info..."
                rows={2}
              />
              {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Payment & Terms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_net_days">Payment Terms (Net Days)</Label>
                <Input
                  id="payment_net_days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.payment_net_days}
                  onChange={(e) => setFormData({ ...formData, payment_net_days: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">Number of days for payment (e.g., Net 30)</p>
                {errors.payment_net_days && <p className="text-sm text-destructive">{errors.payment_net_days}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Detailed Payment Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                maxLength={2000}
                placeholder="Detailed payment terms, conditions, discounts..."
                rows={3}
              />
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                maxLength={2000}
                placeholder="Additional information about this supplier..."
                rows={3}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}