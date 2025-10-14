import { z } from 'zod';

/**
 * Economic planning types with Zod validation
 */

// Base ingredient cost
export const IngredientCostZ = z.object({
  juicePerLiter: z.number().min(0),
  yeastPer1000L: z.number().min(0),
  sugarPerKg: z.number().min(0),
  otherPerBottle: z.number().min(0),
});

// Packaging costs
export const PackagingCostZ = z.object({
  bottle75cl: z.number().min(0),
  bottle150cl: z.number().min(0),
  label: z.number().min(0),
  cap: z.number().min(0),
  box: z.number().min(0),
});

// Labor configuration
export const LaborConfigZ = z.object({
  hourlyRate: z.number().min(0),
  hoursPerBatch: z.number().min(0),
  monthlyFixed: z.number().min(0),
});

// Overhead allocation
export const OverheadConfigZ = z.object({
  monthlyFixed: z.number().min(0),
  perLiter: z.number().min(0),
  percentOfCOGS: z.number().min(0).max(100),
});

// Production configuration
export const ProductionConfigZ = z.object({
  volumeLiters: z.number().min(1),
  wastagePercent: z.number().min(0).max(100).default(5),
  yieldEfficiency: z.number().min(0).max(100).default(95),
});

// Pricing
export const PricingConfigZ = z.object({
  bottle75clExclVAT: z.number().min(0),
  bottle150clExclVAT: z.number().min(0),
  priceInflationYearly: z.number().min(0).max(100).default(3),
});

// Complete economic input
export const EconInputZ = z.object({
  ingredients: IngredientCostZ,
  packaging: PackagingCostZ,
  labor: LaborConfigZ,
  overhead: OverheadConfigZ,
  production: ProductionConfigZ,
  pricing: PricingConfigZ,
});

export type EconInput = z.infer<typeof EconInputZ>;
export type IngredientCost = z.infer<typeof IngredientCostZ>;
export type PackagingCost = z.infer<typeof PackagingCostZ>;
export type LaborConfig = z.infer<typeof LaborConfigZ>;
export type OverheadConfig = z.infer<typeof OverheadConfigZ>;
export type ProductionConfig = z.infer<typeof ProductionConfigZ>;
export type PricingConfig = z.infer<typeof PricingConfigZ>;

// Scenario modifiers
export const ScenarioZ = z.object({
  name: z.string(),
  volumeMultiplier: z.number().min(0).default(1),
  priceMultiplier: z.number().min(0).default(1),
  appleCostMultiplier: z.number().min(0).default(1),
  laborMultiplier: z.number().min(0).default(1),
  inflationYearly: z.number().min(0).max(100).default(2.5),
});

export type Scenario = z.infer<typeof ScenarioZ>;

// Economic results
export interface EconResult {
  // Costs
  totalIngredients: number;
  totalPackaging: number;
  totalLabor: number;
  totalOverhead: number;
  totalCOGS: number;

  // Per unit
  cogsPerLiter: number;
  cogsPerBottle75cl: number;
  cogsPerBottle150cl: number;

  // Production
  effectiveVolumeLiters: number;
  bottles75cl: number;
  bottles150cl: number;

  // Margins
  grossMargin75cl: number;
  grossMarginPct75cl: number;
  grossMargin150cl: number;
  grossMarginPct150cl: number;

  // Revenue
  revenue75cl: number;
  revenue150cl: number;
  totalRevenue: number;
  totalProfit: number;

  // Breakeven
  breakevenBottles75cl: number;
  breakevenVolumeLiters: number;
  breakevenRevenue: number;

  // Breakdown
  breakdown: {
    juice: number;
    yeast: number;
    packaging: number;
    labor: number;
    overhead: number;
  };
}

// Variance tracking (Planned vs Actual)
export interface EconVariance {
  batchId: string;
  batchName: string;
  planned: EconResult;
  actual: EconResult;
  variances: {
    cogsPerLiter: { value: number; pct: number };
    grossMarginPct75cl: { value: number; pct: number };
    totalCOGS: { value: number; pct: number };
    totalProfit: { value: number; pct: number };
  };
}

// Default values
export const DEFAULT_ECON_INPUT: EconInput = {
  ingredients: {
    juicePerLiter: 8,
    yeastPer1000L: 741,
    sugarPerKg: 0.1,
    otherPerBottle: 10.96,
  },
  packaging: {
    bottle75cl: 3,
    bottle150cl: 5,
    label: 4,
    cap: 0.1,
    box: 2,
  },
  labor: {
    hourlyRate: 350,
    hoursPerBatch: 8,
    monthlyFixed: 0,
  },
  overhead: {
    monthlyFixed: 10000,
    perLiter: 0.5,
    percentOfCOGS: 15,
  },
  production: {
    volumeLiters: 1000,
    wastagePercent: 5,
    yieldEfficiency: 95,
  },
  pricing: {
    bottle75clExclVAT: 110,
    bottle150clExclVAT: 200,
    priceInflationYearly: 3,
  },
};

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    name: 'Base Case',
    volumeMultiplier: 1,
    priceMultiplier: 1,
    appleCostMultiplier: 1,
    laborMultiplier: 1,
    inflationYearly: 2.5,
  },
  {
    name: 'High Volume',
    volumeMultiplier: 5,
    priceMultiplier: 0.95,
    appleCostMultiplier: 0.85,
    laborMultiplier: 1.2,
    inflationYearly: 2.5,
  },
  {
    name: 'Premium Pricing',
    volumeMultiplier: 1,
    priceMultiplier: 1.25,
    appleCostMultiplier: 1.1,
    laborMultiplier: 1,
    inflationYearly: 2.5,
  },
  {
    name: 'Cost Pressure',
    volumeMultiplier: 1,
    priceMultiplier: 1,
    appleCostMultiplier: 1.3,
    laborMultiplier: 1.15,
    inflationYearly: 5,
  },
];
