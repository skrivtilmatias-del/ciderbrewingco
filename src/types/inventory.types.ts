/**
 * Inventory-related type definitions
 */

export interface InventoryLot {
  id: string;
  user_id: string;
  blend_batch_id: string;
  lot_number: string;
  bottling_date: string;
  initial_quantity_75cl: number;
  current_quantity_75cl: number;
  initial_quantity_150cl: number;
  current_quantity_150cl: number;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryLotInput {
  blend_batch_id: string;
  lot_number: string;
  bottling_date: string;
  initial_quantity_75cl: number;
  current_quantity_75cl: number;
  initial_quantity_150cl: number;
  current_quantity_150cl: number;
  location: string;
  status?: string;
}

export interface UpdateInventoryLotInput {
  lot_number?: string;
  bottling_date?: string;
  initial_quantity_75cl?: number;
  current_quantity_75cl?: number;
  initial_quantity_150cl?: number;
  current_quantity_150cl?: number;
  location?: string;
  status?: string;
}

export interface InventoryMovement {
  id: string;
  user_id: string;
  lot_id: string;
  movement_type: string;
  quantity_75cl: number;
  quantity_150cl: number;
  from_location: string | null;
  to_location: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateInventoryMovementInput {
  lot_id: string;
  movement_type: string;
  quantity_75cl: number;
  quantity_150cl: number;
  from_location?: string;
  to_location?: string;
  reason?: string;
  notes?: string;
}

export interface InventoryThreshold {
  id: string;
  user_id: string;
  blend_batch_id: string | null;
  location: string | null;
  min_quantity_75cl: number;
  min_quantity_150cl: number;
  alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryThresholdInput {
  blend_batch_id?: string;
  location?: string;
  min_quantity_75cl: number;
  min_quantity_150cl: number;
  alert_enabled?: boolean;
}

export interface UpdateInventoryThresholdInput {
  blend_batch_id?: string | null;
  location?: string | null;
  min_quantity_75cl?: number;
  min_quantity_150cl?: number;
  alert_enabled?: boolean;
}
