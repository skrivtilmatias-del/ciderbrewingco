// KPI calculation helpers for supplier ledger

export interface PressResult {
  juice_l: number;
  delivery_id: string;
}

export interface QCIncident {
  severity: number;
  qty_kg: number;
}

export interface Delivery {
  id: string;
  qty_kg: number;
  price_per_kg: number;
}

/**
 * Calculate yield in liters per kilogram
 */
export const yieldLPerKg = (juiceL: number, kg: number): number => {
  if (kg === 0) return 0;
  return +(juiceL / kg).toFixed(3);
};

/**
 * Calculate cost per liter
 */
export const costPerL = (kg: number, pricePerKg: number, juiceL: number): number => {
  if (juiceL === 0) return 0;
  return +((kg * pricePerKg) / juiceL).toFixed(4);
};

/**
 * Calculate defect rate percentage
 */
export const defectRatePct = (incidents: QCIncident[]): number => {
  if (incidents.length === 0) return 0;
  
  const totalWeighted = incidents.reduce((sum, i) => sum + i.severity * i.qty_kg, 0);
  const totalKg = incidents.reduce((sum, i) => sum + i.qty_kg, 0);
  
  if (totalKg === 0) return 0;
  return +((totalWeighted / totalKg) * 100).toFixed(2);
};

/**
 * Calculate average yield for a set of deliveries with press results
 */
export const avgYield = (
  deliveries: Delivery[],
  pressResults: PressResult[]
): number => {
  const resultsMap = new Map(pressResults.map(pr => [pr.delivery_id, pr]));
  
  let totalJuice = 0;
  let totalKg = 0;
  
  deliveries.forEach(d => {
    const pr = resultsMap.get(d.id);
    if (pr) {
      totalJuice += pr.juice_l;
      totalKg += d.qty_kg;
    }
  });
  
  return yieldLPerKg(totalJuice, totalKg);
};

/**
 * Calculate average cost per liter
 */
export const avgCostPerL = (
  deliveries: Delivery[],
  pressResults: PressResult[]
): number => {
  const resultsMap = new Map(pressResults.map(pr => [pr.delivery_id, pr]));
  
  let totalCost = 0;
  let totalJuice = 0;
  
  deliveries.forEach(d => {
    const pr = resultsMap.get(d.id);
    if (pr) {
      totalCost += d.qty_kg * d.price_per_kg;
      totalJuice += pr.juice_l;
    }
  });
  
  if (totalJuice === 0) return 0;
  return +(totalCost / totalJuice).toFixed(4);
};

/**
 * Detect price increase alert
 */
export const detectPriceIncrease = (
  recentDeliveries: Delivery[],
  threshold: number = 0.10
): { alert: boolean; change: number } => {
  if (recentDeliveries.length < 2) return { alert: false, change: 0 };
  
  const sorted = [...recentDeliveries].sort((a, b) => a.id.localeCompare(b.id));
  const latest = sorted[sorted.length - 1];
  const previous = sorted.slice(0, -1);
  
  const avgPrevious = previous.reduce((sum, d) => sum + d.price_per_kg, 0) / previous.length;
  const change = (latest.price_per_kg - avgPrevious) / avgPrevious;
  
  return {
    alert: change > threshold,
    change: +(change * 100).toFixed(2)
  };
};

/**
 * Detect yield decrease alert
 */
export const detectYieldDecrease = (
  recentDeliveries: Delivery[],
  pressResults: PressResult[],
  threshold: number = 0.08,
  windowSize: number = 5
): { alert: boolean; change: number } => {
  if (recentDeliveries.length < windowSize + 1) return { alert: false, change: 0 };
  
  const resultsMap = new Map(pressResults.map(pr => [pr.delivery_id, pr]));
  const sorted = [...recentDeliveries].sort((a, b) => a.id.localeCompare(b.id));
  
  const latest = sorted[sorted.length - 1];
  const latestPR = resultsMap.get(latest.id);
  if (!latestPR) return { alert: false, change: 0 };
  
  const latestYield = yieldLPerKg(latestPR.juice_l, latest.qty_kg);
  
  const rolling = sorted.slice(-windowSize - 1, -1);
  const rollingYield = avgYield(rolling, pressResults);
  
  if (rollingYield === 0) return { alert: false, change: 0 };
  const change = (latestYield - rollingYield) / rollingYield;
  
  return {
    alert: change < -threshold,
    change: +(change * 100).toFixed(2)
  };
};