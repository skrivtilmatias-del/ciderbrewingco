# Batch Context Menu System

Comprehensive right-click menu system for batch cards providing instant access to common actions.

## Components

### 1. BatchContextMenu
**File:** `src/components/production/BatchContextMenu.tsx`

Right-click context menu for batch cards with full action support.

**Features:**
- Right-click activation (desktop)
- Long-press support (mobile with haptic feedback)
- Quick actions (View, Add Note, QR Code)
- Stage management submenu
- Label printing and QR generation
- Copy actions (ID, URL)
- Clone and archive functionality
- Export data

**Usage:**
```tsx
import { BatchContextMenu } from '@/components/production/BatchContextMenu';

<BatchContextMenu
  batch={batch}
  onUpdateStage={handleUpdateStage}
  onAddNote={handleAddNote}
  onViewDetails={() => setDetailsOpen(true)}
  onClone={handleClone}
  onArchive={handleArchive}
  onExport={handleExport}
>
  <BatchCard batch={batch} />
</BatchContextMenu>
```

### 2. BatchActionsDropdown
**File:** `src/components/production/BatchActionsDropdown.tsx`

Three-dot menu button alternative to context menu, always visible.

**Features:**
- Visible menu button (MoreVertical icon)
- Same actions as context menu
- Better for mobile/touch interfaces
- Keyboard shortcuts displayed
- Skip stage dialog integration

**Usage:**
```tsx
import { BatchActionsDropdown } from '@/components/production/BatchActionsDropdown';

<BatchActionsDropdown
  batch={batch}
  onUpdateStage={handleUpdateStage}
  onAddNote={handleAddNote}
  onViewDetails={() => navigate(`/batch/${batch.id}`)}
  onClone={handleClone}
  onArchive={handleArchive}
  onExport={handleExport}
/>
```

### 3. QuickNoteDialog
**File:** `src/components/production/QuickNoteDialog.tsx`

Fast note entry dialog with enhanced features.

**Features:**
- Auto-focus textarea on open
- Auto-save draft to localStorage (every 2 seconds)
- Draft recovery on accidental close
- Keyboard shortcut (⌘+Enter to save)
- Emoji picker with common cider-making emojis
- Photo attachment button (placeholder)

**Usage:**
```tsx
import { QuickNoteDialog } from '@/components/production/QuickNoteDialog';

const [noteDialogOpen, setNoteDialogOpen] = useState(false);

<QuickNoteDialog
  batch={batch}
  open={noteDialogOpen}
  onOpenChange={setNoteDialogOpen}
  onSave={(note) => {
    addBatchLog(batch.id, note);
  }}
/>
```

**Storage:**
- Draft key: `cidertrack_note_draft_${batchId}`
- Auto-clears on successful save
- Recovers draft on dialog reopen

### 4. SkipStageDialog
**File:** `src/components/production/SkipStageDialog.tsx`

Stage skipping with mandatory reason tracking.

**Features:**
- Warning alert about unusual action
- Stage selection dropdown
- Required reason field (mandatory)
- Audit trail logging
- Clear visual warnings

**Usage:**
```tsx
import { SkipStageDialog } from '@/components/production/SkipStageDialog';

const [skipDialogOpen, setSkipDialogOpen] = useState(false);

<SkipStageDialog
  batch={batch}
  open={skipDialogOpen}
  onOpenChange={setSkipDialogOpen}
  onConfirm={(targetStage, reason) => {
    updateBatchStage(batch.id, targetStage);
    logStageSkip(batch.id, targetStage, reason);
  }}
/>
```

### 5. BatchContextMenuGuide
**File:** `src/components/production/BatchContextMenuGuide.tsx`

Educational component showing how to use context menus.

**Features:**
- Shows different interaction methods
- Platform-specific tips (Desktop/Mobile)
- Always-available three-dot menu hint
- Dismissible info card

**Usage:**
```tsx
import { BatchContextMenuGuide } from '@/components/production/BatchContextMenuGuide';

// Add to production tab or above batch list
<BatchContextMenuGuide />
```

## Hooks

### useRecentActions
**File:** `src/hooks/useRecentActions.ts`

Track and manage recent batch actions with automatic cleanup.

**Features:**
- Stores last 3 actions per user
- Automatic expiry (24 hours)
- localStorage persistence
- Per-user tracking

**Usage:**
```tsx
import { useRecentActions } from '@/hooks/useRecentActions';

const { recentActions, trackAction, clearActions } = useRecentActions(userId);

// Track an action
trackAction({
  id: 'update_stage_fermentation',
  label: 'Moved to Fermentation',
  icon: 'ArrowRight',
  batchId: batch.id,
  batchName: batch.name,
});

// Display recent actions
{recentActions.map(action => (
  <MenuItem key={action.id}>
    <Icon name={action.icon} />
    {action.label}
    <span>{action.batchName}</span>
  </MenuItem>
))}
```

**Storage:**
- Key: `cidertrack_recent_actions_${userId}`
- Max actions: 3
- Expiry: 24 hours

### useBatchActions (Enhanced)
**File:** `src/hooks/production/useBatchActions.ts`

Centralized batch action handlers with optimistic updates.

**Features:**
- Optimistic UI updates
- Automatic rollback on error
- Toast notifications
- Query cache invalidation
- Progress calculation

**Available Actions:**
- `updateStage(batchId, newStage)` - Update batch stage
- `deleteBatch(batchId)` - Delete batch permanently
- `cloneBatch(batch)` - Clone batch with "(Copy)" suffix
- `archiveBatch(batchId)` - Mark batch as complete

