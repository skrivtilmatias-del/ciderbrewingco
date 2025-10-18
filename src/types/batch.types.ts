/**
 * Batch type definitions - Single source of truth
 */

import { CiderStage } from '@/constants/ciderStages';

export interface StageHistory {
  stage: string;
  startedAt: string;
  completedAt?: string;
  durationDays?: number;
  notes?: string;
  photos?: string[];
  userId: string;
  measurements?: {
    temperature?: number;
    ph?: number;
    specificGravity?: number;
  };
}

/**
 * Database Batch type (as stored in Supabase with snake_case)
 * This is the raw format from the database
 */
export interface DatabaseBatch {
  id: string;
  user_id: string;
  name: string;
  variety: string;
  volume: number;
  current_stage: string;
  progress: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Optional fields
  apple_origin?: string | null;
  yeast_type?: string | null;
  style?: string | null;
  apple_mix?: string | null;
  notes?: string | null;
  attachments?: string[] | null;
  
  // Target parameters
  target_og?: number | null;
  target_fg?: number | null;
  target_ph?: number | null;
  target_end_ph?: number | null;
  target_ta?: number | null;
  target_temp_c?: number | null;
  
  // Timeline fields
  stage_history?: StageHistory[];
  estimated_completion_date?: string | null;
  expected_stage_durations?: Record<string, { min: number; max: number }>;
  
  // Version control for optimistic locking
  version?: number;
  updated_by_id?: string | null;
  deleted_by_id?: string | null;
}

/**
 * Client-side Batch type (normalized with camelCase)
 * This is used throughout the app - single source of truth for components
 */
export interface Batch {
  id: string;
  userId: string;
  name: string;
  variety: string;
  volume: number;
  currentStage: CiderStage | 'Complete';
  progress: number;
  startDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Optional fields
  appleOrigin?: string;
  yeastType?: string;
  style?: string;
  appleMix?: string;
  notes?: string;
  attachments?: string[];
  
  // Target parameters
  targetOg?: number;
  targetFg?: number;
  targetPh?: number;
  targetEndPh?: number;
  targetTa?: number;
  targetTempC?: number;
  
  // Timeline fields
  stageHistory?: StageHistory[];
  estimatedCompletionDate?: string;
  expectedStageDurations?: Record<string, { min: number; max: number }>;
  
  // Version control for optimistic locking
  version?: number;
  updatedById?: string;
  deletedById?: string;
  
  // Real-time animation flags (client-side only)
  _justAdded?: boolean;
  _justUpdated?: boolean;
  _deleting?: boolean;
  _updating?: boolean;

  // Deprecated legacy fields for gradual migration (do not use in new code)
  // These mirror old snake_case names to avoid TypeScript errors during transition
  apple_origin?: string;
  yeast_type?: string;
  apple_mix?: string;
  target_og?: number;
  target_fg?: number;
  target_ph?: number;
  target_end_ph?: number;
  target_ta?: number;
  target_temp_c?: number;
  current_stage?: string;
  started_at?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  estimated_completion_date?: string;
}

export interface CreateBatchInput {
  name: string;
  variety: string;
  volume: number;
  current_stage: string;
  
  // Optional fields
  apple_origin?: string;
  yeast_type?: string;
  style?: string;
  apple_mix?: string;
  notes?: string;
  attachments?: string[];
  
  // Target parameters
  target_og?: number;
  target_fg?: number;
  target_ph?: number;
  target_end_ph?: number;
  target_ta?: number;
  target_temp_c?: number;
}

export interface UpdateBatchInput {
  name?: string;
  variety?: string;
  volume?: number;
  current_stage?: string;
  progress?: number;
  completed_at?: string | null;
  
  // Optional fields
  apple_origin?: string | null;
  yeast_type?: string | null;
  style?: string | null;
  apple_mix?: string | null;
  notes?: string | null;
  attachments?: string[] | null;
  
  // Target parameters
  target_og?: number | null;
  target_fg?: number | null;
  target_ph?: number | null;
  target_end_ph?: number | null;
  target_ta?: number | null;
  target_temp_c?: number | null;
  
  // Version for optimistic locking
  version?: number;
}
