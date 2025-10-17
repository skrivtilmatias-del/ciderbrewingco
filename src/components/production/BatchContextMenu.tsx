import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { STAGES } from "@/constants/ciderStages";
import {
  FileText,
  Eye,
  QrCode,
  Printer,
  Download,
  Copy,
  FileStack,
  Archive,
  FileDown,
  Wine,
  BarChart3,
  History,
  ListChecks,
  MoreVertical,
} from "lucide-react";
import type { Batch } from "@/components/BatchCard";

interface BatchContextMenuProps {
  batch: Batch;
  children: React.ReactNode;
  onUpdateStage?: (batchId: string, newStage: string) => void;
  onAddNote?: (batchId: string, note: string) => void;
  onViewDetails?: (batch: Batch) => void;
  onClone?: (batch: Batch) => void;
  onArchive?: (batchId: string) => void;
  onExport?: (batch: Batch) => void;
  disabled?: boolean;
}

export const BatchContextMenu = ({
  batch,
  children,
  onUpdateStage,
  onAddNote,
  onViewDetails,
  onClone,
  onArchive,
  onExport,
  disabled = false,
}: BatchContextMenuProps) => {
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const batchUrl = `${window.location.origin}/b/${batch.id}`;

  const handleCopyBatchId = () => {
    navigator.clipboard.writeText(batch.id);
    toast({
      title: "Copied",
      description: "Batch ID copied to clipboard",
    });
  };

  const handleCopyBatchUrl = () => {
    navigator.clipboard.writeText(batchUrl);
    toast({
      title: "Copied",
      description: "Batch URL copied to clipboard",
    });
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-${batch.id}`);
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.download = `${batch.name.replace(/\s+/g, "-")}-QR.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast({
          title: "Downloaded",
          description: "QR code downloaded successfully",
        });
      });
    };

    img.src = url;
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote?.(batch.id, noteText);
      setNoteText("");
      setShowNoteDialog(false);
      toast({
        title: "Note added",
        description: "Note has been added to the batch",
      });
    }
  };

  const handleStageUpdate = (newStage: string) => {
    onUpdateStage?.(batch.id, newStage);
  };

  const handleArchive = () => {
    onArchive?.(batch.id);
    setShowArchiveDialog(false);
    toast({
      title: "Archived",
      description: "Batch has been archived",
    });
  };

  const handleClone = () => {
    onClone?.(batch);
    toast({
      title: "Batch cloned",
      description: "Edit the cloned batch and save",
    });
  };

  const handleExport = () => {
    onExport?.(batch);
  };

  const handlePrint = () => {
    setShowPrintDialog(true);
    // Navigate to print labels page with batch ID
    setTimeout(() => {
      window.open(`/print-labels?batch=${batch.id}`, "_blank");
      setShowPrintDialog(false);
    }, 500);
  };

  const isArchived = batch.currentStage === "Complete";

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger disabled={disabled} asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 bg-background/95 backdrop-blur-sm border shadow-lg">
          {/* Quick Actions */}
          <ContextMenuItem onClick={() => onViewDetails?.(batch)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
            <span className="ml-auto text-xs text-muted-foreground">Enter</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => setShowNoteDialog(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Add Note
            <span className="ml-auto text-xs text-muted-foreground">N</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Stage Updates */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ListChecks className="mr-2 h-4 w-4" />
              Update Stage
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {STAGES.map((stage) => (
                <ContextMenuItem
                  key={stage}
                  onClick={() => handleStageUpdate(stage)}
                  disabled={batch.currentStage === stage}
                >
                  {stage}
                  {batch.currentStage === stage && (
                    <span className="ml-auto text-xs">Current</span>
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* QR & Print */}
          <ContextMenuItem onClick={() => setShowQRDialog(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            View QR Code
            <span className="ml-auto text-xs text-muted-foreground">Q</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Label
            <span className="ml-auto text-xs text-muted-foreground">⌘P</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleDownloadQR}>
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Copy Actions */}
          <ContextMenuItem onClick={handleCopyBatchId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Batch ID
            <span className="ml-auto text-xs text-muted-foreground">⌘C</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleCopyBatchUrl}>
            <FileText className="mr-2 h-4 w-4" />
            Copy Batch URL
            <span className="ml-auto text-xs text-muted-foreground">⌘⇧C</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Advanced Actions */}
          <ContextMenuItem onClick={handleClone}>
            <FileStack className="mr-2 h-4 w-4" />
            Clone Batch
            <span className="ml-auto text-xs text-muted-foreground">C</span>
          </ContextMenuItem>

          {!isArchived && (
            <ContextMenuItem
              onClick={() => setShowArchiveDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Batch
              <span className="ml-auto text-xs text-muted-foreground">Del</span>
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          {/* Navigation */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <MoreVertical className="mr-2 h-4 w-4" />
              More Actions
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem>
                <Wine className="mr-2 h-4 w-4" />
                Use in Blend
              </ContextMenuItem>
              <ContextMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </ContextMenuItem>
              <ContextMenuItem>
                <History className="mr-2 h-4 w-4" />
                View History
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
            <span className="ml-auto text-xs text-muted-foreground">⌘E</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch QR Code</DialogTitle>
            <DialogDescription>
              Scan to view batch details or share this QR code
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCode
                id={`qr-${batch.id}`}
                value={batchUrl}
                size={200}
                level="H"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {batch.name}
            </p>
            <div className="flex gap-2 w-full">
              <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handlePrint} variant="default" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note to {batch.name}</DialogTitle>
            <DialogDescription>
              Add observations or notes about this batch
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the batch as complete and move it to the archive.
              You can still view it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opening Print Dialog</DialogTitle>
            <DialogDescription>
              Preparing labels for printing...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
