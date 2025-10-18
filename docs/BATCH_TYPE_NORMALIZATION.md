# Batch Type Normalization

## Overview
The Batch type has been normalized to use camelCase throughout the application for consistency and type safety.

## Single Source of Truth
- **Location**: `src/types/batch.types.ts`
- **Client Type**: `Batch` (camelCase - used in all components)
- **Database Type**: `DatabaseBatch` (snake_case - matches Supabase schema)

## Normalization Point
All database batches are normalized to camelCase in `useBatches.ts` using the `mapDatabaseBatchToClient()` function. This ensures a single transformation point.

## Field Mapping Reference

### Database (snake_case) → Client (camelCase)
```
current_stage      → currentStage
started_at         → startDate  
apple_origin       → appleOrigin
yeast_type         → yeastType
target_og          → targetOg
target_fg          → targetFg
target_ph          → targetPh
target_end_ph      → targetEndPh
target_ta          → targetTa
target_temp_c      → targetTempC
completed_at       → completedAt
created_at         → createdAt
updated_at         → updatedAt
user_id            → userId
updated_by_id      → updatedById
deleted_by_id      → deletedById
stage_history      → stageHistory
estimated_completion_date → estimatedCompletionDate
expected_stage_durations  → expectedStageDurations
apple_mix          → appleMix
```

## Migration Checklist
When updating components to use the normalized types:

1. ✅ Import `Batch` from `@/types/batch.types` (not from `BatchCard`)
2. ✅ Use camelCase field names (e.g., `batch.currentStage` not `batch.current_stage`)
3. ✅ When writing to database, convert back to snake_case
4. ✅ Remove defensive code like `batch.currentStage || batch.current_stage`

## Example Usage

### ✅ Correct
```typescript
import { Batch } from '@/types/batch.types';

const MyComponent = ({ batch }: { batch: Batch }) => {
  return (
    <div>
      <p>Stage: {batch.currentStage}</p>
      <p>Started: {batch.startDate}</p>
      <p>Origin: {batch.appleOrigin}</p>
    </div>
  );
};
```

### ❌ Incorrect (Old Pattern)
```typescript
const MyComponent = ({ batch }) => {
  // Don't use snake_case
  const stage = batch.current_stage;  // ❌
  
  // Don't use defensive code
  const date = batch.startDate || batch.started_at;  // ❌
  
  return <div>{stage}</div>;
};
```

## Database Operations
When updating the database, use snake_case field names:

```typescript
await supabase
  .from('batches')
  .update({
    current_stage: batch.currentStage,  // Convert back to snake_case
    started_at: batch.startDate,
    apple_origin: batch.appleOrigin,
  })
  .eq('id', batch.id);
```
