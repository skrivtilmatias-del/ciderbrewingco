-- Add storage location to blend batches for cellar management
ALTER TABLE public.blend_batches 
  ADD COLUMN storage_location text;