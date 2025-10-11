-- Add bottle count columns to blend_batches table
ALTER TABLE public.blend_batches 
ADD COLUMN bottles_75cl integer DEFAULT 0,
ADD COLUMN bottles_150cl integer DEFAULT 0;