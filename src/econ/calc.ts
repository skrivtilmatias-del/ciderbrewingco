/**
 * Pure economic calculation functions
 */

import { EconInput, EconResult, Scenario } from './types';

/**
 * Calculate comprehensive batch economics
 * Pure function - no side effects
 */
export const calcEconomics = (input: EconInput): EconResult => {
  const { ingredients, packaging, labor, overhead, production, pricing } = input;

  // Effective volume after wastage and yield efficiency
  const wastageMultiplier = 1 - production.wastagePercent / 100;
  const yieldMultiplier = production.yieldEfficiency / 100;
  const effectiveVolumeLiters =
    production.volumeLiters * wastageMultiplier * yieldMultiplier;

  // Calculate bottle counts
  const bottles75cl = Math.floor(effectiveVolumeLiters / 0.75);
  const bottles150cl = Math.floor(effectiveVolumeLiters / 1.5);

  // Ingredient costs
  const juiceCost = ingredients.juicePerLiter * production.volumeLiters;
  const yeastCost = (ingredients.yeastPer1000L / 1000) * production.volumeLiters;
  const totalIngredients = juiceCost + yeastCost;

  // Packaging costs (for all bottles)
  const totalPackaging =
    bottles75cl * (packaging.bottle75cl + packaging.label + packaging.cap) +
    bottles150cl * (packaging.bottle150cl + packaging.label + packaging.cap);

  // Labor costs
  const totalLabor = labor.hoursPerBatch * labor.hourlyRate + labor.monthlyFixed;

  // Overhead allocation
  const perLiterOverhead = overhead.perLiter * effectiveVolumeLiters;
  const baseOverhead = overhead.monthlyFixed;
  const percentageOverhead =
    (totalIngredients + totalPackaging) * (overhead.percentOfCOGS / 100);
  const totalOverhead = baseOverhead + perLiterOverhead + percentageOverhead;

  // Total COGS
  const totalCOGS = totalIngredients + totalPackaging + totalLabor + totalOverhead;

  // Per unit costs
  const cogsPerLiter = effectiveVolumeLiters > 0 ? totalCOGS / effectiveVolumeLiters : 0;
  const cogsPerBottle75cl = cogsPerLiter * 0.75;
  const cogsPerBottle150cl = cogsPerLiter * 1.5;

  // Revenue calculations
  const revenue75cl = bottles75cl * pricing.bottle75clExclVAT;
  const revenue150cl = bottles150cl * pricing.bottle150clExclVAT;
  const totalRevenue = revenue75cl + revenue150cl;

  // Profit
  const totalProfit = totalRevenue - totalCOGS;

  // Margins
  const grossMargin75cl = pricing.bottle75clExclVAT - cogsPerBottle75cl;
  const grossMarginPct75cl =
    pricing.bottle75clExclVAT > 0
      ? (grossMargin75cl / pricing.bottle75clExclVAT) * 100
      : 0;

  const grossMargin150cl = pricing.bottle150clExclVAT - cogsPerBottle150cl;
  const grossMarginPct150cl =
    pricing.bottle150clExclVAT > 0
      ? (grossMargin150cl / pricing.bottle150clExclVAT) * 100
      : 0;

  // Breakeven analysis
  const fixedCosts = totalLabor + baseOverhead;
  const variableCostPerBottle75cl =
    (totalIngredients + totalPackaging + perLiterOverhead + percentageOverhead) /
    (bottles75cl + bottles150cl * 2); // Weight 150cl as 2x

  const contributionMargin75cl = pricing.bottle75clExclVAT - variableCostPerBottle75cl;
  const breakevenBottles75cl =
    contributionMargin75cl > 0 ? Math.ceil(fixedCosts / contributionMargin75cl) : 0;
  const breakevenVolumeLiters = breakevenBottles75cl * 0.75;
  const breakevenRevenue = breakevenBottles75cl * pricing.bottle75clExclVAT;

  // Breakdown
  const breakdown = {
    juice: juiceCost,
    yeast: yeastCost,
    packaging: totalPackaging,
    labor: totalLabor,
    overhead: totalOverhead,
  };

  return {
    totalIngredients,
    totalPackaging,
    totalLabor,
    totalOverhead,
    totalCOGS,
    cogsPerLiter,
    cogsPerBottle75cl,
    cogsPerBottle150cl,
    effectiveVolumeLiters,
    bottles75cl,
    bottles150cl,
    grossMargin75cl,
    grossMarginPct75cl,
    grossMargin150cl,
    grossMarginPct150cl,
    revenue75cl,
    revenue150cl,
    totalRevenue,
    totalProfit,
    breakevenBottles75cl,
    breakevenVolumeLiters,
    breakevenRevenue,
    breakdown,
  };
};

/**
 * Apply scenario modifiers to base input
 */
export const applyScenario = (base: EconInput, scenario: Scenario): EconInput => {
  return {
    ...base,
    ingredients: {
      ...base.ingredients,
      juicePerLiter: base.ingredients.juicePerLiter * scenario.appleCostMultiplier,
    },
    labor: {
      ...base.labor,
      hourlyRate: base.labor.hourlyRate * scenario.laborMultiplier,
      monthlyFixed: base.labor.monthlyFixed * scenario.laborMultiplier,
    },
    production: {
      ...base.production,
      volumeLiters: base.production.volumeLiters * scenario.volumeMultiplier,
    },
    pricing: {
      ...base.pricing,
      bottle75clExclVAT: base.pricing.bottle75clExclVAT * scenario.priceMultiplier,
      bottle150clExclVAT: base.pricing.bottle150clExclVAT * scenario.priceMultiplier,
      priceInflationYearly: scenario.inflationYearly,
    },
  };
};

/**
 * Calculate variance between planned and actual
 */
export const calcVariance = (
  planned: EconResult,
  actual: EconResult
): {
  cogsPerLiter: { value: number; pct: number };
  grossMarginPct75cl: { value: number; pct: number };
  totalCOGS: { value: number; pct: number };
  totalProfit: { value: number; pct: number };
} => {
  const variance = (actual: number, planned: number) => ({
    value: actual - planned,
    pct: planned !== 0 ? ((actual - planned) / planned) * 100 : 0,
  });

  return {
    cogsPerLiter: variance(actual.cogsPerLiter, planned.cogsPerLiter),
    grossMarginPct75cl: variance(actual.grossMarginPct75cl, planned.grossMarginPct75cl),
    totalCOGS: variance(actual.totalCOGS, planned.totalCOGS),
    totalProfit: variance(actual.totalProfit, planned.totalProfit),
  };
};

/**
 * Generate price sensitivity analysis
 * Returns array of results at different price points
 */
export const priceSensitivity = (
  input: EconInput,
  priceRange: { min: number; max: number; steps: number }
): Array<{ price: number; margin: number; marginPct: number; revenue: number }> => {
  const results: Array<{
    price: number;
    margin: number;
    marginPct: number;
    revenue: number;
  }> = [];
  const step = (priceRange.max - priceRange.min) / priceRange.steps;

  for (let i = 0; i <= priceRange.steps; i++) {
    const price = priceRange.min + i * step;
    const modifiedInput = {
      ...input,
      pricing: { ...input.pricing, bottle75clExclVAT: price },
    };

    const result = calcEconomics(modifiedInput);
    results.push({
      price,
      margin: result.grossMargin75cl,
      marginPct: result.grossMarginPct75cl,
      revenue: result.revenue75cl,
    });
  }

  return results;
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)} kr`;
};

/**
 * Format percentage for display
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
