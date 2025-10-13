-- Create floor plan layouts table
CREATE TABLE IF NOT EXISTS public.floor_plan_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  scenario_type TEXT NOT NULL DEFAULT 'custom',
  equipment_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.floor_plan_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own floor plans"
ON public.floor_plan_layouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own floor plans"
ON public.floor_plan_layouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own floor plans"
ON public.floor_plan_layouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own floor plans"
ON public.floor_plan_layouts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_floor_plan_layouts_updated_at
BEFORE UPDATE ON public.floor_plan_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();