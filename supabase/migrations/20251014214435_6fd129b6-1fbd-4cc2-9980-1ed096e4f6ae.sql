-- Create BOM (Bill of Materials) table for batches and blends
CREATE TABLE IF NOT EXISTS public.batch_bom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  blend_id UUID REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- BOM data stored as JSONB for flexibility
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  packaging JSONB NOT NULL DEFAULT '[]'::jsonb,
  labor JSONB NOT NULL DEFAULT '[]'::jsonb,
  overheads JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Pricing and configuration
  sell_price_75cl NUMERIC,
  sell_price_150cl NUMERIC,
  wastage_percent NUMERIC NOT NULL DEFAULT 5,
  
  -- Constraints
  CONSTRAINT batch_or_blend_required CHECK (
    (batch_id IS NOT NULL AND blend_id IS NULL) OR 
    (batch_id IS NULL AND blend_id IS NOT NULL)
  ),
  CONSTRAINT unique_batch_bom UNIQUE(batch_id),
  CONSTRAINT unique_blend_bom UNIQUE(blend_id)
);

-- Enable RLS
ALTER TABLE public.batch_bom ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own BOM data"
  ON public.batch_bom
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own BOM data"
  ON public.batch_bom
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own BOM data"
  ON public.batch_bom
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own BOM data"
  ON public.batch_bom
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_batch_bom_updated_at
  BEFORE UPDATE ON public.batch_bom
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_batch_bom_batch_id ON public.batch_bom(batch_id);
CREATE INDEX idx_batch_bom_blend_id ON public.batch_bom(blend_id);
CREATE INDEX idx_batch_bom_user_id ON public.batch_bom(user_id);