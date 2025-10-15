/**
 * Tasting analysis type definitions
 */

export interface TastingAnalysis {
  id: string;
  user_id: string;
  blend_batch_id: string | null;
  competitor_brand: string | null;
  colour: string | null;
  taste: string | null;
  palate: string | null;
  overall_score: number | null;
  notes: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTastingAnalysisInput {
  blend_batch_id?: string;
  competitor_brand?: string;
  colour?: string;
  taste?: string;
  palate?: string;
  overall_score?: number;
  notes?: string;
  attachments?: string[];
}

export interface UpdateTastingAnalysisInput {
  blend_batch_id?: string | null;
  competitor_brand?: string | null;
  colour?: string | null;
  taste?: string | null;
  palate?: string | null;
  overall_score?: number | null;
  notes?: string | null;
  attachments?: string[] | null;
}
