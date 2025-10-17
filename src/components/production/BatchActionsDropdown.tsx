import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Eye,
  FileText,
  ListChecks,
  QrCode,
  Printer,
  Download,
  Copy,
  FileStack,
  Archive,
  FileDown,
  AlertTriangle,
  Check,
} from "lucide-react";
import { STAGES } from "@/constants/ciderStages";
import { QuickNoteDialog } from "./QuickNoteDialog";
import { SkipStageDialog } from "./SkipStageDialog";
import type { Batch } from "@/components/BatchCard";
import { useToast } from "@/hooks/use-toast";

interface BatchActionsDropdownProps {
  batch: Batch;
  onUpdateStage?: (batchId: string, newStage: string) => void;
  onAddNote?: (batchId: string, note: string) => void;
  onViewDetails?: () => void;
  onClone?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
}

/**
 * BatchActionsDropdown - Three-dot menu button for batch actions
 * 
 * Alternative to context menu, always visible
 */
export const BatchActionsDropdown = ({
  batch,
  onUpdateStage,
  onAddNote,
  onViewDetails,
  onClone,
  onArchive,
  onExport,
}: BatchActionsDropdownProps) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const { toast } = useToast();

  const handleCopyId = () => {
    navigator.clipboard.writeText(batch.id);
    toast({
      title: "Copied",
      description: "Batch ID copied to clipboard",
    });
  };

  const handleStageUpdate = (newStage: string) => {
    if (onUpdateStage) {
      onUpdateStage(batch.id, newStage);
    }
  };

  const handleSkipStage = (targetStage: string, reason: string) => {
    if (onUpdateStage) {
      onUpdateStage(batch.id, targetStage);
      toast({
        title: "Stage Skipped",
        description: `Jumped to ${targetStage}. Reason: ${reason}`,
        variant: "default",
      });
    }
  };

  const handleAddNote = (note: string) => {
    if (onAddNote) {
      onAddNote(batch.id, note);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Quick Actions */}
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
            <span className="ml-auto text-xs text-muted-foreground">Enter</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowNoteDialog(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Add Note
            <span className="ml-auto text-xs text-muted-foreground">N</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Stage Updates */}
          <DropdownMenuLabel>Stage Management</DropdownMenuLabel>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListChecks className="mr-2 h-4 w-4" />
              Update Stage
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {STAGES.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => handleStageUpdate(stage)}
                  disabled={batch.currentStage === stage}
                >
                  {batch.currentStage === stage && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {stage}
                  {batch.currentStage === stage && (
                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowSkipDialog(true)}
                className="text-amber-600 focus:text-amber-600"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Skip to Any Stage...
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Labels & QR */}
          <DropdownMenuLabel>Labels</DropdownMenuLabel>
          
          <DropdownMenuItem>
            <QrCode className="mr-2 h-4 w-4" />
            View QR Code
            <span className="ml-auto text-xs text-muted-foreground">Q</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Printer className="mr-2 h-4 w-4" />
            Print Label
            <span className="ml-auto text-xs text-muted-foreground">⌘P</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Batch ID
            <span className="ml-auto text-xs text-muted-foreground">⌘C</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Management */}
          <DropdownMenuLabel>Management</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={onClone}>
            <FileStack className="mr-2 h-4 w-4" />
            Clone Batch
            <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
          </DropdownMenuItem>

          {batch.currentStage !== 'Complete' && (
            <DropdownMenuItem
              onClick={onArchive}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Batch
              <span className="ml-auto text-xs text-muted-foreground">Del</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={onExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
            <span className="ml-auto text-xs text-muted-foreground">⌘E</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <QuickNoteDialog
        batch={batch}
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        onSave={handleAddNote}
      />

      <SkipStageDialog
        batch={batch}
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        onConfirm={handleSkipStage}
      />
    </>
  );
};