**Usage:**
```tsx
import { useBatchActions } from '@/hooks/production/useBatchActions';

const { 
  updateStage, 
  cloneBatch, 
  archiveBatch,
  isUpdating 
} = useBatchActions();

// Update stage
await updateStage(batch.id, 'Fermentation');

// Clone batch
await cloneBatch(existingBatch);
```

## Keyboard Shortcuts

All menu items support keyboard shortcuts (shown in menu):

| Action | Shortcut | Description |
|--------|----------|-------------|
| View Details | `Enter` | Open batch details |
| Add Note | `N` | Open quick note dialog |
| View QR Code | `Q` | Show QR code dialog |
| Print Label | `⌘P` / `Ctrl+P` | Print batch label |
| Copy ID | `⌘C` / `Ctrl+C` | Copy batch ID |
| Clone | `⌘D` / `Ctrl+D` | Clone batch |
| Archive | `Del` | Archive batch |
| Export | `⌘E` / `Ctrl+E` | Export batch data |

## Interaction Methods

### Desktop (Right-Click)
```tsx
<div onContextMenu={(e) => {
  e.preventDefault();
  // Context menu opens automatically
}}>
  <BatchCard />
</div>
```

### Mobile (Long-Press)
```tsx
const longPressTimer = useRef<NodeJS.Timeout>();

const handleTouchStart = () => {
  longPressTimer.current = setTimeout(() => {
    setContextMenuOpen(true);
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, 500);
};

<div
  onTouchStart={handleTouchStart}
  onTouchEnd={() => clearTimeout(longPressTimer.current)}
>
  <BatchCard />
</div>
```

### Three-Dot Menu (Always Available)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Menu items */}
  </DropdownMenuContent>
</DropdownMenu>
```

## Toast Notifications

All actions provide clear feedback:

```tsx
// Success
toast({
  title: "Stage Updated",
  description: "Batch moved to Fermentation",
});

// Error with retry
toast({
  title: "Failed to update",
  description: error.message,
  variant: "destructive",
});

// Copy action
toast({
  title: "Copied",
  description: "Batch ID copied to clipboard",
});
```

## Confirmation Dialogs

### Archive Confirmation
```tsx
<AlertDialog>
  <AlertDialogTitle>Archive this batch?</AlertDialogTitle>
  <AlertDialogDescription>
    This will mark the batch as complete and move it to the archive.
  </AlertDialogDescription>
  <AlertDialogAction>Archive Batch</AlertDialogAction>
</AlertDialog>
```

### Skip Stage Warning
```tsx
<Dialog>
  <DialogTitle>
    <AlertTriangle /> Skip Stage?
  </DialogTitle>
  <DialogDescription>
    Skipping stages is unusual. Please provide a reason.
  </DialogDescription>
  {/* Stage selector + reason textarea */}
</Dialog>
```

## Accessibility

All components follow accessibility best practices:

- **ARIA labels** on all interactive elements
- **Keyboard navigation** (arrows, Enter, Esc)
- **Focus management** with focus trap in modals
- **Screen reader** announcements for actions
- **High contrast** mode support
- **Touch targets** minimum 48px on mobile

## Performance Optimization

### Memoization
```tsx
const menuItems = useMemo(
  () => generateMenuItems(batch, permissions, context),
  [batch.id, batch.currentStage, permissions, context]
);
```

### Lazy Loading
```tsx
const SkipStageDialog = lazy(() => import('./SkipStageDialog'));
const QuickNoteDialog = lazy(() => import('./QuickNoteDialog'));
```

### Conditional Rendering
```tsx
{contextMenuOpen && (
  <ContextMenuContent>
    {/* Only render when open */}
  </ContextMenuContent>
)}
```

## Context-Aware Menus

Different contexts show different menu items:

```tsx
const getMenuItems = (batch: Batch, context: MenuContext) => {
  const baseItems = [/* common actions */];

  switch (context) {
    case 'card':
      return [...baseItems, ...cardSpecificItems];
    case 'timeline':
      return [...baseItems, ...timelineItems];
    case 'archived':
      return [/* restore, delete permanently */];
    default:
      return baseItems;
  }
};
```

## Integration Guide

### Step 1: Wrap BatchCard
```tsx
import { BatchContextMenu } from '@/components/production/BatchContextMenu';

<BatchContextMenu batch={batch} {...handlers}>
  <BatchCard batch={batch} />
</BatchContextMenu>
```

### Step 2: Add Action Handlers
```tsx
const { 
  updateStage, 
  cloneBatch, 
  archiveBatch 
} = useBatchActions();

const handleAddNote = async (batchId: string, note: string) => {
  await addBatchLog(batchId, { content: note });
};
```

### Step 3: Add Guide (Optional)
```tsx
import { BatchContextMenuGuide } from '@/components/production/BatchContextMenuGuide';

// In your production view
<BatchContextMenuGuide />
```

## Testing Checklist

- [ ] Right-click opens menu
- [ ] Three-dot button opens dropdown
- [ ] Long-press works on mobile (with haptic)
- [ ] All actions execute correctly
- [ ] Confirmations appear when needed
- [ ] Toast notifications display
- [ ] Keyboard shortcuts work
- [ ] Recent actions track and display
- [ ] Disabled states work correctly
- [ ] Permissions respected
- [ ] Mobile bottom sheet works
- [ ] Screen reader accessible
- [ ] No performance lag

## Future Enhancements

- [ ] Mobile bottom sheet variant
- [ ] More granular permissions
- [ ] Custom action plugins
- [ ] Action history/undo
- [ ] Batch operation templates
- [ ] Quick filters from menu
- [ ] Analytics tracking
- [ ] A/B testing support

## Related Documentation

- [Production Tab README](./README.md)
- [Batch Timeline README](./README.timeline.md)
- [Batch Actions Hook](../../hooks/production/README.md)
