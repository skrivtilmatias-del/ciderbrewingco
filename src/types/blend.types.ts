/**
 * Blend batch type definitions
 */

export interface BlendBatch {
  id: string;
  user_id: string;
  name: string;
  total_volume: number;
  storage_location: string | null;
  bottles_75cl: number;
  bottles_150cl: number;
  notes: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBlendBatchInput {
  name: string;
  total_volume: number;
  storage_location?: string;
  bottles_75cl?: number;
  bottles_150cl?: number;
  notes?: string;
  attachments?: string[];
}

export interface UpdateBlendBatchInput {
  name?: string;
  total_volume?: number;
  storage_location?: string | null;
  bottles_75cl?: number;
  bottles_150cl?: number;
  notes?: string | null;
  attachments?: string[] | null;
}

export interface BlendComponent {
  id: string;
  blend_batch_id: string;
  source_batch_id: string;
  volume_liters: number | null;
  percentage: number | null;
  spillage: number | null;
  created_at: string;
}

export interface CreateBlendComponentInput {
  blend_batch_id: string;
  source_batch_id: string;
  volume_liters?: number;
  percentage?: number;
  spillage?: number;
}

export interface UpdateBlendComponentInput {
  volume_liters?: number | null;
  percentage?: number | null;
  spillage?: number | null;
}
