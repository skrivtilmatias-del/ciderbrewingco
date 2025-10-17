-- Add new fields to batches table for comprehensive filtering
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS expected_completion_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS abv numeric;

-- Create index on commonly filtered columns for performance
CREATE INDEX IF NOT EXISTS idx_batches_location ON public.batches(location);
CREATE INDEX IF NOT EXISTS idx_batches_archived ON public.batches(archived);
CREATE INDEX IF NOT EXISTS idx_batches_expected_completion_date ON public.batches(expected_completion_date);
CREATE INDEX IF NOT EXISTS idx_batches_abv ON public.batches(abv);

-- Create filter_presets table for storing user filter presets
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on filter_presets
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies for filter_presets
CREATE POLICY "Users can view their own filter presets"
  ON public.filter_presets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own filter presets"
  ON public.filter_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filter presets"
  ON public.filter_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filter presets"
  ON public.filter_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on filter_presets
CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON public.filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index on filter_presets for performance
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON public.filter_presets(user_id);

-- Calculate ABV for existing batches (estimate based on target_og and target_fg)
-- ABV formula: (OG - FG) * 131.25
UPDATE public.batches
SET abv = CASE 
  WHEN target_og IS NOT NULL AND target_fg IS NOT NULL THEN
    (target_og - target_fg) * 131.25
  WHEN target_og IS NOT NULL THEN
    (target_og - 1.005) * 131.25  -- Assume typical FG of 1.005 for dry cider
  ELSE NULL
END
WHERE abv IS NULL;