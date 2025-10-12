-- Add yeast_type column to batches table for storing the yeast strain/type used
ALTER TABLE public.batches 
ADD COLUMN yeast_type text;