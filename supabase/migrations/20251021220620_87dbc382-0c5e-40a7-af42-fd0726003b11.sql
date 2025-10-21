-- Create cost templates table for reusable cost models
CREATE TABLE public.cost_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'standard', -- standard, actual, budgeted
  
  -- Ingredient costs
  juice_per_liter NUMERIC NOT NULL DEFAULT 8,
  yeast_per_1000l NUMERIC NOT NULL DEFAULT 741,
  sugar_per_kg NUMERIC NOT NULL DEFAULT 0.1,
  other_per_bottle NUMERIC NOT NULL DEFAULT 10.96,
  
  -- Packaging costs
  bottle_75cl NUMERIC NOT NULL DEFAULT 3,
  bottle_150cl NUMERIC NOT NULL DEFAULT 5,
  label NUMERIC NOT NULL DEFAULT 4,
  cap NUMERIC NOT NULL DEFAULT 0.1,
  box_cost NUMERIC NOT NULL DEFAULT 2,
  
  -- Labor config
  hourly_rate NUMERIC NOT NULL DEFAULT 350,
  hours_per_batch NUMERIC NOT NULL DEFAULT 8,
  monthly_fixed_labor NUMERIC NOT NULL DEFAULT 0,
  
  -- Overhead config
  monthly_fixed_overhead NUMERIC NOT NULL DEFAULT 10000,
  overhead_per_liter NUMERIC NOT NULL DEFAULT 0.5,
  overhead_percent_of_cogs NUMERIC NOT NULL DEFAULT 15,
  
  -- Production config
  wastage_percent NUMERIC NOT NULL DEFAULT 5,
  yield_efficiency NUMERIC NOT NULL DEFAULT 95,
  
  -- Pricing
  bottle_75cl_price NUMERIC NOT NULL DEFAULT 110,
  bottle_150cl_price NUMERIC NOT NULL DEFAULT 200,
  price_inflation_yearly NUMERIC NOT NULL DEFAULT 3,
  
  -- EBITDA components
  depreciation_yearly NUMERIC NOT NULL DEFAULT 0,
  interest_expense_yearly NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 22, -- Denmark corporate tax
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cost scenarios table for what-if analysis
CREATE TABLE public.cost_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.cost_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scenario_type TEXT NOT NULL DEFAULT 'realistic', -- best, worst, realistic, custom
  
  -- Scenario multipliers
  volume_multiplier NUMERIC NOT NULL DEFAULT 1,
  price_multiplier NUMERIC NOT NULL DEFAULT 1,
  cost_multiplier NUMERIC NOT NULL DEFAULT 1,
  labor_multiplier NUMERIC NOT NULL DEFAULT 1,
  demand_growth_yearly NUMERIC NOT NULL DEFAULT 50,
  
  -- Capacity constraints
  max_production_liters_yearly NUMERIC,
  max_storage_bottles NUMERIC,
  
  -- Sales channel mix (percentages, should sum to 100)
  direct_sales_percent NUMERIC NOT NULL DEFAULT 40,
  wholesale_percent NUMERIC NOT NULL DEFAULT 40,
  retail_percent NUMERIC NOT NULL DEFAULT 20,
  
  -- Channel pricing adjustments
  wholesale_discount_percent NUMERIC NOT NULL DEFAULT 15,
  retail_discount_percent NUMERIC NOT NULL DEFAULT 10,
  
  -- Inventory costs
  holding_cost_per_bottle_monthly NUMERIC NOT NULL DEFAULT 0.5,
  
  -- Seasonality (JSON array of 12 monthly multipliers)
  seasonal_demand_factors JSONB DEFAULT '[1,1,1,1,1,1,1,1,1,1,1,1]'::jsonb,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create simulation results table
