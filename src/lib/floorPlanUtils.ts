import { EquipmentType } from "@/constants/equipment";

export interface PlacedEquipment {
  id: string;
  equipmentId: string;
  x: number;
  y: number;
  rotation: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Calculate equipment bounds based on position and rotation
export const getEquipmentBounds = (
  equipment: EquipmentType,
  x: number,
  y: number,
  rotation: number
): Bounds => {
  const isRotated = rotation === 90 || rotation === 270;
  const width = isRotated ? equipment.depth : equipment.width;
  const height = isRotated ? equipment.width : equipment.depth;
  
  return { x, y, width, height };
};

// Check if two equipment pieces overlap
export const checkCollision = (
  bounds1: Bounds,
  bounds2: Bounds,
  clearance: number = 0
): boolean => {
  return !(
    bounds1.x + bounds1.width + clearance <= bounds2.x ||
    bounds2.x + bounds2.width + clearance <= bounds1.x ||
    bounds1.y + bounds1.height + clearance <= bounds2.y ||
    bounds2.y + bounds2.height + clearance <= bounds1.y
  );
};

// Check if equipment is within floor boundaries
export const isWithinFloor = (
  bounds: Bounds,
  floorWidth: number,
  floorHeight: number
): boolean => {
  return (
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= floorWidth &&
    bounds.y + bounds.height <= floorHeight
  );
};

// Snap position to grid
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

// Calculate total capacity from placed equipment
export const calculateTotalCapacity = (
  placedEquipment: PlacedEquipment[],
  equipmentDatabase: EquipmentType[]
): number => {
  return placedEquipment.reduce((total, placed) => {
    const equipment = equipmentDatabase.find(e => e.id === placed.equipmentId);
    return total + (equipment?.capacity || 0);
  }, 0);
};

// Calculate space utilization percentage
export const calculateSpaceUtilization = (
  placedEquipment: PlacedEquipment[],
  equipmentDatabase: EquipmentType[],
  floorWidth: number,
  floorHeight: number
): number => {
  const totalFloorArea = floorWidth * floorHeight;
  
  const usedArea = placedEquipment.reduce((total, placed) => {
    const equipment = equipmentDatabase.find(e => e.id === placed.equipmentId);
    if (!equipment) return total;
    
    const bounds = getEquipmentBounds(equipment, placed.x, placed.y, placed.rotation);
    return total + (bounds.width * bounds.height);
  }, 0);
  
  return (usedArea / totalFloorArea) * 100;
};

// Convert meters to pixels for canvas rendering
export const metersToPixels = (meters: number, scale: number): number => {
  return meters * scale;
};

// Convert pixels to meters
export const pixelsToMeters = (pixels: number, scale: number): number => {
  return pixels / scale;
};

// Generate unique ID for placed equipment
export const generateEquipmentId = (): string => {
  return `equipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
