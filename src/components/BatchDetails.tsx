import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Apple, Droplets, Clock, Wine, Calendar, Beaker, CheckCircle2, FlaskConical, Package, Pencil, Save } from "lucide-react";
import { Batch } from "./BatchCard";
import { StageProgressionCard } from "./StageProgressionCard";
import { ImageUpload } from "./ImageUpload";
import { STAGES } from "@/constants/ciderStages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorHandler";

const getStageIcon = (stage: string) => {
  if (stage.includes('Harvest') || stage.includes('Washing')) return Apple;
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return Droplets;
  if (stage.includes('Aging') || stage.includes('Conditioning')) return Clock;
  if (stage.includes('Bottling') || stage.includes('Packaging')) return Wine;
  if (stage.includes('Lab') || stage.includes('Testing') || stage.includes('QA')) return FlaskConical;
  if (stage.includes('Complete')) return CheckCircle2;
  return Beaker;
};

const getStageColor = (stage: string) => {
  if (stage === 'Complete') return 'bg-muted';
  if (stage.includes('Harvest')) return 'bg-success';
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return 'bg-info';
  if (stage.includes('Aging') || stage.includes('Conditioning')) return 'bg-warning';
  if (stage.includes('Bottling')) return 'bg-accent';
  return 'bg-primary';
};

const getDisplayStageName = (stage: string) => {
  // Map technical stage names to display names matching the production stage buttons
  const pressingStages = ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'];
  const fermentationStages = ['Pitching & Fermentation', 'Cold Crash'];
  const ageingStages = ['Malolactic', 'Stabilisation/Finings', 'Racking'];
  const bottlingStages = ['Blending', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'];
  
  if (pressingStages.includes(stage)) return 'Pressing';
  if (fermentationStages.includes(stage)) return 'Fermentation';
  if (ageingStages.includes(stage)) return 'Ageing';
  if (bottlingStages.includes(stage)) return 'Bottling';
  
  return stage; // Keep original for 'Complete' and any other stages
};

const allStages = [...STAGES, 'Complete'];

interface BatchDetailsProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStage: (batchId: string, newStage: Batch["currentStage"]) => void;
  onBatchUpdated?: () => void;
}

export const BatchDetails = ({ batch, open, onOpenChange, onUpdateStage, onBatchUpdated }: BatchDetailsProps) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(batch?.notes || "");
  const [attachments, setAttachments] = useState<string[]>(batch?.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [batchName, setBatchName] = useState(batch?.name || "");
  const [variety, setVariety] = useState(batch?.variety || "");
  const [volume, setVolume] = useState(batch?.volume.toString() || "");
  const [startDate, setStartDate] = useState(batch?.startDate || "");

  useEffect(() => {
    if (batch) {
      setBatchName(batch.name);
      setVariety(batch.variety);
      setVolume(batch.volume.toString());
      setStartDate(batch.startDate);
      setNotes(batch.notes || "");
      setAttachments(batch.attachments || []);
    }
  }, [batch]);

  if (!batch) return null;

  const currentStageIndex = allStages.indexOf(batch.currentStage);
  const StageIcon = getStageIcon(batch.currentStage);
  const stageColor = getStageColor(batch.currentStage);

  const handleAdvanceStage = () => {
    if (currentStageIndex < allStages.length - 1) {
      const nextStage = allStages[currentStageIndex + 1] as Batch["currentStage"];
      onUpdateStage(batch.id, nextStage);
    }
  };

  const handleSkipToStage = (stage: Batch["currentStage"]) => {
    onUpdateStage(batch.id, stage);
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("batches")
        .update({ notes: notes.trim() || null })
        .eq("id", batch.id);

      if (error) throw error;

      toast.success("Notes updated successfully");
      setIsEditingNotes(false);
      if (onBatchUpdated) onBatchUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("batches")
        .update({ 
          name: batchName.trim(),
          variety: variety.trim(),
          volume: parseFloat(volume),
          started_at: startDate
        })
        .eq("id", batch.id);

      if (error) throw error;

      toast.success("Batch details updated successfully");
      setIsEditingDetails(false);
      if (onBatchUpdated) onBatchUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl sm:text-2xl">{batch.name}</DialogTitle>
            {!isEditingDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDetails(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Details
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditingDetails ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="batchName" className="text-sm font-medium">Batch Name</Label>
                <Input
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="variety" className="text-sm font-medium">Apple Variety</Label>
                <Input
                  id="variety"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volume" className="text-sm font-medium">Volume (L)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate.split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchName(batch.name);
                    setVariety(batch.variety);
                    setVolume(batch.volume.toString());
                    setStartDate(batch.startDate);
                    setIsEditingDetails(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveDetails} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Apple Variety</p>
                  <p className="text-lg font-medium">{batch.variety}</p>
                </div>
                <Badge className={`${stageColor} text-white`}>
                  <StageIcon className="w-4 h-4 mr-1" />
                  {getDisplayStageName(batch.currentStage)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Beaker className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Volume</span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold">{batch.volume}L</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Started</span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold">
                    {new Date(batch.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{batch.progress}%</span>
            </div>
            <Progress value={batch.progress} className="h-3" />
          </div>

          {/* Editable Notes Section */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Notes</p>
              {!isEditingNotes ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotes(batch.notes || "");
                    setIsEditingNotes(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotes(batch.notes || "");
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
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this batch..."
                  rows={4}
                  className="w-full"
                />
                <ImageUpload
                  images={attachments}
                  onImagesChange={setAttachments}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {batch.notes || "No notes yet. Click Edit to add notes."}
                </p>
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
          </div>

          {/* Stage Progression Card */}
          <StageProgressionCard
            batch={batch}
            onAdvanceStage={handleAdvanceStage}
            onSkipToStage={handleSkipToStage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
