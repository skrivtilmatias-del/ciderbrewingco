import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Apple, Droplets, Clock, Wine, Calendar, Beaker, CheckCircle2, FlaskConical, Package, Pencil, Save } from "lucide-react";
import { Batch } from "./BatchCard";
import { StageProgressionCard } from "./StageProgressionCard";
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
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{batch.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Apple Variety</p>
              <p className="text-lg font-medium">{batch.variety}</p>
            </div>
            <Badge className={`${stageColor} text-white`}>
              <StageIcon className="w-4 h-4 mr-1" />
              {batch.currentStage}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Beaker className="w-4 h-4" />
                <span className="text-sm">Volume</span>
              </div>
              <p className="text-xl font-semibold">{batch.volume}L</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Started</span>
              </div>
              <p className="text-xl font-semibold">
                {new Date(batch.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>

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
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this batch..."
                rows={4}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {batch.notes || "No notes yet. Click Edit to add notes."}
              </p>
            )}
          </div>

          {/* Stage Progression Card */}
          <StageProgressionCard
            batch={batch}
            onAdvanceStage={handleAdvanceStage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
