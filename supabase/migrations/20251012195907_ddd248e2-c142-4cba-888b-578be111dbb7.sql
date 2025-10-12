-- Add target_end_ph column to batches table for storing the target final pH value
ALTER TABLE public.batches 
ADD COLUMN target_end_ph numeric;