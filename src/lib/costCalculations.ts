import { CostInputs, ScenarioSettings } from "@/stores/costCalculationStore";

export interface YearProjection {
  year: string;
  production: number;
  availableSales: number;
  bottlePrice: number;
  revenue: number;
  cogs: number;
  cogsPerBottle: number;
  labourCost: number;
  overheads: number;
  profit: number;
  profitMargin: number;
  capex: number;
  investment: number;
  cashBalance: number;
}

export interface COGSBreakdown {
  volume: number;
  total: number;
  juice: number;
  yeast: number;
  bottle: number;
  cap: number;
  label: number;
  sugar: number;
  other: number;
}

export const calculateCOGSPerBottle = (inputs: CostInputs): number => {
  const litersPerBottle = 0.75;
  const juiceCost = inputs.juiceCostPerLiter * litersPerBottle;
  const yeastCost = inputs.yeastCostPer1000L / (inputs.productionVolumeLiters / litersPerBottle);
  
  return (
    juiceCost +
    yeastCost +
    inputs.bottleCost75cl +
    inputs.capCost +
    inputs.labelCost +
    inputs.sugarCostPerKg +
    inputs.otherCostsPerBottle
  );
};

export const calculateYearlyProjections = (
  inputs: CostInputs,
  scenario: ScenarioSettings
): YearProjection[] => {
  const productionScales = [1000, 2000, 5000, 15000, 20000, 30000, 50000, 60000, 70000, 150000, 150000];
  const salesAvailability = [200, 1000, 2000, 5000, 15000, 20000, 30000, 50000, 60000, 70000, 150000];
  const laborCosts = [0, 0, 0, 1000000, 1000000, 1200000, 1500000, 1700000, 2000000, 2500000, 4500000];
  
  let cumulativeCash = -inputs.initialInvestment;
  
  return productionScales.map((production, index) => {
    const year = index + 1;
    
    // Apply price strategy
    const priceMultiplier = scenario.priceStrategy === 'aggressive' ? 1.15 : 
                           scenario.priceStrategy === 'conservative' ? 0.9 : 1;
    const yearlyPriceGrowth = inputs.priceInflationYearly / 100;
    const bottlePrice = inputs.bottlePriceExclVAT * priceMultiplier * Math.pow(1 + yearlyPriceGrowth, year - 1);
    
    // Calculate volumes adjusted for yield efficiency
    const effectiveProduction = production * (inputs.yieldEfficiency / 100);
    const availableSales = salesAvailability[index];
    
    // Revenue
    const revenue = availableSales * bottlePrice;
    
    // COGS calculation
    const cogsPerBottle = calculateCOGSPerBottle(inputs);
    const inflationAdjusted = Math.pow(1 + scenario.costInflation / 100, year - 1);
    const cogs = effectiveProduction * cogsPerBottle * inflationAdjusted;
    
    // Labor with growth
    const laborBase = laborCosts[index] || inputs.laborCostMonthly * 12;
    const laborGrowth = Math.pow(1 + inputs.laborGrowthYearly / 100, Math.max(0, year - 4));
    const labourCost = laborBase * laborGrowth;
    
    // Overheads
    const overheadBase = index < 3 ? inputs.overheadCostMonthly : 
                        index < 6 ? inputs.overheadCostMonthly * 30 :
                        index < 9 ? inputs.overheadCostMonthly * 60 :
                        inputs.overheadCostMonthly * 150;
    const overheads = overheadBase;
    
    // Profit
    const profit = revenue - cogs - labourCost - overheads;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    // CAPEX
    const capex = inputs.yearlyCapex[index] || 0;
    const investment = index === 0 ? inputs.initialInvestment : (index === 3 ? 1500000 : 0);
    
    // Cash balance
    cumulativeCash += profit - capex - investment;
    
    return {
      year: `Year ${year} (${2026 + index})`,
      production,
      availableSales,
      bottlePrice: Math.round(bottlePrice),
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      cogsPerBottle: Math.round(cogsPerBottle * inflationAdjusted * 100) / 100,
      labourCost: Math.round(labourCost),
      overheads: Math.round(overheads),
      profit: Math.round(profit),
      profitMargin: Math.round(profitMargin),
      capex,
      investment,
      cashBalance: Math.round(cumulativeCash),
    };
  });
};

