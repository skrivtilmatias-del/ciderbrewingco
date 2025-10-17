import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { STAGES } from "@/constants/ciderStages";
import type { Batch } from "@/components/BatchCard";

interface SkipStageDialogProps {
  batch: Batch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targetStage: string, reason: string) => void;
}

/**
 * SkipStageDialog - Allow skipping stages with required justification
 * 
 * Warns user about skipping stages and requires a reason
 */
export const SkipStageDialog = ({
  batch,
  open,
  onOpenChange,
  onConfirm,
}: SkipStageDialogProps) => {
  const [targetStage, setTargetStage] = useState<string>("");
  const [reason, setReason] = useState("");

  // Filter out completed stage and current stage
  const availableStages = [...STAGES, "Complete"].filter(
    stage => stage !== batch.currentStage
  );

  const handleConfirm = () => {
    if (targetStage && reason.trim()) {
      onConfirm(targetStage, reason.trim());
      setTargetStage("");
      setReason("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setTargetStage("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Skip Production Stage?
          </DialogTitle>
          <DialogDescription>
            Skipping stages is unusual and should be documented. Please select the target stage and provide a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-600">
              This action will skip normal production stages. Make sure this is intentional.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="target-stage">Jump to Stage</Label>
            <Select value={targetStage} onValueChange={setTargetStage}>
              <SelectTrigger id="target-stage">
                <SelectValue placeholder="Select target stage..." />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skip-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="skip-reason"
              placeholder="Why are you skipping stages? (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be logged in the batch history for audit purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!targetStage || !reason.trim()}
            variant="default"
          >
            Confirm Skip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
