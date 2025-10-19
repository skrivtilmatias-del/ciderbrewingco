import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Smile } from "lucide-react";
import type { Batch } from "@/components/BatchCard";

interface QuickNoteDialogProps {
  batch: Batch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: string) => void;
}

const DRAFT_KEY_PREFIX = 'cidertrack_note_draft_';

/**
 * QuickNoteDialog - Fast note entry for batches
 * 
 * Features:
 * - Auto-focus textarea on open
 * - Auto-save draft to localStorage
 * - Keyboard shortcut (Cmd/Ctrl + Enter to save)
 * - Draft recovery on accidental close
 */
export const QuickNoteDialog = ({
  batch,
  open,
  onOpenChange,
  onSave,
}: QuickNoteDialogProps) => {
  const [note, setNote] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const draftKey = `${DRAFT_KEY_PREFIX}${batch.id}`;

  // Load draft when dialog opens
  useEffect(() => {
    if (open) {
      try {
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          setNote(draft);
        }
      } catch {
        // Silent fail - not critical
      }
      
      
      // Auto-focus textarea
      setTimeout(() => {
        noteInputRef.current?.focus();
      }, 100);
    }
  }, [open, draftKey]);

  // Auto-save draft
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (note.trim()) {
        try {
          localStorage.setItem(draftKey, note);
        } catch {
          // Silent fail - not critical
        }
      }
    }, 2000); // Auto-save after 2 seconds

    return () => clearTimeout(timer);
  }, [note, open, draftKey]);

  const handleSave = () => {
    if (note.trim()) {
      onSave(note.trim());
      setNote("");
      
      // Clear draft
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Silent fail - not critical
      }
      
      
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleCancel = () => {
    setNote("");
    onOpenChange(false);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = noteInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = note.substring(0, start) + emoji + note.substring(end);
    
    setNote(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  // Common emojis for cider making
  const commonEmojis = ['🍎', '🍺', '✅', '⚠️', '📊', '🔬', '🌡️', '💧', '👍', '👎'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note to {batch.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            ref={noteInputRef}
            placeholder="What's happening with this batch?"
            className="min-h-[120px] resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmoji(!showEmoji)}
              type="button"
            >
              <Smile className="w-4 h-4 mr-2" />
              Emoji
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement photo attachment */}}
              type="button"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photo
            </Button>
          </div>

          {showEmoji && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg animate-in fade-in duration-200">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition-transform"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
            <span className="ml-2 text-xs text-muted-foreground">Esc</span>
          </Button>
          <Button onClick={handleSave} disabled={!note.trim()}>
            Save Note
            <span className="ml-2 text-xs text-muted-foreground">⌘+Enter</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