CREATE TABLE public.simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scenario_id UUID REFERENCES public.cost_scenarios(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  blend_id UUID REFERENCES public.blend_batches(id) ON DELETE SET NULL,
  
  simulation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  years_projected INTEGER NOT NULL DEFAULT 11,
  
  -- Aggregated results (JSONB for flexibility)
  yearly_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Summary metrics
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_cogs NUMERIC NOT NULL DEFAULT 0,
  total_gross_profit NUMERIC NOT NULL DEFAULT 0,
  total_ebitda NUMERIC NOT NULL DEFAULT 0,
  total_ebit NUMERIC NOT NULL DEFAULT 0,
  total_net_income NUMERIC NOT NULL DEFAULT 0,
  
  avg_gross_margin_percent NUMERIC NOT NULL DEFAULT 0,
  avg_ebitda_margin_percent NUMERIC NOT NULL DEFAULT 0,
  breakeven_year INTEGER,
  payback_period_years NUMERIC,
  roi_percent NUMERIC,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cost snapshots table for historical tracking
CREATE TABLE public.cost_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  blend_id UUID REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.cost_templates(id) ON DELETE SET NULL,
  
  snapshot_stage TEXT NOT NULL, -- planning, production, completion, bottling
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Snapshot data
  planned_costs JSONB NOT NULL DEFAULT '{}'::jsonb,
  actual_costs JSONB NOT NULL DEFAULT '{}'::jsonb,
  variance JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Summary
  total_planned_cost NUMERIC NOT NULL DEFAULT 0,
  total_actual_cost NUMERIC NOT NULL DEFAULT 0,
  variance_amount NUMERIC NOT NULL DEFAULT 0,
  variance_percent NUMERIC NOT NULL DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cost alerts table
CREATE TABLE public.cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  blend_id UUID REFERENCES public.blend_batches(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL, -- overrun, variance, threshold
  severity TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
  
  message TEXT NOT NULL,
  threshold_percent NUMERIC,
  actual_percent NUMERIC,
  
  is_read BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_templates
CREATE POLICY "Production users can view templates"
  ON public.cost_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can create templates"
  ON public.cost_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can update templates"
  ON public.cost_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can delete templates"
  ON public.cost_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

-- RLS Policies for cost_scenarios
CREATE POLICY "Production users can view scenarios"
  ON public.cost_scenarios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can create scenarios"
  ON public.cost_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can update scenarios"
  ON public.cost_scenarios FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can delete scenarios"
  ON public.cost_scenarios FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

-- RLS Policies for simulation_results
CREATE POLICY "Production users can view simulation results"
  ON public.simulation_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can create simulation results"
  ON public.simulation_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can delete simulation results"
  ON public.simulation_results FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

-- RLS Policies for cost_snapshots
CREATE POLICY "Production users can view snapshots"
  ON public.cost_snapshots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can create snapshots"
  ON public.cost_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

-- RLS Policies for cost_alerts
CREATE POLICY "Production users can view alerts"
  ON public.cost_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

CREATE POLICY "Production users can update alerts"
  ON public.cost_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'production'));

-- Create triggers for updated_at
CREATE TRIGGER update_cost_templates_updated_at
  BEFORE UPDATE ON public.cost_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_scenarios_updated_at
  BEFORE UPDATE ON public.cost_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_cost_templates_user_id ON public.cost_templates(user_id);
CREATE INDEX idx_cost_scenarios_user_id ON public.cost_scenarios(user_id);
CREATE INDEX idx_cost_scenarios_template_id ON public.cost_scenarios(template_id);
CREATE INDEX idx_simulation_results_user_id ON public.simulation_results(user_id);
CREATE INDEX idx_simulation_results_scenario_id ON public.simulation_results(scenario_id);
CREATE INDEX idx_cost_snapshots_batch_id ON public.cost_snapshots(batch_id);
CREATE INDEX idx_cost_snapshots_blend_id ON public.cost_snapshots(blend_id);
CREATE INDEX idx_cost_alerts_user_id ON public.cost_alerts(user_id);
CREATE INDEX idx_cost_alerts_batch_id ON public.cost_alerts(batch_id);
CREATE INDEX idx_cost_alerts_is_read ON public.cost_alerts(is_read) WHERE is_read = false;