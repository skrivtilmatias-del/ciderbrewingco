-- Allow tasting analysis to be for competitor brands instead of only blend batches
ALTER TABLE public.tasting_analysis 
  ALTER COLUMN blend_batch_id DROP NOT NULL,
  ADD COLUMN competitor_brand text;

-- Add a check to ensure either blend_batch_id or competitor_brand is provided
ALTER TABLE public.tasting_analysis
  ADD CONSTRAINT tasting_analysis_source_check 
  CHECK (
    (blend_batch_id IS NOT NULL AND competitor_brand IS NULL) OR
    (blend_batch_id IS NULL AND competitor_brand IS NOT NULL)
  );