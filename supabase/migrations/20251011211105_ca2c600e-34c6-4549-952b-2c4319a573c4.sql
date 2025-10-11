-- First update all existing batch stages to valid new stages
UPDATE public.batches 
SET current_stage = 'Pressing'
WHERE current_stage = 'pressing';

UPDATE public.batches 
SET current_stage = 'Pitching & Fermentation'
WHERE current_stage = 'fermentation';

UPDATE public.batches 
SET current_stage = 'Conditioning/Lees Aging'
WHERE current_stage = 'aging';

UPDATE public.batches 
SET current_stage = 'Bottling'
WHERE LOWER(current_stage) = 'bottling';

UPDATE public.batches 
SET current_stage = 'Complete'
WHERE LOWER(current_stage) = 'complete';

-- Now safely drop and recreate constraint
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_current_stage_check;

-- Add check constraint for all valid detailed stages
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