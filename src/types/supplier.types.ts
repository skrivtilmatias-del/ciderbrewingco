/**
 * Supplier-related type definitions
 */

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact: string | null;
  terms: string | null;
  notes: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  primary_contact_name: string | null;
  tax_id: string | null;
  payment_net_days: number | null;
  category: string | null;
  rating: number | null;
  status: string;
  is_preferred: boolean;
  quality_score: number | null;
  defect_rate: number | null;
  reliability_rating: number | null;
  total_spend_ytd: number;
  on_time_delivery_rate: number | null;
  avg_lead_time_days: number | null;
  organic_certified: boolean;
  food_safety_certified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierInput {
  name: string;
  contact?: string;
  terms?: string;
  notes?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  primary_contact_name?: string;
  tax_id?: string;
  payment_net_days?: number;
  category?: string;
  rating?: number;
  status?: string;
  is_preferred?: boolean;
  quality_score?: number;
  defect_rate?: number;
  reliability_rating?: number;
  organic_certified?: boolean;
  food_safety_certified?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  contact?: string | null;
  terms?: string | null;
  notes?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  primary_contact_name?: string | null;
  tax_id?: string | null;
  payment_net_days?: number | null;
  category?: string | null;
  rating?: number | null;
  status?: string;
  is_preferred?: boolean;
  quality_score?: number | null;
  defect_rate?: number | null;
  reliability_rating?: number | null;
  on_time_delivery_rate?: number | null;
  avg_lead_time_days?: number | null;
  organic_certified?: boolean;
  food_safety_certified?: boolean;
}

export interface Contract {
  id: string;
  supplier_id: string;
  product: string;
  price_per_unit: number;
  min_qty: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContractInput {
  supplier_id: string;
  product: string;
  price_per_unit: number;
  min_qty: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface UpdateContractInput {
  product?: string;
  price_per_unit?: number;
  min_qty?: number;
  start_date?: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface Delivery {
  id: string;
  supplier_id: string;
  product: string;
  lot_code: string;
  qty_kg: number;
  price_per_kg: number;
  delivery_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryInput {
  supplier_id: string;
  product: string;
  lot_code: string;
  qty_kg: number;
  price_per_kg: number;
  delivery_date: string;
  notes?: string;
}

export interface UpdateDeliveryInput {
  product?: string;
  lot_code?: string;
  qty_kg?: number;
  price_per_kg?: number;
  delivery_date?: string;
  notes?: string | null;
}

export interface PressResult {
  id: string;
  delivery_id: string;
  juice_l: number;
  pomace_kg: number;
  brix: number | null;
  ph: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePressResultInput {
  delivery_id: string;
  juice_l: number;
  pomace_kg: number;
  brix?: number;
  ph?: number;
  notes?: string;
}

export interface UpdatePressResultInput {
  juice_l?: number;
  pomace_kg?: number;
  brix?: number | null;
  ph?: number | null;
  notes?: string | null;
}

export interface QCIncident {
  id: string;
  delivery_id: string;
  incident_type: string;
  severity: number;
  qty_kg: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQCIncidentInput {
  delivery_id: string;
  incident_type: string;
  severity: number;
  qty_kg: number;
  notes?: string;
}

export interface UpdateQCIncidentInput {
  incident_type?: string;
  severity?: number;
  qty_kg?: number;
  notes?: string | null;
}
