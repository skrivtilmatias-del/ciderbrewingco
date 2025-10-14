/**
 * Economics library for batch and blend cost calculations
 * Provides unit cost, margin, and breakeven analysis
 */

export interface IngredientItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface PackagingItem {
  id: string;
  type: 'bottle' | 'label' | 'cap' | 'box' | 'other';
  name: string;
  quantity: number;
  unitCost: number;
}

export interface LaborItem {
  id: string;
  task: string;
  minutes: number;
  hourlyRate: number;
}

export interface OverheadItem {
  id: string;
  category: string;
  cost: number;
  allocation: 'per_liter' | 'per_batch' | 'percentage';
}

export interface BOMInput {
  volumeLiters: number;
  ingredients: IngredientItem[];
  packaging: PackagingItem[];
  labor: LaborItem[];
  overheads: OverheadItem[];
  wastagePercent: number;
  sellPricePer75cl?: number;
  sellPricePer150cl?: number;
}

export interface EconomicsResult {
  // Total costs
  totalIngredientsCost: number;
  totalPackagingCost: number;
  totalLaborCost: number;
  totalOverheadCost: number;
  totalCOGS: number;
  
  // Unit economics
  cogsPerLiter: number;
  cogsPerBottle75cl: number;
  cogsPerBottle150cl: number;
  
  // Bottling calculations
  effectiveVolumeLiters: number; // After wastage
  bottles75cl: number;
  bottles150cl: number;
  
  // Margins (if price provided)
  grossMargin75cl?: number;
  grossMarginPct75cl?: number;
  grossMargin150cl?: number;
  grossMarginPct150cl?: number;
  
  // Breakeven
  breakevenVolumeLiters: number;
  breakevenBottles75cl: number;
}

/**
 * Calculate comprehensive batch economics
 */
export const calculateEconomics = (input: BOMInput): EconomicsResult => {
  // Calculate ingredient costs
  const totalIngredientsCost = input.ingredients.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost),
    0
  );
  
  // Calculate packaging costs
  const totalPackagingCost = input.packaging.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost),
    0
  );
  
  // Calculate labor costs
  const totalLaborCost = input.labor.reduce(
    (sum, item) => sum + ((item.minutes / 60) * item.hourlyRate),
    0
  );
  
  // Calculate overhead costs
  const totalOverheadCost = input.overheads.reduce((sum, item) => {
    switch (item.allocation) {
      case 'per_liter':
        return sum + (item.cost * input.volumeLiters);
      case 'per_batch':
        return sum + item.cost;
      case 'percentage':
        // Percentage of ingredient + labor costs
        return sum + ((totalIngredientsCost + totalLaborCost) * (item.cost / 100));
      default:
        return sum;
    }
  }, 0);
  
  // Total COGS
  const totalCOGS = totalIngredientsCost + totalPackagingCost + totalLaborCost + totalOverheadCost;
  
  // Effective volume after wastage
  const wastageMultiplier = 1 - (input.wastagePercent / 100);
  const effectiveVolumeLiters = input.volumeLiters * wastageMultiplier;
  
  // Unit costs
  const cogsPerLiter = effectiveVolumeLiters > 0 ? totalCOGS / effectiveVolumeLiters : 0;
  const cogsPerBottle75cl = cogsPerLiter * 0.75;
  const cogsPerBottle150cl = cogsPerLiter * 1.5;
  
  // Bottle counts
  const bottles75cl = Math.floor(effectiveVolumeLiters / 0.75);
  const bottles150cl = Math.floor(effectiveVolumeLiters / 1.5);
  
  // Margin calculations (if price provided)
  let grossMargin75cl: number | undefined;
  let grossMarginPct75cl: number | undefined;
  let grossMargin150cl: number | undefined;
  let grossMarginPct150cl: number | undefined;
  
  if (input.sellPricePer75cl) {
    grossMargin75cl = input.sellPricePer75cl - cogsPerBottle75cl;
    grossMarginPct75cl = (grossMargin75cl / input.sellPricePer75cl) * 100;
  }
  
  if (input.sellPricePer150cl) {
    grossMargin150cl = input.sellPricePer150cl - cogsPerBottle150cl;
    grossMarginPct150cl = (grossMargin150cl / input.sellPricePer150cl) * 100;
  }
  
  // Breakeven calculations
  const fixedCosts = totalLaborCost + input.overheads
    .filter(o => o.allocation === 'per_batch')
    .reduce((sum, o) => sum + o.cost, 0);
  
  const variableCostPerLiter = (totalIngredientsCost + totalPackagingCost) / input.volumeLiters;
  
  // Simplified breakeven at current selling price
  const contributionMargin75cl = input.sellPricePer75cl 
    ? input.sellPricePer75cl - (variableCostPerLiter * 0.75)
    : 0;
  
  const breakevenBottles75cl = contributionMargin75cl > 0
    ? Math.ceil(fixedCosts / contributionMargin75cl)
    : 0;
  
  const breakevenVolumeLiters = breakevenBottles75cl * 0.75;
  
  return {
    totalIngredientsCost,
    totalPackagingCost,
    totalLaborCost,
    totalOverheadCost,
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
    breakevenVolumeLiters,
    breakevenBottles75cl,
  };
};

