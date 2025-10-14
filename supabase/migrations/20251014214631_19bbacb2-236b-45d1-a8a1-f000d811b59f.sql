-- Create inventory lots table for FIFO tracking
CREATE TABLE IF NOT EXISTS public.inventory_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blend_batch_id UUID NOT NULL REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Lot details
  lot_number TEXT NOT NULL,
  bottling_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT NOT NULL,
  
  -- Inventory quantities
  initial_quantity_75cl INTEGER NOT NULL DEFAULT 0,
  current_quantity_75cl INTEGER NOT NULL DEFAULT 0,
  initial_quantity_150cl INTEGER NOT NULL DEFAULT 0,
  current_quantity_150cl INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'reserved')),
  
  CONSTRAINT positive_quantities CHECK (
    current_quantity_75cl >= 0 AND current_quantity_150cl >= 0
  )
);

-- Create inventory thresholds table
CREATE TABLE IF NOT EXISTS public.inventory_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  blend_batch_id UUID REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Threshold levels
  min_quantity_75cl INTEGER NOT NULL DEFAULT 0,
  min_quantity_150cl INTEGER NOT NULL DEFAULT 0,
  
  -- Alert settings
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  
  CONSTRAINT unique_threshold_per_blend_location UNIQUE(blend_batch_id, location)
);

-- Create inventory movements table for audit trail
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjust', 'move')),
  quantity_75cl INTEGER NOT NULL DEFAULT 0,
  quantity_150cl INTEGER NOT NULL DEFAULT 0,
  from_location TEXT,
  to_location TEXT,
  reason TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_lots
CREATE POLICY "Users can view their own inventory lots"
  ON public.inventory_lots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory lots"
  ON public.inventory_lots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory lots"
  ON public.inventory_lots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory lots"
  ON public.inventory_lots FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inventory_thresholds
CREATE POLICY "Users can view their own thresholds"
  ON public.inventory_thresholds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own thresholds"
  ON public.inventory_thresholds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thresholds"
  ON public.inventory_thresholds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thresholds"
  ON public.inventory_thresholds FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inventory_movements
CREATE POLICY "Users can view their own movements"
  ON public.inventory_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movements"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_lots_updated_at
  BEFORE UPDATE ON public.inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_thresholds_updated_at
  BEFORE UPDATE ON public.inventory_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_inventory_lots_blend_id ON public.inventory_lots(blend_batch_id);
CREATE INDEX idx_inventory_lots_location ON public.inventory_lots(location);
CREATE INDEX idx_inventory_lots_status ON public.inventory_lots(status);
CREATE INDEX idx_inventory_lots_bottling_date ON public.inventory_lots(bottling_date);
CREATE INDEX idx_inventory_thresholds_blend_id ON public.inventory_thresholds(blend_batch_id);
CREATE INDEX idx_inventory_movements_lot_id ON public.inventory_movements(lot_id);

-- Function to automatically mark lots as depleted
CREATE OR REPLACE FUNCTION mark_depleted_lots()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_quantity_75cl = 0 AND NEW.current_quantity_150cl = 0 THEN
    NEW.status = 'depleted';
  ELSIF NEW.status = 'depleted' AND (NEW.current_quantity_75cl > 0 OR NEW.current_quantity_150cl > 0) THEN
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_mark_depleted
  BEFORE UPDATE ON public.inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION mark_depleted_lots();