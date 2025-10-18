/**
 * Utility functions to bridge between different Batch type definitions
 * 
 * BatchCard uses a legacy interface with camelCase fields (currentStage, startDate)
 * while the database uses snake_case fields (current_stage, started_at)
 */

import type { Batch as DBBatch } from '@/types/batch.types';
import type { Batch as LegacyBatch } from '@/components/BatchCard';

/**
 * Convert database Batch to legacy BatchCard format
 */
export function toLegacyBatch(batch: DBBatch): LegacyBatch {
  return {
    id: batch.id,
    name: batch.name,
    variety: batch.variety,
    apple_origin: batch.apple_origin || undefined,
    volume: batch.volume,
    startDate: batch.started_at,
    currentStage: batch.current_stage as any,
    progress: batch.progress,
    notes: batch.notes || undefined,
    attachments: batch.attachments || undefined,
    target_og: batch.target_og || undefined,
    target_fg: batch.target_fg || undefined,
    target_ph: batch.target_ph || undefined,
    target_end_ph: batch.target_end_ph || undefined,
    target_temp_c: batch.target_temp_c || undefined,
    yeast_type: batch.yeast_type || undefined,
    // Include database fields for components that accept both
    started_at: batch.started_at,
    current_stage: batch.current_stage,
  };
}

/**
 * Convert array of database Batches to legacy format
 */
export function toLegacyBatches(batches: DBBatch[]): LegacyBatch[] {
  return batches.map(toLegacyBatch);
}

/**
 * Create a callback that converts legacy Batch back to DB Batch for parent handlers
 */
export function createLegacyBatchCallback(
  dbBatches: DBBatch[],
  callback: (batch: DBBatch) => void
): (legacyBatch: LegacyBatch) => void {
  return (legacyBatch: LegacyBatch) => {
    // Find the original DB batch by ID
    const dbBatch = dbBatches.find(b => b.id === legacyBatch.id);
    if (dbBatch) {
      callback(dbBatch);
    }
  };
}