export const calculateCOGSBreakdown = (inputs: CostInputs): COGSBreakdown[] => {
  const volumes = [200, 500, 1000, 5000, 10000, 20000, 50000];
  const litersPerBottle = 0.75;
  
  return volumes.map((volume) => {
    const juiceCost = inputs.juiceCostPerLiter * litersPerBottle;
    const yeastCost = inputs.yeastCostPer1000L / (volume / litersPerBottle);
    
    // Scale adjustments for larger volumes
    const bottleCost = volume < 1000 ? inputs.bottleCost75cl * 3.33 : 
                      volume < 5000 ? inputs.bottleCost75cl : 
                      volume < 20000 ? inputs.bottleCost75cl * 0.67 : 
                      inputs.bottleCost75cl * 0.5;
    
    const labelCost = volume < 500 ? inputs.labelCost * 1.5 :
                     volume < 5000 ? inputs.labelCost :
                     volume < 20000 ? inputs.labelCost * 0.5 :
                     inputs.labelCost * 0.125;
    
    const total = juiceCost + yeastCost + bottleCost + inputs.capCost + 
                 labelCost + inputs.sugarCostPerKg + inputs.otherCostsPerBottle;
    
    return {
      volume,
      total: Math.round(total * 100) / 100,
      juice: Math.round(juiceCost * 100) / 100,
      yeast: Math.round(yeastCost * 1000) / 1000,
      bottle: Math.round(bottleCost * 100) / 100,
      cap: inputs.capCost,
      label: Math.round(labelCost * 100) / 100,
      sugar: inputs.sugarCostPerKg,
      other: inputs.otherCostsPerBottle,
    };
  });
};

export const generateRecommendations = (projections: YearProjection[], inputs: CostInputs): string[] => {
  const recommendations: string[] = [];
  
  // Check for negative cash flow years
  const negativeYears = projections.filter(y => y.cashBalance < 0);
  if (negativeYears.length > 0) {
    recommendations.push(
      `🚨 Cash Flow Alert: Negative cash balance in ${negativeYears.map(y => y.year.split(' ')[1]).join(', ')}. ` +
      `Secure ${Math.abs(Math.min(...negativeYears.map(y => y.cashBalance)) / 1000).toFixed(0)}k kr credit line before expansion.`
    );
  }
  
  // Check profitability timing
  const firstProfitable = projections.find(y => y.profit > 0);
  if (firstProfitable) {
    const yearNum = projections.indexOf(firstProfitable) + 1;
    recommendations.push(
      `✅ Break-even achieved in ${firstProfitable.year}. Consider reinvesting ${(firstProfitable.profit * 0.3 / 1000).toFixed(0)}k kr into marketing.`
    );
  }
  
  // Check COGS efficiency
  const avgCOGS = projections.reduce((sum, y) => sum + y.cogsPerBottle, 0) / projections.length;
  if (avgCOGS > 20) {
    recommendations.push(
      `💡 Average COGS is ${avgCOGS.toFixed(1)} kr/bottle. Negotiate bulk contracts to target 15-18 kr by Year 4.`
    );
  }
  
  // Check labor cost ratio
  const highLaborYears = projections.filter(y => y.revenue > 0 && (y.labourCost / y.revenue) > 0.35);
  if (highLaborYears.length > 0) {
    recommendations.push(
      `⚡ Labour costs exceed 35% of revenue in ${highLaborYears.length} years. Implement automation to reduce to 25-30%.`
    );
  }
  
  // Check price optimization
  if (inputs.bottlePriceExclVAT < 120) {
    const priceIncrease = 120 - inputs.bottlePriceExclVAT;
    const additionalRevenue = projections[projections.length - 1].availableSales * priceIncrease;
    recommendations.push(
      `📈 Current pricing is conservative. A ${priceIncrease} kr increase could add ${(additionalRevenue / 1000000).toFixed(1)}M kr revenue by Year 11.`
    );
  }
  
  // Check scaling efficiency
  const laterYears = projections.slice(-3);
  const avgMargin = laterYears.reduce((sum, y) => sum + y.profitMargin, 0) / laterYears.length;
  if (avgMargin > 45) {
    recommendations.push(
      `🎯 Strong margins (${avgMargin.toFixed(0)}%) in mature years. Consider premium product line or geographical expansion.`
    );
  }
  
  return recommendations;
};