/**
 * Aggregate BOM costs from multiple source batches for a blend
 */
export interface BlendComponent {
  batchId: string;
  batchName: string;
  volumeLiters: number;
  percentage: number;
  cogsPerLiter: number;
}

export interface BlendEconomicsInput {
  components: BlendComponent[];
  additionalPackaging: PackagingItem[];
  additionalLabor: LaborItem[];
  additionalOverheads: OverheadItem[];
  sellPricePer75cl?: number;
  sellPricePer150cl?: number;
}

export const calculateBlendEconomics = (input: BlendEconomicsInput): EconomicsResult => {
  // Calculate component costs
  const totalVolume = input.components.reduce((sum, c) => sum + c.volumeLiters, 0);
  const totalIngredientsCost = input.components.reduce(
    (sum, c) => sum + (c.volumeLiters * c.cogsPerLiter),
    0
  );
  
  // Additional costs for blending
  const totalPackagingCost = input.additionalPackaging.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost),
    0
  );
  
  const totalLaborCost = input.additionalLabor.reduce(
    (sum, item) => sum + ((item.minutes / 60) * item.hourlyRate),
    0
  );
  
  const totalOverheadCost = input.additionalOverheads.reduce((sum, item) => {
    switch (item.allocation) {
      case 'per_liter':
        return sum + (item.cost * totalVolume);
      case 'per_batch':
        return sum + item.cost;
      case 'percentage':
        return sum + ((totalIngredientsCost + totalLaborCost) * (item.cost / 100));
      default:
        return sum;
    }
  }, 0);
  
  const totalCOGS = totalIngredientsCost + totalPackagingCost + totalLaborCost + totalOverheadCost;
  
  const cogsPerLiter = totalVolume > 0 ? totalCOGS / totalVolume : 0;
  const cogsPerBottle75cl = cogsPerLiter * 0.75;
  const cogsPerBottle150cl = cogsPerLiter * 1.5;
  
  const bottles75cl = Math.floor(totalVolume / 0.75);
  const bottles150cl = Math.floor(totalVolume / 1.5);
  
  // Margin calculations
  let grossMargin75cl: number | undefined;
  let grossMarginPct75cl: number | undefined;
  let grossMargin150cl: number | undefined;
  let grossMarginPct150cl: number | undefined;
  
  if (input.sellPricePer75cl) {
    grossMargin75cl = input.sellPricePer75cl - cogsPerBottle75cl;
    grossMarginPct75cl = (grossMargin75cl / input.sellPricePer75cl) * 100;
  }
  
  if (input.sellPricePer150cl) {
    grossMargin150cl = input.sellPricePer150cl - cogsPerBottle150cl;
    grossMarginPct150cl = (grossMargin150cl / input.sellPricePer150cl) * 100;
  }
  
  return {
    totalIngredientsCost,
    totalPackagingCost,
    totalLaborCost,
    totalOverheadCost,
    totalCOGS,
    cogsPerLiter,
    cogsPerBottle75cl,
    cogsPerBottle150cl,
    effectiveVolumeLiters: totalVolume,
    bottles75cl,
    bottles150cl,
    grossMargin75cl,
    grossMarginPct75cl,
    grossMargin150cl,
    grossMarginPct150cl,
    breakevenVolumeLiters: 0,
    breakevenBottles75cl: 0,
  };
};
