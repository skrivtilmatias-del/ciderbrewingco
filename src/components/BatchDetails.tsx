import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Apple, Droplets, Clock, Wine, Calendar, Beaker, CheckCircle2, FlaskConical, Package, Pencil, Save, Activity } from "lucide-react";
import { Batch } from "./BatchCard";
import { StageProgressionCard } from "./StageProgressionCard";
import { ImageUpload } from "./ImageUpload";
import { STAGES } from "@/constants/ciderStages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorHandler";

const getStageIcon = (stage?: string) => {
  if (!stage) return Beaker;
  if (stage.includes('Harvest') || stage.includes('Washing')) return Apple;
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return Droplets;
  if (stage.includes('Aging') || stage.includes('Conditioning')) return Clock;
  if (stage.includes('Bottling') || stage.includes('Packaging')) return Wine;
  if (stage.includes('Lab') || stage.includes('Testing') || stage.includes('QA')) return FlaskConical;
  if (stage.includes('Complete')) return CheckCircle2;
  return Beaker;
};

const getStageColor = (stage?: string) => {
  if (!stage) return 'bg-primary';
  if (stage === 'Complete') return 'bg-muted';
  if (stage.includes('Harvest')) return 'bg-success';
  if (stage.includes('Fermentation') || stage.includes('Pitching')) return 'bg-info';
  if (stage.includes('Aging') || stage.includes('Conditioning')) return 'bg-warning';
  if (stage.includes('Bottling')) return 'bg-accent';
  return 'bg-primary';
};

const getDisplayStageName = (stage?: string) => {
  if (!stage) return 'Unknown';
  // Map technical stage names to display names matching the production stage buttons
  const pressingStages = ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'];
  const fermentationStages = ['Enzymes', 'Pitching', 'Fermentation', 'Cold Crash'];
  const ageingStages = ['Racking', 'Malolactic', 'Stabilisation'];
  const bottlingStages = ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'];
  
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
  onGoToProduction?: (batch: Batch) => void;
}

