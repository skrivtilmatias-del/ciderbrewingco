import type { CostTemplate, CostScenario, YearlyProjection, SimulationResult } from '@/types/costManagement.types';

/**
 * Calculate comprehensive multi-year financial projections with EBITDA, seasonality, and channels
 */
export function runSimulation(
  template: CostTemplate,
  scenario: CostScenario,
  years: number = 11,
  initialVolumeLiters: number = 1000
): SimulationResult {
  const projections: YearlyProjection[] = [];
  let cumulativeCash = -template.depreciation_yearly; // Initial investment proxy
  
  for (let year = 0; year < years; year++) {
    const projection = calculateYearProjection(
      template,
      scenario,
      year,
      initialVolumeLiters,
      cumulativeCash
    );
    
    cumulativeCash = projection.cumulative_cash_flow;
    projections.push(projection);
  }
  
  // Calculate summary metrics
  const totalRevenue = projections.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalCogs = projections.reduce((sum, p) => sum + p.total_cogs, 0);
  const totalGrossProfit = projections.reduce((sum, p) => sum + p.gross_profit, 0);
  const totalEbitda = projections.reduce((sum, p) => sum + p.ebitda, 0);
  const totalEbit = projections.reduce((sum, p) => sum + p.ebit, 0);
  const totalNetIncome = projections.reduce((sum, p) => sum + p.net_income, 0);
  
  const avgGrossMargin = (totalGrossProfit / totalRevenue) * 100;
  const avgEbitdaMargin = (totalEbitda / totalRevenue) * 100;
  
  // Find breakeven year (first year with positive cumulative cash flow)
  const breakevenYear = projections.findIndex(p => p.cumulative_cash_flow > 0);
  
  // Calculate payback period (interpolated)
  let paybackPeriod: number | undefined;
  if (breakevenYear > 0) {
    const prevYear = projections[breakevenYear - 1];
    const currYear = projections[breakevenYear];
    const ratio = Math.abs(prevYear.cumulative_cash_flow) / 
                  (currYear.cumulative_cash_flow - prevYear.cumulative_cash_flow);
    paybackPeriod = breakevenYear - 1 + ratio;
  }
  
  // Calculate ROI
  const initialInvestment = Math.abs(template.depreciation_yearly);
  const roiPercent = initialInvestment > 0 
    ? (totalNetIncome / initialInvestment) * 100 
    : 0;
  
  return {
    id: '',
    user_id: '',
    scenario_id: scenario.id,
    simulation_date: new Date().toISOString(),
    years_projected: years,
    yearly_projections: projections,
    total_revenue: totalRevenue,
    total_cogs: totalCogs,
    total_gross_profit: totalGrossProfit,
    total_ebitda: totalEbitda,
    total_ebit: totalEbit,
    total_net_income: totalNetIncome,
    avg_gross_margin_percent: avgGrossMargin,
    avg_ebitda_margin_percent: avgEbitdaMargin,
    breakeven_year: breakevenYear >= 0 ? breakevenYear : undefined,
    payback_period_years: paybackPeriod,
    roi_percent: roiPercent,
    created_at: new Date().toISOString(),
  };
}

