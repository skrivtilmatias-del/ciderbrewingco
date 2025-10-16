# Production Hooks

Focused, reusable custom hooks for batch management business logic.

## Overview

This directory contains specialized hooks that extract business logic from components into testable, reusable modules. Each hook has a single, well-defined responsibility.

## Hooks

### 📊 `useBatchFilters`

**Purpose**: High-performance batch filtering with memoization

**Features**:
- Text search (name, variety, stage)
- Stage filtering (multi-select)
- Date range filtering
- Volume range filtering
- Status filtering (active/completed)
- Variety filtering
- Alcohol content filtering

**Usage**:
```tsx
import { useBatchFilters } from '@/hooks/production';

const filteredBatches = useBatchFilters(batches, {
  stages: ['Fermentation', 'Bottling'],
  status: 'active',
  volumeRange: [0, 1000],
  dateRange: { from: startDate, to: endDate },
  variety: '',
  alcoholRange: [0, 12],
}, 'search query');
```

**Performance**: Memoized - only recalculates when inputs change

**Utilities**:
- `getUniqueVarieties(batches)` - Extract unique varieties
- `getUniqueStages(batches)` - Extract unique stages
- `filterFunctions` - Individual filter functions for reuse

---

### ✅ `useBatchSelection`

**Purpose**: Manage multi-select state for batch comparison

**Features**:
- Multi-select with max limit
- Keyboard shortcuts (Ctrl+A, Escape)
- Check if batch is selected
- Select/deselect all
- Clear selection

**Usage**:
```tsx
import { useBatchSelection } from '@/hooks/production';

const { 
  selectedBatches,
  selectedCount,
  isSelected,
  toggleSelection,
  selectAll,
  clearSelection,
  isMaxReached
} = useBatchSelection(batches, 4); // Max 4 batches

// In render
<Checkbox 
  checked={isSelected(batch.id)}
  onCheckedChange={() => toggleSelection(batch.id)}
  disabled={!isSelected(batch.id) && isMaxReached}
/>
```

**Keyboard Shortcuts**:
- `Ctrl+A` / `Cmd+A` - Select all batches
- `Escape` - Clear all selections

---

### 🔄 `useBatchActions`

**Purpose**: Centralized batch mutations with optimistic updates

**Features**:
- Update batch stage
- Delete batch
- Clone batch
- Archive batch
- Optimistic UI updates
- Error recovery (automatic rollback)
- Toast notifications
- Loading states

**Usage**:
```tsx
import { useBatchActions } from '@/hooks/production';

const { 
  updateStage,
  deleteBatch,
  cloneBatch,
  archiveBatch,
  isUpdating 
} = useBatchActions();

// Update stage
await updateStage(batchId, 'Fermentation');

// Clone batch
await cloneBatch(existingBatch);

// Delete with confirmation
if (confirm('Delete batch?')) {
  await deleteBatch(batchId);
}
```

**Optimistic Updates**: UI updates immediately, then syncs with server. Automatically rolls back on error.

---

### 🔍 `useBatchSearch`

**Purpose**: Advanced search with debouncing and history

**Features**:
- Debounced search (300ms)
- Search history (localStorage)
- Search suggestions
- Highlight matching text
- Search across multiple fields

**Usage**:
```tsx
import { useBatchSearch } from '@/hooks/production';

const { 
  query,
  setQuery,
  debouncedQuery,
  results,
  resultCount,
  history,
  suggestions,
  clearHistory,
  highlightMatch
} = useBatchSearch(batches);

// In render
<Input 
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search batches..."
/>

{results.map(({ batch, matchField, matchText }) => (
  <div key={batch.id}>
    <span dangerouslySetInnerHTML={{ 
      __html: highlightMatch(matchText, debouncedQuery) 
    }} />
  </div>
))}
```

**Performance**: Debounced to prevent excessive re-renders during typing

---

### 📁 `useBatchGrouping`

**Purpose**: Group and organize batches with expand/collapse

**Features**:
- Group by stage, variety, month, volume, or status
- Collapse/expand groups
- Group statistics (count, volume, progress)
- Total statistics across all groups

**Usage**:
```tsx
import { useBatchGrouping } from '@/hooks/production';

const { 
  groups,
  groupBy,
  setGroupBy,
  isCollapsed,
  toggleGroup,
  expandAll,
  collapseAll,
  totalStats
} = useBatchGrouping(batches, 'stage');

// Group by selector
<Select value={groupBy} onValueChange={setGroupBy}>
  <SelectItem value="stage">By Stage</SelectItem>
  <SelectItem value="variety">By Variety</SelectItem>
  <SelectItem value="month">By Month</SelectItem>
  <SelectItem value="volume">By Volume</SelectItem>
  <SelectItem value="status">By Status</SelectItem>
</Select>

// Render groups
{groups.map(group => (
  <div key={group.key}>
    <button onClick={() => toggleGroup(group.key)}>
      <h3>{group.label}</h3>
      <Badge>{group.stats.count} batches</Badge>
      {isCollapsed(group.key) ? <ChevronDown /> : <ChevronUp />}
    </button>
    
    {!isCollapsed(group.key) && (
      <div>
        <p>Total Volume: {group.stats.totalVolume}L</p>
        <p>Avg Progress: {group.stats.avgProgress}%</p>
        <BatchList batches={group.batches} />
      </div>
    )}
  </div>
))}
```

**Group Options**:
- `stage` - Production stages (sorted by process order)
- `variety` - Apple varieties (alphabetical)
- `month` - Start month (newest first)
- `volume` - Volume categories (Small, Medium, Large, Extra Large)
- `status` - Active vs Completed

---

## Architecture Pattern

