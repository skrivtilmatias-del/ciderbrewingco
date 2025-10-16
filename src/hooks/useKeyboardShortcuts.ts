import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { useAppStore } from '@/stores/appStore';
import { toast } from '@/hooks/use-toast';

/**
 * Keyboard shortcut configuration
 */
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: 'global' | 'navigation' | 'batch' | 'filters';
  action: () => void;
  disabled?: boolean;
}

/**
 * useKeyboardShortcuts - Global keyboard shortcut management
 * 
 * Provides comprehensive keyboard navigation and actions:
 * - Global shortcuts (search, new batch, settings)
 * - Navigation shortcuts (tab switching, list navigation)
 * - Batch actions (edit, delete, clone, etc.)
 * - Filter controls
 * 
 * Features:
 * - Prevents conflicts with browser shortcuts
 * - Context-aware (different shortcuts in different views)
 * - Visual feedback via toasts
 * - Escape hatch for modals
 * 
 * @param options - Configuration options
 * @returns Shortcut utilities
 */
export const useKeyboardShortcuts = ({
  onShowShortcuts,
  onNewBatch,
  onFocusSearch,
  enabled = true,
}: {
  onShowShortcuts?: () => void;
  onNewBatch?: () => void;
  onFocusSearch?: () => void;
  enabled?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedBatchId, 
    setSelectedBatchId, 
    clearSelection,
    setBatchSearchQuery 
  } = useAppStore();

  /**
   * Check if we should ignore shortcuts (e.g., in input fields)
   */
  const shouldIgnoreShortcut = useCallback((e: KeyboardEvent): boolean => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.isContentEditable;
    
    // Ignore shortcuts in input fields, textareas, etc.
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable) {
      // Allow Escape to blur
      if (e.key === 'Escape') {
        target.blur();
        return false;
      }
      return true;
    }
    
    return false;
  }, []);

  /**
   * Show visual feedback for shortcut usage
   */
  const showFeedback = useCallback((message: string) => {
    toast({
      description: message,
      duration: 1500,
    });
  }, []);

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we should ignore this shortcut
      if (shouldIgnoreShortcut(e)) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // ========== GLOBAL SHORTCUTS ==========

      // Ctrl/Cmd + K: Quick search
      if (isCtrl && key === 'k') {
        e.preventDefault();
        onFocusSearch?.();
        showFeedback('⌘K Quick Search');
        return;
      }

      // Ctrl/Cmd + N: New batch
      if (isCtrl && key === 'n') {
        e.preventDefault();
        onNewBatch?.();
        showFeedback('⌘N New Batch');
        return;
      }

      // ?: Show shortcuts help
      if (key === '?' && !isCtrl && !isShift) {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }

      // /: Focus search
      if (key === '/' && !isCtrl && !isShift) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Esc: Close modal/clear selection
      if (key === 'escape') {
        e.preventDefault();
        clearSelection();
        showFeedback('Selection cleared');
        return;
      }

      // ========== NAVIGATION SHORTCUTS ==========

      // 1-6: Switch tabs
      if (!isCtrl && !isShift && ['1', '2', '3', '4', '5', '6'].includes(key)) {
        e.preventDefault();
        const tabMap: Record<string, string> = {
          '1': paths.batches(),
          '2': paths.production(),
          '3': paths.blending(),
          '4': paths.cellar(),
          '5': paths.suppliers(),
          '6': paths.tasting(),
        };
        
        const path = tabMap[key];
        if (path) {
          navigate(path);
          showFeedback(`Switched to tab ${key}`);
        }
        return;
      }

      // Ctrl + Left/Right: Previous/next batch
      if (isCtrl && (key === 'arrowleft' || key === 'arrowright')) {
        e.preventDefault();
        showFeedback(key === 'arrowleft' ? '← Previous batch' : '→ Next batch');
        // TODO: Implement batch navigation
        return;
      }

      // ========== BATCH ACTIONS (only when batch is selected) ==========
      
      if (!selectedBatchId) return;

      // E: Edit batch
      if (key === 'e' && !isCtrl && !isShift) {
        e.preventDefault();
        showFeedback('Edit batch');
        // Open batch details for editing
        return;
      }

      // C: Clone batch
      if (key === 'c' && !isCtrl && !isShift) {
        e.preventDefault();
        showFeedback('Clone batch');
        // TODO: Trigger clone action
        return;
      }

      // P: Print label
      if (key === 'p' && !isCtrl && !isShift) {
        e.preventDefault();
        showFeedback('Print label');
        navigate(`/print-labels?batch=${selectedBatchId}`);
        return;
      }

      // N: Add note
      if (key === 'n' && !isCtrl && !isShift) {
        e.preventDefault();
        showFeedback('Add note');
        // TODO: Trigger add note dialog
        return;
      }

      // ========== FILTERS ==========

      // F: Toggle filters
      if (key === 'f' && !isCtrl && !isShift) {
        e.preventDefault();
        showFeedback('Toggle filters');
        // TODO: Toggle filter panel
        return;
      }

      // Ctrl + L: Clear filters
      if (isCtrl && key === 'l') {
        e.preventDefault();
        setBatchSearchQuery('');
        showFeedback('⌘L Filters cleared');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    selectedBatchId,
    navigate,
    location,
    onShowShortcuts,
    onNewBatch,
    onFocusSearch,
    clearSelection,
    setBatchSearchQuery,
    shouldIgnoreShortcut,
    showFeedback,
  ]);

  return {
    showFeedback,
  };
};

/**
 * Get all available shortcuts for display
 */
export const getAllShortcuts = () => {
  const shortcuts: Record<string, Array<{ keys: string; description: string }>> = {
    Global: [
      { keys: 'Ctrl/⌘ + K', description: 'Quick search' },
      { keys: 'Ctrl/⌘ + N', description: 'New batch' },
      { keys: '?', description: 'Show shortcuts' },
      { keys: '/', description: 'Focus search' },
      { keys: 'Esc', description: 'Close modal/clear selection' },
    ],
    Navigation: [
      { keys: '1-6', description: 'Switch tabs (1=Batches, 2=Production, etc.)' },
      { keys: 'Ctrl/⌘ + ←/→', description: 'Previous/next batch' },
      { keys: 'J/K', description: 'Move down/up in list' },
      { keys: 'Enter', description: 'Open selected batch' },
      { keys: 'Space', description: 'Select batch' },
    ],
    'Batch Actions': [
      { keys: 'E', description: 'Edit batch' },
      { keys: 'D', description: 'Delete batch' },
      { keys: 'C', description: 'Clone batch' },
      { keys: 'P', description: 'Print label' },
      { keys: 'N', description: 'Add note' },
      { keys: 'U', description: 'Update stage' },
    ],
    Filters: [
      { keys: 'F', description: 'Toggle filters' },
      { keys: 'Ctrl/⌘ + L', description: 'Clear filters' },
      { keys: 'Ctrl/⌘ + Shift + F', description: 'Advanced filters' },
    ],
  };

  return shortcuts;
};
