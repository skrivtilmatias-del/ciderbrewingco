export type EquipmentCategory = 'tank' | 'press' | 'storage' | 'bottling' | 'workstation';

export type EquipmentCatalogItem = {
  id: string;
  name: string;
  category: EquipmentCategory;
  widthM: number;
  heightM: number;
  capacityL?: number;
  color: string;
  icon: string;
  createdAt: string;
};

export type PlacedItem = {
  id: string;
  catalogId: string;
  name: string;
  xM: number;
  yM: number;
  widthM: number;
  heightM: number;
  rotationDeg: number;
  capacityL?: number;
  color: string;
  lockedAspect?: boolean;
};

export type FloorPlan = {
  id: string;
  name: string;
  notes?: string;
  roomWidthM: number;
  roomHeightM: number;
  items: PlacedItem[];
  updatedAt: string;
};

export const M_TO_PX = 50;
export const m2px = (m: number) => m * M_TO_PX;
export const px2m = (px: number) => px / M_TO_PX;
export const snapM = (m: number, step = 0.1) => Math.round(m / step) * step;
