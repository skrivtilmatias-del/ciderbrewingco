-- Add attachments column to blend_batches
ALTER TABLE public.blend_batches 
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Add attachments column to tasting_analysis
ALTER TABLE public.tasting_analysis 
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Add attachments column to batches for notes
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS attachments TEXT[];