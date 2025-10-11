-- Create blend_batches table to track blended bottle batches
CREATE TABLE public.blend_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_volume NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blend_components table to track which batches are in each blend
CREATE TABLE public.blend_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blend_batch_id UUID NOT NULL REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  source_batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  percentage NUMERIC,
  volume_liters NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blend_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blend_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blend_batches
CREATE POLICY "Users can view their own blend batches"
ON public.blend_batches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blend batches"
ON public.blend_batches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blend batches"
ON public.blend_batches
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blend batches"
ON public.blend_batches
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for blend_components
CREATE POLICY "Users can view blend components for their blends"
ON public.blend_components
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.blend_batches
    WHERE blend_batches.id = blend_components.blend_batch_id
    AND blend_batches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create components for their blends"
ON public.blend_components
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.blend_batches
    WHERE blend_batches.id = blend_components.blend_batch_id
    AND blend_batches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update components for their blends"
ON public.blend_components
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.blend_batches
    WHERE blend_batches.id = blend_components.blend_batch_id
    AND blend_batches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete components for their blends"
ON public.blend_components
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.blend_batches
    WHERE blend_batches.id = blend_components.blend_batch_id
    AND blend_batches.user_id = auth.uid()
  )
);

-- Add trigger for updated_at on blend_batches
CREATE TRIGGER update_blend_batches_updated_at
BEFORE UPDATE ON public.blend_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();