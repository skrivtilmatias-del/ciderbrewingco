# Batch Progress Indicators

Beautiful, informative progress indicators showing batch completion based on stage progression and time.

## Components

### 1. CircularProgress
**File:** `src/components/production/CircularProgress.tsx`

SVG-based circular progress indicator with gradient colors.

**Features:**
- Smooth animated fill (1s duration)
- Gradient colors based on progress
- Customizable size and stroke width
- Optional center text
- Accessible with ARIA labels

**Usage:**
```tsx
import { CircularProgress } from '@/components/production/CircularProgress';

<CircularProgress
  progress={75}
  size={80}
  strokeWidth={8}
  showText={true}
/>
```

**Props:**
- `progress` (number): 0-100
- `size` (number, default: 80): Circle diameter in pixels
- `strokeWidth` (number, default: 8): Stroke width in pixels
- `showText` (boolean, default: true): Show percentage in center
- `className` (string): Additional CSS classes

### 2. LinearProgress
**File:** `src/components/production/LinearProgress.tsx`

Multi-segment progress bar showing all production stages.

**Features:**
- Shows all stages with correct proportions
- Highlights completed, current, and future segments
- Optional stage labels
- Compact mode for cards
- Animated progress within current segment

**Usage:**
```tsx
import { LinearProgress } from '@/components/production/LinearProgress';

<LinearProgress
  progress={45}
  showLabels={true}
  compact={false}
/>
```

**Props:**
- `progress` (number): 0-100
- `showLabels` (boolean, default: false): Show stage abbreviations
- `compact` (boolean, default: false): Smaller height (1.5px vs 2px)
- `className` (string): Additional CSS classes

### 3. BatchProgressMini
**File:** `src/components/production/BatchProgress.tsx`

Minimal progress indicator for list/card views with tooltip.

**Features:**
- Small circular progress (40px)
- Detailed tooltip on hover
- Shows status, days in stage, variance
- Estimated completion date

**Usage:**
```tsx
import { BatchProgressMini } from '@/components/production/BatchProgress';

<BatchProgressMini batch={batch} />
```

### 4. BatchProgressCard
**File:** `src/components/production/BatchProgress.tsx`

Medium progress indicator for grid view cards.

**Features:**
- 80px circular progress
- Status badges
- Compact linear progress bar
- Clean, card-friendly layout

**Usage:**
```tsx
import { BatchProgressCard } from '@/components/production/BatchProgress';

<BatchProgressCard batch={batch} />
```

### 5. BatchProgressDetailed
**File:** `src/components/production/BatchProgress.tsx`

Full progress view for batch details panel.

**Features:**
- 120px circular progress
- Metrics grid (stage, days, progress, completion)
- Full stage timeline
- Status alerts (overdue/ahead)
- Next milestone prediction
- Estimated completion date

**Usage:**
```tsx
import { BatchProgressDetailed } from '@/components/production/BatchProgress';

<BatchProgressDetailed batch={batch} />
```

### 6. ProgressBadge
**File:** `src/components/production/BatchProgress.tsx`

Status badges for batch progress.

**Features:**
- Shows overdue, behind, ahead, on-track
- Action needed badge
- Completion badge
- Animated pulse for overdue
- Color-coded with icons

**Usage:**
```tsx
import { ProgressBadge } from '@/components/production/ProgressBadge';

<ProgressBadge batch={batch} />
```

### 7. ProgressOverview
**File:** `src/components/production/ProgressOverview.tsx`

Analytics dashboard showing progress statistics across all batches.

**Features:**
- Count of on-track batches
- Count of ahead/behind/overdue batches
- Average progress percentage
- Visual progress bars
- Color-coded cards
- Responsive grid layout

**Usage:**
```tsx
import { ProgressOverview } from '@/components/production/ProgressOverview';

<ProgressOverview batches={batches} />
```

## Progress Calculation

### Algorithm

Progress is calculated based on two factors:
1. **Stage Progress**: Which stage the batch is in (0-100%)
2. **Time Progress**: How long it's been in current stage

```typescript
import { calculateProgress } from '@/lib/progressUtils';

const progress = calculateProgress(batch);
// Returns:
// {
//   stageProgress: 50,      // Stage contribution
//   timeProgress: 75,       // Time in stage %
//   overallProgress: 55,    // Combined score
//   status: 'on-track',     // Current status
//   daysAhead: 0            // Schedule variance
// }
```

