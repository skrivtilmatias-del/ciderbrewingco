-- First, update all existing batches to use 'Harvest' as default stage
UPDATE public.batches 
SET current_stage = 'Harvest'
WHERE current_stage NOT IN (
  'Harvest',
  'Sorting & Washing',
  'Milling',
  'Pressing',
  'Settling/Enzymes',
  'Pitching & Fermentation',
  'Cold Crash',
  'Racking',
  'Malolactic',
  'Stabilisation/Finings',
  'Blending',
  'Backsweetening',
  'Bottling',
  'Conditioning/Lees Aging',
  'Tasting/QA',
  'Complete'
);

-- Drop old constraint if exists
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_current_stage_check;

-- Add check constraint for valid stages
ALTER TABLE public.batches
  ADD CONSTRAINT batches_current_stage_check 
  CHECK (current_stage IN (
    'Harvest',
    'Sorting & Washing',
    'Milling',
    'Pressing',
    'Settling/Enzymes',
    'Pitching & Fermentation',
    'Cold Crash',
    'Racking',
    'Malolactic',
    'Stabilisation/Finings',
    'Blending',
    'Backsweetening',
    'Bottling',
    'Conditioning/Lees Aging',
    'Tasting/QA',
    'Complete'
  ));