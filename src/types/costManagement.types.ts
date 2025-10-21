/**
 * Cost Management type definitions
 */

export interface CostTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_type: 'standard' | 'actual' | 'budgeted';
  
  // Ingredient costs
  juice_per_liter: number;
  yeast_per_1000l: number;
  sugar_per_kg: number;
  other_per_bottle: number;
  
  // Packaging costs
  bottle_75cl: number;
  bottle_150cl: number;
  label: number;
  cap: number;
  box_cost: number;
  
  // Labor config
  hourly_rate: number;
  hours_per_batch: number;
  monthly_fixed_labor: number;
  
  // Overhead config
  monthly_fixed_overhead: number;
  overhead_per_liter: number;
  overhead_percent_of_cogs: number;
  
  // Production config
  wastage_percent: number;
  yield_efficiency: number;
  
  // Pricing
  bottle_75cl_price: number;
  bottle_150cl_price: number;
  price_inflation_yearly: number;
  
  // EBITDA components
  depreciation_yearly: number;
  interest_expense_yearly: number;
  tax_rate: number;
  
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostScenario {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  scenario_type: 'best' | 'worst' | 'realistic' | 'custom';
  
  // Scenario multipliers
  volume_multiplier: number;
  price_multiplier: number;
  cost_multiplier: number;
  labor_multiplier: number;
  demand_growth_yearly: number;
  
  // Capacity constraints
  max_production_liters_yearly?: number;
  max_storage_bottles?: number;
  
  // Sales channel mix
  direct_sales_percent: number;
  wholesale_percent: number;
  retail_percent: number;
  
  // Channel pricing adjustments
  wholesale_discount_percent: number;
  retail_discount_percent: number;
  
  // Inventory costs
  holding_cost_per_bottle_monthly: number;
  
  // Seasonality
  seasonal_demand_factors: number[];
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface YearlyProjection {
  year: number;
  production_liters: number;
  bottles_75cl: number;
  bottles_150cl: number;
  
  // Revenue breakdown
  revenue_direct: number;
  revenue_wholesale: number;
  revenue_retail: number;
  total_revenue: number;
  
  // Cost breakdown
  cogs_ingredients: number;
  cogs_packaging: number;
  cogs_labor: number;
  total_cogs: number;
  
  // Operating expenses
  overhead: number;
  inventory_holding_cost: number;
  total_operating_expenses: number;
  
  // Profitability
  gross_profit: number;
  gross_margin_percent: number;
  
  ebitda: number;
  ebitda_margin_percent: number;
  
  depreciation: number;
  ebit: number;
  
  interest_expense: number;
  ebt: number;
  
  tax: number;
  net_income: number;
  net_margin_percent: number;
  
  // Cash flow
  cash_balance: number;
  cumulative_cash_flow: number;
  
  // Per unit metrics
  cost_per_liter: number;
  cost_per_bottle_75cl: number;
  cost_per_bottle_150cl: number;
  
  // Breakeven
  breakeven_bottles: number;
  breakeven_revenue: number;
}

export interface SimulationResult {
  id: string;
  user_id: string;
  scenario_id: string;
  batch_id?: string;
  blend_id?: string;
  
  simulation_date: string;
  years_projected: number;
  
  yearly_projections: YearlyProjection[];
  
  // Summary metrics
  total_revenue: number;
  total_cogs: number;
  total_gross_profit: number;
  total_ebitda: number;
  total_ebit: number;
  total_net_income: number;
  
  avg_gross_margin_percent: number;
  avg_ebitda_margin_percent: number;
  breakeven_year?: number;
  payback_period_years?: number;
  roi_percent?: number;
  
  created_at: string;
}

export interface CostSnapshot {
  id: string;
  user_id: string;
  batch_id?: string;
  blend_id?: string;
  template_id?: string;
  
  snapshot_stage: 'planning' | 'production' | 'completion' | 'bottling';
  snapshot_date: string;
  
  planned_costs: Record<string, number>;
  actual_costs: Record<string, number>;
  variance: Record<string, number>;
  
  total_planned_cost: number;
  total_actual_cost: number;
  variance_amount: number;
  variance_percent: number;
  
  notes?: string;
  created_at: string;
}

export interface CostAlert {
  id: string;
  user_id: string;
  batch_id?: string;
  blend_id?: string;
  
  alert_type: 'overrun' | 'variance' | 'threshold';
  severity: 'info' | 'warning' | 'critical';
  
  message: string;
  threshold_percent?: number;
  actual_percent?: number;
  
  is_read: boolean;
  resolved_at?: string;
  
  created_at: string;
}

export interface ComparisonData {
  metric: string;
  thisYear: number;
  lastYear: number;
  variance: number;
  variancePercent: number;
}

export interface VarietyProfitability {
  variety: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  volumeLiters: number;
}
