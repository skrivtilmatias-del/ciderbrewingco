import { useEffect } from "react";
import type { Batch } from "@/components/BatchCard";

interface BatchKeyboardShortcutsProps {
  selectedBatch: Batch | null;
  onUpdateStage?: (batchId: string, newStage: string) => void;
  onAddNote?: (batchId: string) => void;
  onViewDetails?: (batch: Batch) => void;
  onExport?: (batch: Batch) => void;
  onPrint?: (batch: Batch) => void;
}

export const useBatchKeyboardShortcuts = ({
  selectedBatch,
  onUpdateStage,
  onAddNote,
  onViewDetails,
  onExport,
  onPrint,
}: BatchKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if a batch is selected
      if (!selectedBatch) return;

      // Check for modifier keys
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // Prevent default for our shortcuts
      const preventDefault = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      // N - Add Note
      if (e.key === "n" && !isCtrl && !isShift) {
        preventDefault();
        onAddNote?.(selectedBatch.id);
        return;
      }

      // Enter - View Details
      if (e.key === "Enter" && !isCtrl && !isShift) {
        preventDefault();
        onViewDetails?.(selectedBatch);
        return;
      }

      // Q - View QR Code (handled by context menu)
      if (e.key === "q" && !isCtrl && !isShift) {
        preventDefault();
        // Trigger context menu programmatically
        return;
      }

      // Ctrl+P - Print
      if (e.key === "p" && isCtrl) {
        preventDefault();
        onPrint?.(selectedBatch);
        return;
      }

      // Ctrl+E - Export
      if (e.key === "e" && isCtrl) {
        preventDefault();
        onExport?.(selectedBatch);
        return;
      }

      // Ctrl+C - Copy Batch ID (handled by browser)
      // Ctrl+Shift+C - Copy Batch URL (handled by browser)
      // Ctrl+Shift+D - Clone (handled by browser)
      // Del - Archive (handled by browser)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBatch, onUpdateStage, onAddNote, onViewDetails, onExport, onPrint]);
};
