import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export function CSVImportDialog({ open, onOpenChange, supplierId }: CSVImportDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i];
      });
      return row;
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // Expected CSV format:
      // product,qty_kg,price_per_kg,lot_code,delivery_date,juice_l,pomace_kg,brix,ph
      
      for (const row of rows) {
        // Insert delivery
        const { data: delivery, error: deliveryError } = await supabase
          .from("deliveries")
          .insert([{
            supplier_id: supplierId,
            product: row.product,
            qty_kg: parseFloat(row.qty_kg),
            price_per_kg: parseFloat(row.price_per_kg),
            lot_code: row.lot_code,
            delivery_date: row.delivery_date || new Date().toISOString(),
          }])
          .select()
          .single();

        if (deliveryError) throw deliveryError;

        // Insert press results if available
        if (row.juice_l && delivery) {
          await supabase
            .from("press_results")
            .insert([{
              delivery_id: delivery.id,
              juice_l: parseFloat(row.juice_l),
              pomace_kg: parseFloat(row.pomace_kg || 0),
              brix: row.brix ? parseFloat(row.brix) : null,
              ph: row.ph ? parseFloat(row.ph) : null,
            }]);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-charts"] });
      toast.success(`Imported ${rows.length} deliveries`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Deliveries from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex items-center gap-2">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expected columns: product, qty_kg, price_per_kg, lot_code, delivery_date, juice_l (optional), pomace_kg (optional), brix (optional), ph (optional)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}