/**
 * Batch type definitions
 */

export interface StageHistory {
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

export interface Batch {
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
}
