/**
 * Batch log and history type definitions
 */

export interface BatchLog {
  id: string;
  user_id: string;
  batch_id: string;
  stage: string;
  role: string | null;
  title: string | null;
  content: string | null;
  tags: string[] | null;
  og: number | null;
  fg: number | null;
  ph: number | null;
  ta_gpl: number | null;
  temp_c: number | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBatchLogInput {
  batch_id: string;
  stage: string;
  role?: string;
  title?: string;
  content?: string;
  tags?: string[];
  og?: number;
  fg?: number;
  ph?: number;
  ta_gpl?: number;
  temp_c?: number;
  attachments?: string[];
}

export interface UpdateBatchLogInput {
  stage?: string;
  role?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  og?: number | null;
  fg?: number | null;
  ph?: number | null;
  ta_gpl?: number | null;
  temp_c?: number | null;
  attachments?: string[] | null;
}

export interface BatchHistory {
  id: string;
  batch_id: string;
  stage: string;
  notes: string | null;
  created_at: string;
}

export interface CreateBatchHistoryInput {
  batch_id: string;
  stage: string;
  notes?: string;
}
