-- Create tasting_analysis table for blend batches
CREATE TABLE public.tasting_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blend_batch_id UUID NOT NULL REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taste TEXT,
  colour TEXT,
  palate TEXT,
  overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasting_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasting_analysis
CREATE POLICY "Users can view their own tasting analyses"
ON public.tasting_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasting analyses"
ON public.tasting_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasting analyses"
ON public.tasting_analysis
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasting analyses"
ON public.tasting_analysis
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tasting_analysis_updated_at
BEFORE UPDATE ON public.tasting_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();