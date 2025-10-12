-- Update stage enumeration to match new 19-stage list and fix constraint errors
-- 1) Drop existing check constraint on batches.current_stage
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_current_stage_check;

-- 2) Migrate existing batch current_stage values from old combined names to new discrete names
UPDATE public.batches
SET current_stage = CASE
  WHEN current_stage = 'Sorting & Washing' THEN 'Sorting'
  WHEN current_stage = 'Settling/Enzymes' THEN 'Settling'
  WHEN current_stage = 'Pitching & Fermentation' THEN 'Pitching'
  WHEN current_stage = 'Stabilisation/Finings' THEN 'Stabilisation'
  WHEN current_stage = 'Conditioning/Lees Aging' THEN 'Conditioning'
  WHEN current_stage = 'Tasting/QA' THEN 'Tasting'
  ELSE current_stage
END;

-- 3) Recreate the check constraint with the new allowed values
ALTER TABLE public.batches
ADD CONSTRAINT batches_current_stage_check
CHECK (
  current_stage IN (
    'Harvest','Sorting','Washing','Milling','Pressing','Settling',
    'Enzymes','Pitching','Fermentation','Cold Crash',
    'Racking','Malolactic','Stabilisation',
    'Blending','Backsweetening','Bottling','Conditioning','Lees Aging','Tasting','Complete'
  )
);
