/**
 * Bill of Materials (BOM) type definitions
 */

export interface BOMData {
  id: string;
  batchId?: string;
  blendId?: string;
  createdAt: string;
  updatedAt: string;
  
  // BOM details
  ingredients: BOMIngredient[];
  packaging: BOMPackaging[];
  labor: BOMLabor[];
  overheads: BOMOverhead[];
  
  // Pricing
  sellPricePer75cl?: number;
  sellPricePer150cl?: number;
  wastagePercent: number;
}

export interface BOMIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface BOMPackaging {
  id: string;
  type: 'bottle' | 'label' | 'cap' | 'box' | 'other';
  name: string;
  quantity: number;
  unitCost: number;
}

export interface BOMLabor {
  id: string;
  task: string;
  minutes: number;
  hourlyRate: number;
}

export interface BOMOverhead {
  id: string;
  category: string;
  cost: number;
  allocation: 'per_liter' | 'per_batch' | 'percentage';
}