function calculateYearProjection(
  template: CostTemplate,
  scenario: CostScenario,
  year: number,
  baseVolume: number,
  prevCumulativeCash: number
): YearlyProjection {
  // Apply volume growth and multipliers
  const growthFactor = Math.pow(1 + scenario.demand_growth_yearly / 100, year);
  let volumeLiters = baseVolume * growthFactor * scenario.volume_multiplier;
  
  // Apply capacity constraints
  if (scenario.max_production_liters_yearly) {
    volumeLiters = Math.min(volumeLiters, scenario.max_production_liters_yearly);
  }
  
  // Apply yield efficiency
  const effectiveVolume = volumeLiters * (template.yield_efficiency / 100);
  
  // Calculate bottle production (75cl = 0.75L, 150cl = 1.5L)
  const bottles75cl = Math.floor((effectiveVolume * 0.7) / 0.75); // 70% in 75cl
  const bottles150cl = Math.floor((effectiveVolume * 0.3) / 1.5);  // 30% in 150cl
  
  // Apply storage constraints
  const totalBottles = bottles75cl + bottles150cl;
  let constrainedBottles75cl = bottles75cl;
  let constrainedBottles150cl = bottles150cl;
  
  if (scenario.max_storage_bottles && totalBottles > scenario.max_storage_bottles) {
    const ratio = scenario.max_storage_bottles / totalBottles;
    constrainedBottles75cl = Math.floor(bottles75cl * ratio);
    constrainedBottles150cl = Math.floor(bottles150cl * ratio);
  }
  
  // Calculate pricing with inflation and channel mix
  const inflationFactor = Math.pow(1 + template.price_inflation_yearly / 100, year);
  const basePrice75 = template.bottle_75cl_price * inflationFactor * scenario.price_multiplier;
  const basePrice150 = template.bottle_150cl_price * inflationFactor * scenario.price_multiplier;
  
  // Revenue by channel
  const directRevenue75 = constrainedBottles75cl * basePrice75 * (scenario.direct_sales_percent / 100);
  const wholesaleRevenue75 = constrainedBottles75cl * basePrice75 * 
    (scenario.wholesale_percent / 100) * (1 - scenario.wholesale_discount_percent / 100);
  const retailRevenue75 = constrainedBottles75cl * basePrice75 * 
    (scenario.retail_percent / 100) * (1 - scenario.retail_discount_percent / 100);
  
  const directRevenue150 = constrainedBottles150cl * basePrice150 * (scenario.direct_sales_percent / 100);
  const wholesaleRevenue150 = constrainedBottles150cl * basePrice150 * 
    (scenario.wholesale_percent / 100) * (1 - scenario.wholesale_discount_percent / 100);
  const retailRevenue150 = constrainedBottles150cl * basePrice150 * 
    (scenario.retail_percent / 100) * (1 - scenario.retail_discount_percent / 100);
  
  const totalRevenueDirect = directRevenue75 + directRevenue150;
  const totalRevenueWholesale = wholesaleRevenue75 + wholesaleRevenue150;
  const totalRevenueRetail = retailRevenue75 + retailRevenue150;
  const totalRevenue = totalRevenueDirect + totalRevenueWholesale + totalRevenueRetail;
  
  // Calculate COGS with cost multipliers
  const costInflation = Math.pow(1 + 0.025, year); // 2.5% cost inflation
  
  // Ingredients
  const juiceCost = volumeLiters * template.juice_per_liter * costInflation * scenario.cost_multiplier;
  const yeastCost = (volumeLiters / 1000) * template.yeast_per_1000l * costInflation * scenario.cost_multiplier;
  const sugarCost = volumeLiters * 0.05 * template.sugar_per_kg * costInflation * scenario.cost_multiplier; // Assume 0.05kg per liter
  const otherIngredients = (constrainedBottles75cl + constrainedBottles150cl) * 
    template.other_per_bottle * costInflation * scenario.cost_multiplier;
  const totalIngredients = juiceCost + yeastCost + sugarCost + otherIngredients;
  
  // Packaging
  const bottle75Cost = constrainedBottles75cl * template.bottle_75cl * costInflation * scenario.cost_multiplier;
  const bottle150Cost = constrainedBottles150cl * template.bottle_150cl * costInflation * scenario.cost_multiplier;
  const labelCost = (constrainedBottles75cl + constrainedBottles150cl) * 
    template.label * costInflation * scenario.cost_multiplier;
  const capCost = (constrainedBottles75cl + constrainedBottles150cl) * 
    template.cap * costInflation * scenario.cost_multiplier;
  const boxCost = (constrainedBottles75cl + constrainedBottles150cl) * 
    template.box_cost * costInflation * scenario.cost_multiplier;
  const totalPackaging = bottle75Cost + bottle150Cost + labelCost + capCost + boxCost;
  
  // Labor
  const batchCount = Math.ceil(volumeLiters / 1000); // Assume 1000L per batch
  const laborHours = batchCount * template.hours_per_batch;
  const variableLabor = laborHours * template.hourly_rate * scenario.labor_multiplier;
  const fixedLabor = template.monthly_fixed_labor * 12 * scenario.labor_multiplier;
  const totalLabor = variableLabor + fixedLabor;
  
  const totalCogs = totalIngredients + totalPackaging + totalLabor;
  
  // Overhead
  const fixedOverhead = template.monthly_fixed_overhead * 12;
  const variableOverhead = volumeLiters * template.overhead_per_liter;
  const percentOverhead = totalCogs * (template.overhead_percent_of_cogs / 100);
  const totalOverhead = fixedOverhead + variableOverhead + percentOverhead;
  
  // Inventory holding costs
  const avgInventory = (constrainedBottles75cl + constrainedBottles150cl) / 2;
  const holdingCost = avgInventory * scenario.holding_cost_per_bottle_monthly * 12;
  
  const totalOpex = totalOverhead + holdingCost;
  
  // Profitability calculations
  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  const ebitda = grossProfit - totalOverhead - holdingCost;
  const ebitdaMarginPercent = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
  
  const depreciation = template.depreciation_yearly;
  const ebit = ebitda - depreciation;
  
  const interestExpense = template.interest_expense_yearly;
  const ebt = ebit - interestExpense;
  
  const tax = ebt > 0 ? ebt * (template.tax_rate / 100) : 0;
  const netIncome = ebt - tax;
  const netMarginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  
  // Cash flow
  const cashGenerated = netIncome + depreciation; // Add back non-cash expenses
  const cumulativeCashFlow = prevCumulativeCash + cashGenerated;
  
  // Per unit metrics
  const costPerLiter = effectiveVolume > 0 ? totalCogs / effectiveVolume : 0;
  const costPerBottle75 = constrainedBottles75cl > 0 ? totalCogs * 0.7 / constrainedBottles75cl : 0;
  const costPerBottle150 = constrainedBottles150cl > 0 ? totalCogs * 0.3 / constrainedBottles150cl : 0;
  
  // Breakeven
  const fixedCosts = fixedLabor + fixedOverhead + depreciation + interestExpense;
  const variableMarginPerBottle75 = basePrice75 - costPerBottle75;
  const breakevenBottles = variableMarginPerBottle75 > 0 ? fixedCosts / variableMarginPerBottle75 : 0;
  const breakevenRevenue = breakevenBottles * basePrice75;
  
  return {
    year: year + 1,
    production_liters: volumeLiters,
    bottles_75cl: constrainedBottles75cl,
    bottles_150cl: constrainedBottles150cl,
    
    revenue_direct: totalRevenueDirect,
    revenue_wholesale: totalRevenueWholesale,
    revenue_retail: totalRevenueRetail,
    total_revenue: totalRevenue,
    
    cogs_ingredients: totalIngredients,
    cogs_packaging: totalPackaging,
    cogs_labor: totalLabor,
    total_cogs: totalCogs,
    
    overhead: totalOverhead,
    inventory_holding_cost: holdingCost,
    total_operating_expenses: totalOpex,
    
    gross_profit: grossProfit,
    gross_margin_percent: grossMarginPercent,
    
    ebitda,
    ebitda_margin_percent: ebitdaMarginPercent,
    
    depreciation,
    ebit,
    
    interest_expense: interestExpense,
    ebt,
    
    tax,
    net_income: netIncome,
    net_margin_percent: netMarginPercent,
    
    cash_balance: cashGenerated,
    cumulative_cash_flow: cumulativeCashFlow,
    
    cost_per_liter: costPerLiter,
    cost_per_bottle_75cl: costPerBottle75,
    cost_per_bottle_150cl: costPerBottle150,
    
    breakeven_bottles: breakevenBottles,
    breakeven_revenue: breakevenRevenue,
  };
}

