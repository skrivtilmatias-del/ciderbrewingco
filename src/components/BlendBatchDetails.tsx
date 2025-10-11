import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wine, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorHandler";

interface BlendComponent {
  id: string;
  source_batch_id: string;
  batch_name: string;
  batch_variety: string;
  percentage: number | null;
  volume_liters: number | null;
}

interface BlendBatch {
  id: string;
  name: string;
  total_volume: number;
  notes: string | null;
  created_at: string;
  components: BlendComponent[];
}

interface BlendBatchDetailsProps {
  blend: BlendBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlendUpdated: () => void;
}

export function BlendBatchDetails({ blend, open, onOpenChange, onBlendUpdated }: BlendBatchDetailsProps) {
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (blend) {
      setNotes(blend.notes || "");
      setIsEditingNotes(false);
    }
  }, [blend]);

  const handleSaveNotes = async () => {
    if (!blend) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({ notes: notes.trim() || null })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success("Notes saved");
      setIsEditingNotes(false);
      onBlendUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!blend) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-primary" />
            <DialogTitle className="text-2xl">{blend.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Volume */}
          <div className="border border-border rounded-lg p-4">
            <Label className="text-sm text-muted-foreground">Total Volume</Label>
            <p className="text-2xl font-bold mt-1">{blend.total_volume}L</p>
          </div>

          {/* Components */}
          <div>
            <Label className="text-base font-semibold">Components</Label>
            <div className="space-y-3 mt-3">
              {blend.components.map((component) => (
                <div key={component.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{component.batch_name}</p>
                      <p className="text-sm text-muted-foreground">{component.batch_variety}</p>
                    </div>
                    <div className="flex gap-2">
                      {component.percentage !== null && (
                        <Badge variant="secondary">{component.percentage}%</Badge>
                      )}
                      {component.volume_liters !== null && (
                        <Badge variant="outline">{component.volume_liters}L</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Notes</Label>
              {!isEditingNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNotes(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this blend..."
                  rows={4}
                  maxLength={1000}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotes(blend.notes || "");
                      setIsEditingNotes(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4 min-h-[100px]">
                <p className="text-sm whitespace-pre-wrap">
                  {blend.notes || "No notes added yet."}
                </p>
              </div>
            )}
          </div>

          {/* Created Date */}
          <div className="text-sm text-muted-foreground">
            Created: {new Date(blend.created_at).toLocaleString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
