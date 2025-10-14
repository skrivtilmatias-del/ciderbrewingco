-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  min_qty NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts for their suppliers"
  ON public.contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = contracts.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create contracts for their suppliers"
  ON public.contracts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = contracts.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update contracts for their suppliers"
  ON public.contracts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = contracts.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete contracts for their suppliers"
  ON public.contracts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = contracts.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Deliveries table
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qty_kg NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  lot_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliveries for their suppliers"
  ON public.deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = deliveries.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create deliveries for their suppliers"
  ON public.deliveries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = deliveries.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update deliveries for their suppliers"
  ON public.deliveries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = deliveries.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete deliveries for their suppliers"
  ON public.deliveries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = deliveries.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Press results table
CREATE TABLE public.press_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  juice_l NUMERIC NOT NULL,
  pomace_kg NUMERIC NOT NULL,
  brix NUMERIC,
  ph NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.press_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view press results for their deliveries"
  ON public.press_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = press_results.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create press results for their deliveries"
  ON public.press_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = press_results.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update press results for their deliveries"
  ON public.press_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = press_results.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete press results for their deliveries"
  ON public.press_results FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = press_results.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE TRIGGER update_press_results_updated_at
  BEFORE UPDATE ON public.press_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- QC incidents table
CREATE TABLE public.qc_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  qty_kg NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.qc_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view QC incidents for their deliveries"
  ON public.qc_incidents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = qc_incidents.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create QC incidents for their deliveries"
  ON public.qc_incidents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = qc_incidents.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update QC incidents for their deliveries"
  ON public.qc_incidents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = qc_incidents.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete QC incidents for their deliveries"
  ON public.qc_incidents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.deliveries
    JOIN public.suppliers ON suppliers.id = deliveries.supplier_id
    WHERE deliveries.id = qc_incidents.delivery_id
    AND suppliers.user_id = auth.uid()
  ));

CREATE TRIGGER update_qc_incidents_updated_at
  BEFORE UPDATE ON public.qc_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_contracts_supplier_id ON public.contracts(supplier_id);
CREATE INDEX idx_deliveries_supplier_id ON public.deliveries(supplier_id);
CREATE INDEX idx_deliveries_lot_code ON public.deliveries(lot_code);
CREATE INDEX idx_press_results_delivery_id ON public.press_results(delivery_id);
CREATE INDEX idx_qc_incidents_delivery_id ON public.qc_incidents(delivery_id);