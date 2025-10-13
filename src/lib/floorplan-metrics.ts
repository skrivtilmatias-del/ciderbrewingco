import { PlacedItem } from "@/types/floorplan";

export const roomAreaM2 = (wM: number, hM: number) => wM * hM;

export const itemsAreaM2 = (items: PlacedItem[]) => 
  items.reduce((s, it) => s + (it.widthM * it.heightM), 0);

export const totalCapacityL = (items: PlacedItem[]) =>
  items.reduce((s, it) => s + (it.capacityL ?? 0), 0);

export const utilizationPct = (items: PlacedItem[], wM: number, hM: number) => {
  const total = roomAreaM2(wM, hM);
  if (total === 0) return 0;
  return Math.min(100, Math.round((itemsAreaM2(items) / total) * 100));
};

export const freeAreaM2 = (items: PlacedItem[], wM: number, hM: number) =>
  Math.max(0, roomAreaM2(wM, hM) - itemsAreaM2(items));