### Before (Component with business logic)
```tsx
// ❌ Business logic mixed with UI
const ProductionTab = ({ batches }) => {
  const [filtered, setFiltered] = useState([]);
  
  useEffect(() => {
    const filtered = batches.filter(b => {
      // Complex filtering logic...
      if (searchQuery && !b.name.includes(searchQuery)) return false;
      if (stages.length && !stages.includes(b.stage)) return false;
      // ... 50 more lines
    });
    setFiltered(filtered);
  }, [batches, searchQuery, stages]);
  
  const handleUpdateStage = async (id, stage) => {
    // Mutation logic...
    const { data, error } = await supabase...
    if (error) toast.error(...);
    // ... optimistic updates, rollback, etc.
  };
  
  return <div>...</div>;
};
```

### After (Clean component with hooks)
```tsx
// ✅ Business logic extracted to focused hooks
const ProductionTab = ({ batches }) => {
  const filtered = useBatchFilters(batches, filters, searchQuery);
  const { updateStage } = useBatchActions();
  
  return <div>...</div>;
};
```

## Benefits

### 1. **Separation of Concerns**
- Components focus on UI/UX
- Hooks handle business logic
- Clear, single responsibility

### 2. **Reusability**
- Use hooks across multiple components
- No code duplication
- Consistent behavior

### 3. **Testability**
```tsx
// Easy to test in isolation
import { renderHook } from '@testing-library/react-hooks';
import { useBatchFilters } from '@/hooks/production';

test('filters batches by stage', () => {
  const { result } = renderHook(() => 
    useBatchFilters(mockBatches, { stages: ['Fermentation'] }, '')
  );
  
  expect(result.current).toHaveLength(5);
  expect(result.current[0].currentStage).toBe('Fermentation');
});
```

### 4. **Performance**
- Memoization prevents unnecessary re-renders
- Optimistic updates for instant UI
- Debouncing for expensive operations

### 5. **Maintainability**
- Change logic in one place
- Type-safe with TypeScript
- Comprehensive JSDoc comments

## Testing Strategy

### Unit Tests
```tsx
describe('useBatchFilters', () => {
  it('filters by text search', () => {
    const batches = [
      { name: 'Apple Batch', variety: 'Bramley' },
      { name: 'Pear Batch', variety: 'Conference' }
    ];
    
    const filtered = useBatchFilters(batches, filters, 'apple');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Apple Batch');
  });
  
  it('combines multiple filters', () => {
    const filtered = useBatchFilters(batches, {
      stages: ['Fermentation'],
      status: 'active',
      volumeRange: [100, 500]
    }, '');
    
    // Should pass all filter criteria
    filtered.forEach(batch => {
      expect(batch.currentStage).toBe('Fermentation');
      expect(batch.progress).toBeLessThan(100);
      expect(batch.volume).toBeGreaterThanOrEqual(100);
      expect(batch.volume).toBeLessThanOrEqual(500);
    });
  });
});
```

### Integration Tests
```tsx
describe('ProductionTab with hooks', () => {
  it('filters and selects batches', () => {
    render(<ProductionTab batches={mockBatches} />);
    
    // Type in search
    const search = screen.getByPlaceholderText('Search batches...');
    userEvent.type(search, 'apple');
    
    // Should show filtered results
    await waitFor(() => {
      expect(screen.getByText('Apple Batch 1')).toBeInTheDocument();
      expect(screen.queryByText('Pear Batch')).not.toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

All hooks implement performance optimizations:

1. **Memoization** - `useMemo` prevents recalculation
2. **Debouncing** - Delays expensive operations
3. **Optimistic Updates** - Instant UI feedback
4. **Lazy Loading** - Load data on demand
5. **Caching** - Query cache via TanStack Query

## Migration Guide

### Migrating from inline logic to hooks

**Step 1**: Identify business logic
```tsx
// Before
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(batches.filter(...));
}, [batches]);
```

**Step 2**: Replace with hook
```tsx
// After
const filtered = useBatchFilters(batches, filters, query);
```

**Step 3**: Remove old code and state
```tsx
// Remove
❌ const [filtered, setFiltered] = useState([]);
❌ useEffect(() => { ... }, []);
```

## Best Practices

### ✅ Do

- Use hooks for all business logic
- Keep components focused on UI
- Memoize expensive computations
- Handle loading and error states
- Add JSDoc comments
- Write unit tests

### ❌ Don't

- Mix business logic in components
- Duplicate logic across components
- Forget to handle edge cases
- Skip memoization for expensive operations
- Use hooks conditionally (breaks React rules)

## Future Enhancements

Planned improvements:

1. **useBatchExport** - Export to CSV, PDF, Excel
2. **useBatchAnalytics** - Advanced analytics and insights
3. **useBatchCollaboration** - Real-time collaboration features
4. **useBatchNotifications** - Alert system for batch events
5. **useBatchAI** - AI-powered recommendations

## Related Files

- `/src/hooks/production/` - Hook implementations
- `/src/components/tabs/ProductionTab.tsx` - Example usage
- `/src/components/tabs/BatchesTab.tsx` - Example usage
- `/src/lib/queryConfig.ts` - TanStack Query configuration
- `/PERFORMANCE_OPTIMIZATION.md` - Performance guide

## Contributing

When adding new hooks:

1. Create file in `/src/hooks/production/`
2. Add comprehensive JSDoc comments
3. Export from `/src/hooks/production/index.ts`
4. Write unit tests
5. Update this README
6. Follow existing patterns

## Questions?

For questions about these hooks, refer to:
- Individual hook JSDoc comments
- Unit test examples
- Component usage examples
- [React Hooks documentation](https://react.dev/reference/react)
