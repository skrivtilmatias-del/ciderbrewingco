import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wine, Save, Edit, X, Minus } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
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
  bottles_75cl?: number;
  bottles_150cl?: number;
  attachments?: string[];
}

interface BlendBatchDetailsProps {
  blend: BlendBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlendUpdated: () => void;
}

export function BlendBatchDetails({ blend, open, onOpenChange, onBlendUpdated }: BlendBatchDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [blendName, setBlendName] = useState("");
  const [totalVolume, setTotalVolume] = useState("");
  const [bottles75cl, setBottles75cl] = useState("");
  const [bottles150cl, setBottles150cl] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (blend) {
      setBlendName(blend.name);
      setTotalVolume(blend.total_volume.toString());
      setBottles75cl((blend.bottles_75cl || 0).toString());
      setBottles150cl((blend.bottles_150cl || 0).toString());
      setNotes(blend.notes || "");
      setAttachments(blend.attachments || []);
      setIsEditing(false);
    }
  }, [blend]);

  const handleReduceBottle = async (bottleType: '75cl' | '150cl') => {
    if (!blend) return;
    
    const current75 = blend.bottles_75cl || 0;
    const current150 = blend.bottles_150cl || 0;
    
    if (bottleType === '75cl' && current75 <= 0) {
      toast.error("No 75cl bottles available");
      return;
    }
    
    if (bottleType === '150cl' && current150 <= 0) {
      toast.error("No 150cl bottles available");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({
          bottles_75cl: bottleType === '75cl' ? current75 - 1 : current75,
          bottles_150cl: bottleType === '150cl' ? current150 - 1 : current150,
        })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success(`Removed 1 bottle (${bottleType})`);
      onBlendUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleSave = async () => {
    if (!blend) return;
    
    if (!blendName.trim()) {
      toast.error("Blend name is required");
      return;
    }

    const volumeNum = parseFloat(totalVolume);
    if (isNaN(volumeNum) || volumeNum <= 0) {
      toast.error("Valid total volume is required");
      return;
    }

    const bottles75 = parseInt(bottles75cl) || 0;
    const bottles150 = parseInt(bottles150cl) || 0;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({ 
          name: blendName.trim(),
          total_volume: volumeNum,
          bottles_75cl: bottles75,
          bottles_150cl: bottles150,
          notes: notes.trim() || null,
          attachments: attachments.length > 0 ? attachments : null
        })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success("Blend updated successfully");
      setIsEditing(false);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="w-6 h-6 text-primary" />
              <DialogTitle className="text-2xl">{blend.name}</DialogTitle>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-4">
              <div>
                <Label htmlFor="blend-name">Blend Name</Label>
                <Input
                  id="blend-name"
                  value={blendName}
                  onChange={(e) => setBlendName(e.target.value)}
                  placeholder="Enter blend name"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total-volume">Total Volume (L)</Label>
                  <Input
                    id="total-volume"
                    type="number"
                    step="0.1"
                    value={totalVolume}
                    onChange={(e) => setTotalVolume(e.target.value)}
                    placeholder="Enter volume"
                  />
                </div>
                <div>
                  <Label htmlFor="bottles-75">Bottles 75cl</Label>
                  <Input
                    id="bottles-75"
                    type="number"
                    min="0"
                    value={bottles75cl}
                    onChange={(e) => setBottles75cl(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bottles-150">Bottles 150cl</Label>
                <Input
                  id="bottles-150"
                  type="number"
                  min="0"
                  value={bottles150cl}
                  onChange={(e) => setBottles150cl(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="blend-notes">Notes</Label>
                <Textarea
                  id="blend-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this blend..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div>
                <Label>Images</Label>
                <ImageUpload
                  images={attachments}
                  onImagesChange={setAttachments}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBlendName(blend.name);
                    setTotalVolume(blend.total_volume.toString());
                    setBottles75cl((blend.bottles_75cl || 0).toString());
                    setBottles150cl((blend.bottles_150cl || 0).toString());
                    setNotes(blend.notes || "");
                    setIsEditing(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Display mode */}
          {!isEditing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Total Volume</Label>
                  <p className="text-2xl font-bold mt-1">{blend.total_volume}L</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm text-muted-foreground">Bottles 75cl</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReduceBottle('75cl')}
                      disabled={(blend.bottles_75cl || 0) === 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold">{blend.bottles_75cl || 0}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm text-muted-foreground">Bottles 150cl</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReduceBottle('150cl')}
                    disabled={(blend.bottles_150cl || 0) === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-2xl font-bold">{blend.bottles_150cl || 0}</p>
              </div>
            </>
          )}

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

          {/* Notes - only show in display mode */}
          {!isEditing && (
            <div>
              <Label className="text-base font-semibold">Notes</Label>
              <div className="border border-border rounded-lg p-4 min-h-[100px] mt-2">
                <p className="text-sm whitespace-pre-wrap">
                  {blend.notes || "No notes added yet."}
                </p>
              </div>
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {attachments.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-border"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Created Date */}
          <div className="text-sm text-muted-foreground">
            Created: {new Date(blend.created_at).toLocaleString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
