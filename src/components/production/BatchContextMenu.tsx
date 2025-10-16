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
import { toast } from "sonner";
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

  const batchUrl = `${window.location.origin}/b/${batch.id}`;

  const handleCopyBatchId = () => {
    navigator.clipboard.writeText(batch.id);
    toast.success("Batch ID copied to clipboard");
  };

  const handleCopyBatchUrl = () => {
    navigator.clipboard.writeText(batchUrl);
    toast.success("Batch URL copied to clipboard");
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
        toast.success("QR code downloaded");
      });
    };

    img.src = url;
  };

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    onAddNote?.(batch.id, noteText);
    setNoteText("");
    setShowNoteDialog(false);
    toast.success("Note added successfully");
  };

  const handleStageUpdate = (newStage: string) => {
    onUpdateStage?.(batch.id, newStage);
    toast.success(`Stage updated to ${newStage}`);
  };

  const handleArchive = () => {
    onArchive?.(batch.id);
    setShowArchiveDialog(false);
    toast.success("Batch archived");
  };

  const handleClone = () => {
    onClone?.(batch);
    toast.success("Batch cloned - edit and save");
  };

  const handleExport = () => {
    onExport?.(batch);
    toast.success("Batch data exported");
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
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <ListChecks className="w-4 h-4" />
              <span>Update Stage</span>
              <kbd className="ml-auto text-xs text-muted-foreground">U</kbd>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-background/95 backdrop-blur-sm">
              {STAGES.map((stage) => (
                <ContextMenuItem
                  key={stage}
                  onClick={() => handleStageUpdate(stage)}
                  disabled={isArchived}
                  className={batch.currentStage === stage ? "bg-primary/10" : ""}
                >
                  {stage}
                  {batch.currentStage === stage && (
                    <span className="ml-auto text-xs text-primary">Current</span>
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem
            onClick={() => setShowNoteDialog(true)}
            disabled={isArchived}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Add Note</span>
            <kbd className="ml-auto text-xs text-muted-foreground">N</kbd>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => onViewDetails?.(batch)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Enter</kbd>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => setShowQRDialog(true)}
            className="gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>View QR Code</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Q</kbd>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Label Actions */}
          <ContextMenuItem onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Label</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+P</kbd>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleDownloadQR} className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download QR Code</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+D</kbd>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleCopyBatchId} className="gap-2">
            <Copy className="w-4 h-4" />
            <span>Copy Batch ID</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+C</kbd>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleCopyBatchUrl} className="gap-2">
            <Copy className="w-4 h-4" />
            <span>Copy Batch URL</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+C</kbd>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Management */}
          <ContextMenuItem onClick={handleClone} className="gap-2">
            <FileStack className="w-4 h-4" />
            <span>Clone Batch</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+D</kbd>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => setShowArchiveDialog(true)}
            disabled={isArchived}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            <span>Archive Batch</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Del</kbd>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleExport} className="gap-2">
            <FileDown className="w-4 h-4" />
            <span>Export Data</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+E</kbd>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Navigation */}
          <ContextMenuItem
            onClick={() => {
              window.location.hash = "#blending";
              toast.info("Navigate to Blending tab");
            }}
            className="gap-2"
          >
            <Wine className="w-4 h-4" />
            <span>Go to Blending</span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              window.location.hash = "#analytics";
              toast.info("View batch analytics");
            }}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics</span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              toast.info("View batch history");
            }}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            <span>View History</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view batch details
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                id={`qr-${batch.id}`}
                value={batchUrl}
                size={200}
                level="H"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold">{batch.name}</p>
              <p className="text-sm text-muted-foreground">{batch.variety}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
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
            <DialogTitle>Add Quick Note</DialogTitle>
            <DialogDescription>
              Add a note to {batch.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{batch.name}"? Archived batches cannot be
              modified but can still be viewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
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
