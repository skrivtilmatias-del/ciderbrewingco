-- Add new columns to batches table for comprehensive metadata
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS apple_mix TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS target_og NUMERIC,
ADD COLUMN IF NOT EXISTS target_fg NUMERIC,
ADD COLUMN IF NOT EXISTS target_ph NUMERIC,
ADD COLUMN IF NOT EXISTS target_ta NUMERIC,
ADD COLUMN IF NOT EXISTS target_temp_c NUMERIC;

-- Create batch_logs table for structured timeline entries
CREATE TABLE IF NOT EXISTS public.batch_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stage TEXT NOT NULL,
  role TEXT DEFAULT 'General',
  title TEXT,
  content TEXT,
  tags TEXT[],
  og NUMERIC,
  fg NUMERIC,
  ph NUMERIC,
  ta_gpl NUMERIC,
  temp_c NUMERIC,
  attachments TEXT[]
);

-- Enable RLS on batch_logs
ALTER TABLE public.batch_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for batch_logs
CREATE POLICY "Users can view logs for their own batches"
ON public.batch_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.batches
    WHERE batches.id = batch_logs.batch_id
    AND batches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create logs for their own batches"
ON public.batch_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.batches
    WHERE batches.id = batch_logs.batch_id
    AND batches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own logs"
ON public.batch_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
ON public.batch_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on batch_logs
CREATE TRIGGER update_batch_logs_updated_at
BEFORE UPDATE ON public.batch_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batch_logs_batch_id ON public.batch_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_logs_stage ON public.batch_logs(stage);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created_at ON public.batch_logs(created_at DESC);