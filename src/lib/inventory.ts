/**
 * Inventory management with FIFO allocation
 */

export interface InventoryLot {
  id: string;
  blend_batch_id: string;
  lot_number: string;
  bottling_date: string;
  location: string;
  initial_quantity_75cl: number;
  current_quantity_75cl: number;
  initial_quantity_150cl: number;
  current_quantity_150cl: number;
  status: 'active' | 'depleted' | 'reserved';
}

export interface AllocationRequest {
  blendBatchId: string;
  location: string;
  quantity75cl?: number;
  quantity150cl?: number;
}

export interface AllocationResult {
  success: boolean;
  allocations: {
    lotId: string;
    lotNumber: string;
    quantity75cl: number;
    quantity150cl: number;
  }[];
  remainingNeeded75cl: number;
  remainingNeeded150cl: number;
}

/**
 * Allocate inventory using FIFO (First In, First Out) method
 * Oldest lots are consumed first
 */
export const allocateFIFO = (
  lots: InventoryLot[],
  request: AllocationRequest
): AllocationResult => {
  // Filter and sort lots by bottling date (oldest first)
  const availableLots = lots
    .filter(
      (lot) =>
        lot.blend_batch_id === request.blendBatchId &&
        lot.location === request.location &&
        lot.status === 'active' &&
        (lot.current_quantity_75cl > 0 || lot.current_quantity_150cl > 0)
    )
    .sort(
      (a, b) =>
        new Date(a.bottling_date).getTime() - new Date(b.bottling_date).getTime()
    );

  const allocations: AllocationResult['allocations'] = [];
  let remaining75cl = request.quantity75cl || 0;
  let remaining150cl = request.quantity150cl || 0;

  // Allocate from oldest lots first
  for (const lot of availableLots) {
    if (remaining75cl === 0 && remaining150cl === 0) break;

    const allocated75cl = Math.min(remaining75cl, lot.current_quantity_75cl);
    const allocated150cl = Math.min(remaining150cl, lot.current_quantity_150cl);

    if (allocated75cl > 0 || allocated150cl > 0) {
      allocations.push({
        lotId: lot.id,
        lotNumber: lot.lot_number,
        quantity75cl: allocated75cl,
        quantity150cl: allocated150cl,
      });

      remaining75cl -= allocated75cl;
      remaining150cl -= allocated150cl;
    }
  }

  return {
    success: remaining75cl === 0 && remaining150cl === 0,
    allocations,
    remainingNeeded75cl: remaining75cl,
    remainingNeeded150cl: remaining150cl,
  };
};

/**
 * Check if inventory is below threshold
 */
export interface InventoryAlert {
  blendBatchId: string;
  blendName: string;
  location: string;
  current75cl: number;
  current150cl: number;
  threshold75cl: number;
  threshold150cl: number;
  severity: 'low' | 'critical';
}

export const checkLowStock = (
  lots: InventoryLot[],
  thresholds: {
    blend_batch_id: string;
    location: string;
    min_quantity_75cl: number;
    min_quantity_150cl: number;
  }[],
  blendNames: Map<string, string>
): InventoryAlert[] => {
  const alerts: InventoryAlert[] = [];

  // Group lots by blend and location
  const inventory = new Map<string, { qty75: number; qty150: number }>();

  for (const lot of lots.filter((l) => l.status === 'active')) {
    const key = `${lot.blend_batch_id}:${lot.location}`;
    const current = inventory.get(key) || { qty75: 0, qty150: 0 };
    inventory.set(key, {
      qty75: current.qty75 + lot.current_quantity_75cl,
      qty150: current.qty150 + lot.current_quantity_150cl,
    });
  }

  // Check against thresholds
  for (const threshold of thresholds) {
    const key = `${threshold.blend_batch_id}:${threshold.location}`;
    const current = inventory.get(key) || { qty75: 0, qty150: 0 };

    const below75 = current.qty75 < threshold.min_quantity_75cl;
    const below150 = current.qty150 < threshold.min_quantity_150cl;

    if (below75 || below150) {
      const pct75 = threshold.min_quantity_75cl > 0
        ? (current.qty75 / threshold.min_quantity_75cl) * 100
        : 100;
      const pct150 = threshold.min_quantity_150cl > 0
        ? (current.qty150 / threshold.min_quantity_150cl) * 100
        : 100;

      const minPct = Math.min(pct75, pct150);

      alerts.push({
        blendBatchId: threshold.blend_batch_id,
        blendName: blendNames.get(threshold.blend_batch_id) || 'Unknown',
        location: threshold.location,
        current75cl: current.qty75,
        current150cl: current.qty150,
        threshold75cl: threshold.min_quantity_75cl,
        threshold150cl: threshold.min_quantity_150cl,
        severity: minPct < 25 ? 'critical' : 'low',
      });
    }
  }

  return alerts.sort((a, b) =>
    a.severity === 'critical' && b.severity !== 'critical' ? -1 : 1
  );
};

/**
 * Generate lot number
 */
export const generateLotNumber = (
  blendName: string,
  bottlingDate: Date
): string => {
  const year = bottlingDate.getFullYear().toString().slice(-2);
  const month = (bottlingDate.getMonth() + 1).toString().padStart(2, '0');
  const day = bottlingDate.getDate().toString().padStart(2, '0');
  const prefix = blendName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

  return `${prefix}-${year}${month}${day}`;
};