/**
 * Format currency values
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate recommendations based on simulation results
 */
export function generateRecommendations(result: SimulationResult): string[] {
  const recommendations: string[] = [];
  const projections = result.yearly_projections;
  
  // Check profitability
  if (result.breakeven_year === undefined || result.breakeven_year > 5) {
    recommendations.push('⚠️ Breakeven takes more than 5 years. Consider reducing costs or increasing prices.');
  }
  
  // Check margins
  if (result.avg_gross_margin_percent < 40) {
    recommendations.push('📉 Gross margin below 40%. Review pricing strategy or cost structure.');
  }
  
  if (result.avg_ebitda_margin_percent < 20) {
    recommendations.push('💰 EBITDA margin below 20%. Optimize overhead costs and operational efficiency.');
  }
  
  // Check growth trajectory
  const lastYear = projections[projections.length - 1];
  const midYear = projections[Math.floor(projections.length / 2)];
  const revenueGrowth = ((lastYear.total_revenue - midYear.total_revenue) / midYear.total_revenue) * 100;
  
  if (revenueGrowth < 20) {
    recommendations.push('📈 Revenue growth is slowing. Consider market expansion or product diversification.');
  }
  
  // Check ROI
  if (result.roi_percent && result.roi_percent < 50) {
    recommendations.push('💵 ROI below 50%. Evaluate if this investment meets your return requirements.');
  }
  
  // Positive signals
  if (result.avg_ebitda_margin_percent > 30) {
    recommendations.push('✅ Strong EBITDA margin indicates healthy operational efficiency.');
  }
  
  if (result.breakeven_year !== undefined && result.breakeven_year <= 2) {
    recommendations.push('✅ Fast breakeven demonstrates strong business model viability.');
  }
  
  return recommendations;
}
