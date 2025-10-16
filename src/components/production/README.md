# Batch Context Menu

A powerful right-click context menu for batch cards with comprehensive actions, keyboard shortcuts, and mobile long-press support.

## Features

### Quick Actions
- **Update Stage** → Submenu with all available stages
- **Add Note** → Opens quick note dialog
- **View Details** → Opens batch details side panel
- **View QR Code** → Shows QR code in modal

### Label Actions
- **Print Label** → Opens print dialog for batch labels
- **Download QR Code** → Saves QR code as PNG
- **Copy Batch ID** → Copies ID to clipboard with toast
- **Copy Batch URL** → Copies shareable URL to clipboard

### Management
- **Clone Batch** → Pre-fills form with batch data
- **Archive Batch** → Archives with confirmation dialog
- **Export Data** → Downloads batch data as CSV

### Navigation
- **Go to Blending** → Navigate to blending tab
- **View Analytics** → View batch-specific analytics
- **View History** → Opens activity log

## Triggering the Context Menu

### Desktop
- **Right-click** on any batch card
- **Three-dot menu button** on batch cards
- **Keyboard shortcuts** when batch is selected

### Mobile
- **Long press** (200ms) on batch card
- Includes haptic feedback if device supports it
- Automatically cancels if finger moves >10px

## Keyboard Shortcuts

When a batch is selected:

| Shortcut | Action |
|----------|--------|
| `N` | Add Note |
| `Enter` | View Details |
| `Q` | View QR Code |
| `U` | Update Stage (opens submenu) |
| `Ctrl/Cmd + P` | Print Label |
| `Ctrl/Cmd + E` | Export Data |
| `Ctrl/Cmd + C` | Copy Batch ID |
| `Ctrl/Cmd + Shift + C` | Copy Batch URL |
| `Ctrl/Cmd + Shift + D` | Clone Batch |
| `Del` | Archive Batch |

## Usage

```tsx
import { BatchCard } from "@/components/BatchCard";
import { BatchContextMenu } from "@/components/production/BatchContextMenu";

<BatchContextMenu
  batch={batch}
  onUpdateStage={(batchId, newStage) => {
    // Handle stage update
  }}
  onAddNote={(batchId, note) => {
    // Handle note addition
  }}
  onViewDetails={(batch) => {
    // Handle view details
  }}
  onClone={(batch) => {
    // Handle clone
  }}
  onArchive={(batchId) => {
    // Handle archive
  }}
  onExport={(batch) => {
    // Handle export
  }}
>
  <BatchCard batch={batch} {...props} />
</BatchContextMenu>
```

## Features

### Smart States
- **Disabled states** with tooltips (e.g., "Cannot update archived batch")
- **Current stage** highlighted in Update Stage submenu
- **Confirmation dialogs** for destructive actions (Archive)

### Visual Polish
- Icons for every action
- Keyboard shortcuts displayed next to items
- Logical grouping with separators
- Smooth animations for dialogs
- Backdrop blur for premium feel

### Mobile Optimizations
- Touch-optimized hit areas
- Long-press gesture recognition
- Haptic feedback on supported devices
- Movement detection to prevent accidental triggers
- Smooth animations

## Implementation Details

### Long Press Detection
- 200ms threshold
- Cancels if finger moves >10px (prevents accidental triggers during scrolling)
- Provides haptic feedback on trigger (if supported)
- Cleans up timers on unmount

### Context Menu Positioning
- Automatically positions near cursor/touch point
- Prevents overflow off screen edges
- High z-index to appear above other content
- Backdrop blur for depth perception

### Performance
- Lazy-loaded dialogs
- Memoized handlers
- No re-renders on hover
- Efficient event delegation