export const BatchDetails = ({ batch, open, onOpenChange, onUpdateStage, onBatchUpdated, onGoToProduction }: BatchDetailsProps) => {
  // Add null guard at the top
  if (!batch) return null;

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(batch?.notes || "");
  const [attachments, setAttachments] = useState<string[]>(batch?.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [batchName, setBatchName] = useState(batch?.name || "");
  const [variety, setVariety] = useState(batch?.variety || "");
  const [appleOrigin, setAppleOrigin] = useState(batch?.apple_origin || "");
  const [volume, setVolume] = useState(batch?.volume?.toString() || "");
  const [startDate, setStartDate] = useState(batch?.startDate || "");
  const [yeastType, setYeastType] = useState(batch?.yeast_type || "");
  const [targetOG, setTargetOG] = useState(batch?.target_og?.toString() || "");
  const [targetFG, setTargetFG] = useState(batch?.target_fg?.toString() || "");
  const [targetPH, setTargetPH] = useState(batch?.target_ph?.toString() || "");
  const [targetEndPH, setTargetEndPH] = useState(batch?.target_end_ph?.toString() || "");

  useEffect(() => {
    if (batch) {
      setBatchName(batch.name || "");
      setVariety(batch.variety || "");
      setAppleOrigin(batch.apple_origin || "");
      setVolume(batch.volume?.toString() || "");
      setStartDate(batch.startDate || "");
      setYeastType(batch.yeast_type || "");
      setTargetOG(batch.target_og?.toString() || "");
      setTargetFG(batch.target_fg?.toString() || "");
      setTargetPH(batch.target_ph?.toString() || "");
      setTargetEndPH(batch.target_end_ph?.toString() || "");
      setNotes(batch.notes || "");
      setAttachments(batch.attachments || []);
    }
  }, [batch]);

  const currentStageIndex = allStages.indexOf(batch?.currentStage || '');
  const StageIcon = getStageIcon(batch?.currentStage);
  const stageColor = getStageColor(batch?.currentStage);

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
        .update({ 
          notes: notes.trim() || null,
          attachments: attachments?.length > 0 ? attachments : null
        })
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
          apple_origin: appleOrigin.trim() || null,
          volume: parseFloat(volume),
          started_at: startDate,
          yeast_type: yeastType.trim() || null,
          target_og: targetOG ? parseFloat(targetOG) : null,
          target_fg: targetFG ? parseFloat(targetFG) : null,
          target_ph: targetPH ? parseFloat(targetPH) : null,
          target_end_ph: targetEndPH ? parseFloat(targetEndPH) : null
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
          <div className="flex items-center gap-3 pr-10">
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
              <div>
                <Label htmlFor="appleOrigin" className="text-sm font-medium">Apple Origin</Label>
                <Input
                  id="appleOrigin"
                  placeholder="e.g., Somerset Orchard"
                  value={appleOrigin}
                  onChange={(e) => setAppleOrigin(e.target.value)}
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
              
              <div>
                <Label htmlFor="yeastType" className="text-sm font-medium">Yeast Type</Label>
                <Input
                  id="yeastType"
                  placeholder="e.g., EC-1118, SafCider"
                  value={yeastType}
                  onChange={(e) => setYeastType(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetOG" className="text-sm font-medium">OG</Label>
                  <Input
                    id="targetOG"
                    type="number"
                    step="0.001"
                    placeholder="e.g., 1.050"
                    value={targetOG}
                    onChange={(e) => setTargetOG(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetFG" className="text-sm font-medium">FG</Label>
                  <Input
                    id="targetFG"
                    type="number"
                    step="0.001"
                    placeholder="e.g., 1.000"
                    value={targetFG}
                    onChange={(e) => setTargetFG(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetPH" className="text-sm font-medium">Start PH</Label>
                  <Input
                    id="targetPH"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 3.5"
                    value={targetPH}
                    onChange={(e) => setTargetPH(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetEndPH" className="text-sm font-medium">End PH</Label>
                  <Input
                    id="targetEndPH"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 3.8"
                    value={targetEndPH}
                    onChange={(e) => setTargetEndPH(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchName(batch?.name || "");
                    setVariety(batch?.variety || "");
                    setVolume(batch?.volume?.toString() || "");
                    setStartDate(batch?.startDate || "");
                    setYeastType(batch?.yeast_type || "");
                    setTargetOG(batch?.target_og?.toString() || "");
                    setTargetFG(batch?.target_fg?.toString() || "");
                    setTargetPH(batch?.target_ph?.toString() || "");
                    setTargetEndPH(batch?.target_end_ph?.toString() || "");
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <p className="text-sm text-muted-foreground">Apple Variety</p>
                    <p className="text-base sm:text-lg font-medium">{batch.variety}</p>
                  </div>
                  {batch.apple_origin && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                      <p className="text-sm text-muted-foreground">Apple Origin</p>
                      <p className="text-base sm:text-lg font-medium">{batch.apple_origin}</p>
                    </div>
                  )}
                </div>
                <Badge className={`${stageColor} text-white self-start sm:self-auto`}>
                  <StageIcon className="w-4 h-4 mr-1" />
                  {getDisplayStageName(batch.currentStage)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {batch.yeast_type && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FlaskConical className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Yeast Type</span>
                    </div>
                    <p className="text-lg sm:text-xl font-semibold">{batch.yeast_type}</p>
                  </div>
                )}
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

              {(batch.target_og || batch.target_fg || batch.target_ph || batch.target_end_ph) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t">
                  {batch.target_og && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OG</p>
                      <p className="text-sm font-semibold">{batch.target_og}</p>
                    </div>
                  )}
                  {batch.target_fg && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">FG</p>
                      <p className="text-sm font-semibold">{batch.target_fg}</p>
                    </div>
                  )}
                  {batch.target_ph && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Start PH</p>
                      <p className="text-sm font-semibold">{batch.target_ph}</p>
                    </div>
                  )}
                  {batch.target_end_ph && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">End PH</p>
                      <p className="text-sm font-semibold">{batch.target_end_ph}</p>
                    </div>
                  )}
                </div>
              )}
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
          <div className="bg-muted/50 p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">Notes</p>
              {!isEditingNotes ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotes(batch.notes || "");
                    setIsEditingNotes(true);
                  }}
                  className="h-7 text-xs"
                >
                  <Pencil className="h-3 w-3 mr-1" />
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
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="h-7 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this batch..."
                  rows={3}
                  className="w-full text-xs"
                />
                <ImageUpload
                  images={attachments}
                  onImagesChange={setAttachments}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {batch.notes || "No notes yet. Click Edit to add notes."}
                </p>
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attachments.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-border"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Go to Production Button */}
          {onGoToProduction && (
            <Button 
              onClick={() => onGoToProduction(batch)}
              className="w-full text-center"
              size="lg"
            >
              <Activity className="h-4 w-4 mr-2" />
              Go to Production
            </Button>
          )}

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