### Stage Weights

Each stage has a weight representing its contribution to overall progress:

```typescript
{
  'Harvest': { start: 0, end: 5 },
  'Pressing': { start: 11, end: 15 },
  'Fermentation': { start: 22, end: 50 },  // Longest stage
  'Aging': { start: 75, end: 85 },
  'Bottling': { start: 90, end: 95 },
  'Complete': { start: 99, end: 100 }
}
```

### Expected Durations

Each stage has min/max/typical durations in days:

```typescript
{
  'Fermentation': { min: 10, max: 21, typical: 14 },
  'Aging': { min: 21, max: 180, typical: 30 },
  'Bottling': { min: 1, max: 3, typical: 2 }
}
```

### Status Calculation

Status is determined by time variance from expected duration:

- **Overdue**: > max expected duration
- **Behind**: > 2 days over typical
- **On-track**: Within ±2 days of typical
- **Ahead**: > 2 days under typical

## Helper Functions

### getDaysInStage(batch)
Returns number of days batch has been in current stage.

```typescript
import { getDaysInStage } from '@/lib/progressUtils';

const days = getDaysInStage(batch); // 14
```

### getEstimatedCompletionDate(batch)
Calculates estimated completion date based on current progress rate.

```typescript
import { getEstimatedCompletionDate } from '@/lib/progressUtils';

const date = getEstimatedCompletionDate(batch);
console.log(format(date, 'MMM dd, yyyy')); // "Jan 15, 2024"
```

### getNextMilestone(batch)
Returns description of next production milestone.

```typescript
import { getNextMilestone } from '@/lib/progressUtils';

const milestone = getNextMilestone(batch);
// "Racking in ~3 days"
```

### needsAction(batch)
Returns true if batch requires attention (overdue).

```typescript
import { needsAction } from '@/lib/progressUtils';

if (needsAction(batch)) {
  // Show alert
}
```

### getBatchHealthScore(batch)
Calculates health score (0-100) based on schedule adherence.

```typescript
import { getBatchHealthScore } from '@/lib/progressUtils';

const health = getBatchHealthScore(batch); // 85
```

## Color System

### Progress Colors

Colors change based on progress percentage:

- **0-30%**: Blue (Early stages)
- **30-70%**: Amber (Mid production)
- **70-99%**: Green (Nearing completion)
- **100%**: Emerald (Complete with celebration)

```typescript
import { getColorForProgress } from '@/lib/progressUtils';

const colors = getColorForProgress(45);
// {
//   start: 'hsl(var(--warning))',
//   end: 'hsl(var(--warning) / 0.7)',
//   textClass: 'text-amber-600',
//   bgClass: 'bg-amber-50',
//   borderClass: 'border-amber-200'
// }
```

### Status Colors

Status colors indicate schedule adherence:

- **Overdue**: Red
- **Behind**: Orange
- **On-track**: Green
- **Ahead**: Blue

```typescript
import { getColorForStatus } from '@/lib/progressUtils';

const colors = getColorForStatus('ahead');
// {
//   textClass: 'text-blue-600',
//   bgClass: 'bg-blue-50',
//   borderClass: 'border-blue-200'
// }
```

## Animations

**File:** `src/styles/progress-animations.css`

### Available Animations

- `progress-fill`: Circular progress fill (1s)
- `pulse-glow`: Pulsing glow for overdue (2s loop)
- `celebration`: Scale bounce for 100% (0.6s)
- `sparkle`: Sparkle effect for completion (0.8s)
- `shimmer`: Shimmer effect for loading (2s loop)
- `stage-transition`: Stage change fade-in (0.3s)
- `segment-fill`: Progress bar segment fill (0.5s)
- `counter-up`: Number counter animation (0.4s)
- `badge-slide`: Badge slide-in (0.3s)

### Usage

```tsx
<div className="progress-overdue">
  {/* Pulsing glow animation */}
</div>

<div className="progress-complete">
  {/* Celebration bounce */}
</div>
```

## Integration Examples

### BatchCard Integration

