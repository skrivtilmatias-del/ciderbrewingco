# Batch Timeline Visualization

## Overview
The batch timeline system provides beautiful, interactive visualizations of batch progression through production stages with real-time progress tracking.

## Components

### BatchTimeline
Main timeline component with three variants:
- **Compact**: Mini dots timeline (150px wide) for batch cards
- **Standard**: Full timeline with labels and metrics
- **Comparison**: Overlay multiple batch timelines

### StageDetailsModal
Detailed stage management interface:
- View stage timeline and metrics
- Add/edit notes (rich text)
- Upload photos
- Log measurements (temperature, pH, specific gravity)
- Mark stages complete
- View historical data

### BatchTimelineCard
Card component with integrated timeline for grid/list views

## Features

### Visual Indicators
- **Completed stages**: Green checkmark
- **Current stage**: Pulsing with progress percentage
- **Future stages**: Gray outline
- **Overdue stages**: Red pulsing with warning

### Interactive
- Click stages to open details modal
- Hover for quick info tooltips
- Responsive mobile/desktop layouts
- Touch-friendly on mobile

### Metrics Display
- Total days in production
- Progress percentage
- Schedule variance (ahead/behind)
- Stage durations and expected ranges

## Usage

### Basic Implementation
```tsx
import { BatchTimeline } from '@/components/production/BatchTimeline';

// In your component
<BatchTimeline
  batch={batch}
  variant="standard"
  onStageClick={(stage, history) => {
    // Handle stage click
  }}
/>
```

### Compact Timeline (for cards)
```tsx
<BatchTimeline
  batch={batch}
  variant="compact"
  onStageClick={handleStageClick}
/>
```

### Timeline Card
```tsx
import { BatchTimelineCard } from '@/components/production/BatchTimelineCard';

<BatchTimelineCard
  batch={batch}
  onViewDetails={handleViewDetails}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Stage Details Modal
```tsx
import { StageDetailsModal } from '@/components/production/StageDetailsModal';

<StageDetailsModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  stage="Fermentation"
  history={stageHistory}
  batchId={batch.id}
  onComplete={handleComplete}
  onAddNote={handleAddNote}
  onUploadPhoto={handleUploadPhoto}
  onLogMeasurement={handleLogMeasurement}
/>
```

## Data Structure

### Batch with Timeline
```typescript
interface BatchWithTimeline {
  id: string;
  name: string;
  current_stage: string;
  started_at: string;
  completed_at?: string | null;
  stage_history?: StageHistory[];
  estimated_completion_date?: string;
  expected_stage_durations?: Record<string, { min: number; max: number }>;
}
```

### Stage History
```typescript
interface StageHistory {
  stage: string;
  started_at: string;
  completed_at?: string;
  duration_days?: number;
  notes?: string;
  photos?: string[];
  user_id: string;
  measurements?: {
    temperature?: number;
    ph?: number;
    specific_gravity?: number;
  };
}
```

## Responsive Design

### Desktop (>768px)
- Horizontal timeline layout
- All labels visible
- Hover interactions
- Full metrics display

### Mobile (<768px)
- Vertical timeline layout
- Tap interactions
- Scrollable stages
- Larger touch targets
- Simplified metrics

## Animations

### Included Animations
- Pulsing for active/overdue stages (2s loop)
- Progress percentage fill (500ms ease)
- Hover scale transitions (200ms)
- Stage transition animations (500ms ease)
- Line drawing animation on load

### CSS Classes
```css
.animate-pulse - Pulsing animation
.transition-all - Smooth transitions
.hover:scale-110 - Hover scale effect
```

## Integration with ProductionTab

### Add Timeline View Toggle
```tsx
const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'list'>('grid');

// In toolbar
<ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
  <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
</ToggleGroup>

// Render based on view mode
{viewMode === 'timeline' && (
  <div className="space-y-4">
    {batches.map(batch => (
      <BatchTimelineCard key={batch.id} batch={batch} />
    ))}
  </div>
)}
```

## Migration Guide

### Adding stage_history to Existing Batches

#### Database Migration
```sql
-- Add stage_history column
ALTER TABLE batches ADD COLUMN stage_history JSONB;

-- Add estimated_completion_date
ALTER TABLE batches ADD COLUMN estimated_completion_date TIMESTAMP WITH TIME ZONE;

-- Add expected_stage_durations
ALTER TABLE batches ADD COLUMN expected_stage_durations JSONB;
```

#### Backfill Historical Data
For existing batches without stage_history:
1. Estimate from current_stage and started_at
2. Create initial stage_history entry
3. Mark as estimated data

```typescript
// Example backfill logic
const estimateStageHistory = (batch: Batch): StageHistory[] => {
  const currentStageIndex = STAGES.indexOf(batch.current_stage);
  const history: StageHistory[] = [];
  
  for (let i = 0; i <= currentStageIndex; i++) {
    history.push({
      stage: STAGES[i],
      started_at: batch.started_at,
      completed_at: i < currentStageIndex ? batch.started_at : undefined,
      user_id: batch.user_id,
    });
  }
  
  return history;
};
```

## Performance Considerations

### Optimizations
- Memoized calculations (useMemo)
- Lazy loading for stage details
- Efficient re-renders with React.memo
- CSS transforms for animations
- Virtual scrolling for large lists

### Best Practices
- Load stage_history on demand for details
- Use compact variant in lists
- Debounce hover interactions
- Lazy load images in stage photos

## Export Functionality

### Export Timeline
```tsx
// Add export button
<Button onClick={handleExportTimeline}>
  <Download className="h-4 w-4 mr-2" />
  Export Timeline
</Button>

// Export logic
const handleExportTimeline = () => {
  // Capture timeline as image
  // Generate PDF report
  // Download file
};
```

## Troubleshooting

### Common Issues

**Timeline not showing**
- Check if batch has stage_history data
- Verify current_stage matches STAGES constant
- Check for date parsing errors

**Animations not working**
- Verify Tailwind animation classes are included
- Check for CSS conflicts
- Ensure browser supports animations

**Modal not opening**
- Check state management
- Verify onStageClick handler
- Check for z-index conflicts

## Future Enhancements

- Comparison mode (overlay multiple timelines)
- Historical baseline visualization
- Drag-and-drop stage reordering
- Bulk stage updates
- Timeline templates
- Export to various formats
- Real-time collaboration
- Stage completion notifications

## Support

For issues or feature requests, refer to:
- VirtualBatchList.README.md for list integration
- BatchComparison docs for comparison features
- Production module documentation