```tsx
import { 
  BatchProgressMini, 
  ProgressBadge 
} from '@/components/production/BatchProgress';
import { LinearProgress } from '@/components/production/LinearProgress';
import { calculateProgress } from '@/lib/progressUtils';

export const BatchCard = ({ batch }) => {
  const progress = calculateProgress(batch);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{batch.name}</CardTitle>
          <BatchProgressMini batch={batch} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Batch details */}
        
        {/* Progress badges */}
        <ProgressBadge batch={batch} />
        
        {/* Linear progress */}
        <LinearProgress progress={progress.overallProgress} compact />
      </CardContent>
    </Card>
  );
};
```

### Production Tab Integration

```tsx
import { ProgressOverview } from '@/components/production/ProgressOverview';

export const ProductionTab = ({ batches }) => {
  return (
    <div className="space-y-4">
      {/* Progress analytics */}
      <ProgressOverview batches={batches} />
      
      {/* Batch list */}
      <BatchList batches={batches} />
    </div>
  );
};
```

### Details Panel Integration

```tsx
import { BatchProgressDetailed } from '@/components/production/BatchProgress';

export const BatchDetailsPanel = ({ batch }) => {
  return (
    <div className="space-y-4">
      {/* Full progress view */}
      <BatchProgressDetailed batch={batch} />
      
      {/* Other details */}
    </div>
  );
};
```

## Configuration

Progress calculations can be customized by modifying constants in `src/lib/progressUtils.ts`:

### Customize Stage Weights

```typescript
export const STAGE_WEIGHTS = {
  'Fermentation': { start: 20, end: 60 },  // Increase weight
  // ...
};
```

### Customize Expected Durations

```typescript
export const EXPECTED_DURATIONS = {
  'Fermentation': { min: 12, max: 18, typical: 15 },  // Adjust durations
  // ...
};
```

### Customize Status Thresholds

Modify the status calculation in `calculateProgress()`:

```typescript
// Change variance thresholds
if (variance > 3) {  // Was 2
  status = 'behind';
} else if (variance < -3) {  // Was -2
  status = 'ahead';
}
```

## Performance

### Optimizations

1. **Memoization**: Progress calculations are memoized
2. **Efficient Animations**: CSS animations run on GPU
3. **Lazy Rendering**: Only render visible progress indicators
4. **Debouncing**: Batch updates debounced

### Performance Tips

```tsx
// Memoize progress calculation
const progress = useMemo(
  () => calculateProgress(batch),
  [batch.id, batch.currentStage, batch.startDate]
);

// Batch multiple updates
const updateBatches = useMemo(() =>
  batches.map(calculateProgress),
  [batches]
);
```

## Accessibility

All components follow accessibility best practices:

- **ARIA labels** on progress indicators
- **Semantic HTML** (progress role)
- **Keyboard navigation** supported
- **Screen reader** friendly
- **High contrast** mode support
- **Color blind** safe (not relying only on color)

## Testing

### Unit Tests

```typescript
import { calculateProgress, getDaysInStage } from '@/lib/progressUtils';

describe('Progress calculations', () => {
  it('calculates progress correctly', () => {
    const progress = calculateProgress(mockBatch);
    expect(progress.overallProgress).toBeGreaterThan(0);
    expect(progress.overallProgress).toBeLessThanOrEqual(100);
  });
  
  it('determines status correctly', () => {
    const progress = calculateProgress(overdueBatch);
    expect(progress.status).toBe('overdue');
  });
});
```

### Visual Testing

- [ ] Circular progress animates smoothly
- [ ] Linear progress shows all stages
- [ ] Colors change at correct thresholds
- [ ] Tooltips display correct information
- [ ] Badges show correct status
- [ ] Animations perform at 60fps
- [ ] Mobile responsive
- [ ] Dark mode support

## Troubleshooting

### Progress not updating
- Check batch `startDate` is valid
- Verify stage is in `STAGE_WEIGHTS`
- Ensure progress calculation runs

### Wrong colors
- Check HSL color definitions in CSS
- Verify color utility functions
- Test in light and dark modes

### Animation stuttering
- Reduce animation complexity
- Use CSS transforms instead of properties
- Enable GPU acceleration with `will-change`

## Related Documentation

- [Production Tab README](./README.md)
- [Batch Timeline README](./README.timeline.md)
- [Context Menu README](./README.context-menu.md)
