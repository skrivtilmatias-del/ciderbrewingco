import { LucideIcon, Beaker, Gauge, Box, Package, Droplets, Wrench, Plug } from "lucide-react";

export interface EquipmentType {
  id: string;
  name: string;
  type: 'tank' | 'press' | 'storage' | 'workstation' | 'utility' | 'bottling';
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  capacity?: number; // liters (if applicable)
  color: string;
  icon: LucideIcon;
  minClearance: number; // meters around it
  description: string;
}

export const EQUIPMENT_DATABASE: EquipmentType[] = [
  // Fermentation Tanks
  {
    id: 'tank-100l',
    name: '100L Tank',
    type: 'tank',
    width: 0.6,
    depth: 0.6,
    height: 1.2,
    capacity: 100,
    color: '#3b82f6',
    icon: Beaker,
    minClearance: 0.5,
    description: 'Small fermentation tank for trials'
  },
  {
    id: 'tank-300l',
    name: '300L Tank',
    type: 'tank',
    width: 0.8,
    depth: 0.8,
    height: 1.5,
    capacity: 300,
    color: '#2563eb',
    icon: Beaker,
    minClearance: 0.6,
    description: 'Medium fermentation tank'
  },
  {
    id: 'tank-500l',
    name: '500L Tank',
    type: 'tank',
    width: 1.0,
    depth: 1.0,
    height: 1.8,
    capacity: 500,
    color: '#1d4ed8',
    icon: Beaker,
    minClearance: 0.7,
    description: 'Large fermentation tank'
  },
  {
    id: 'tank-1000l',
    name: '1000L Tank',
    type: 'tank',
    width: 1.2,
    depth: 1.2,
    height: 2.2,
    capacity: 1000,
    color: '#1e40af',
    icon: Beaker,
    minClearance: 0.8,
    description: 'Industrial fermentation tank'
  },
  {
    id: 'tank-2000l',
    name: '2000L Tank',
    type: 'tank',
    width: 1.5,
    depth: 1.5,
    height: 2.5,
    capacity: 2000,
    color: '#1e3a8a',
    icon: Beaker,
    minClearance: 1.0,
    description: 'Large scale fermentation tank'
  },
  
  // Press Equipment
  {
    id: 'press-small',
    name: 'Small Press',
    type: 'press',
    width: 1.2,
    depth: 0.8,
    height: 1.5,
    color: '#059669',
    icon: Gauge,
    minClearance: 1.0,
    description: 'Hydraulic press for small batches'
  },
  {
    id: 'press-large',
    name: 'Large Press',
    type: 'press',
    width: 2.0,
    depth: 1.5,
    height: 2.0,
    capacity: 500,
    color: '#047857',
    icon: Gauge,
    minClearance: 1.2,
    description: 'Industrial hydraulic press'
  },
  
  // Storage
  {
    id: 'storage-shelf',
    name: 'Storage Shelf',
    type: 'storage',
    width: 2.0,
    depth: 0.6,
    height: 2.0,
    color: '#d97706',
    icon: Box,
    minClearance: 0.8,
    description: 'Heavy duty storage shelving'
  },
  {
    id: 'cold-storage',
    name: 'Cold Storage',
    type: 'storage',
    width: 2.0,
    depth: 1.5,
    height: 2.2,
    color: '#0891b2',
    icon: Package,
    minClearance: 0.8,
    description: 'Refrigerated storage unit'
  },
  
  // Bottling
  {
    id: 'bottling-line',
    name: 'Bottling Line',
    type: 'bottling',
    width: 3.0,
    depth: 1.0,
    height: 1.5,
    color: '#7c3aed',
    icon: Droplets,
    minClearance: 1.0,
    description: 'Semi-automatic bottling line'
  },
  
  // Workstations
  {
    id: 'workbench',
    name: 'Work Bench',
    type: 'workstation',
    width: 2.0,
    depth: 0.8,
    height: 0.9,
    color: '#dc2626',
    icon: Wrench,
    minClearance: 0.8,
    description: 'General purpose workbench'
  },
  {
    id: 'sink-station',
    name: 'Sink Station',
    type: 'utility',
    width: 1.2,
    depth: 0.6,
    height: 0.9,
    color: '#0284c7',
    icon: Droplets,
    minClearance: 0.8,
    description: 'Wash station with sink'
  },
  {
    id: 'power-point',
    name: 'Power Point',
    type: 'utility',
    width: 0.3,
    depth: 0.3,
    height: 0.3,
    color: '#fbbf24',
    icon: Plug,
    minClearance: 0.3,
    description: 'Electrical outlet'
  }
];

// Preset scenarios
export interface ScenarioPreset {
  name: string;
  description: string;
  targetCapacity: number;
  equipment: Array<{
    equipmentId: string;
    x: number;
    y: number;
    rotation: number;
  }>;
}

export const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  '1000L': {
    name: '1000L Production Setup',
    description: 'Starter setup for 1000L annual production',
    targetCapacity: 1000,
    equipment: [
      { equipmentId: 'tank-500l', x: 1.5, y: 1.5, rotation: 0 },
      { equipmentId: 'tank-500l', x: 3.5, y: 1.5, rotation: 0 },
      { equipmentId: 'press-small', x: 1.5, y: 5.0, rotation: 0 },
      { equipmentId: 'bottling-line', x: 5.0, y: 7.0, rotation: 0 },
      { equipmentId: 'workbench', x: 1.0, y: 8.0, rotation: 0 },
      { equipmentId: 'sink-station', x: 5.5, y: 1.5, rotation: 0 },
      { equipmentId: 'storage-shelf', x: 0.5, y: 3.5, rotation: 0 },
    ]
  },
  '5000L': {
    name: '5000L Production Setup',
    description: 'Scaled up setup for 5000L annual production',
    targetCapacity: 5000,
    equipment: [
      { equipmentId: 'tank-1000l', x: 1.0, y: 1.0, rotation: 0 },
      { equipmentId: 'tank-1000l', x: 3.0, y: 1.0, rotation: 0 },
      { equipmentId: 'tank-2000l', x: 5.0, y: 1.0, rotation: 0 },
      { equipmentId: 'tank-1000l', x: 1.0, y: 4.0, rotation: 0 },
      { equipmentId: 'press-large', x: 3.5, y: 4.5, rotation: 0 },
      { equipmentId: 'bottling-line', x: 4.0, y: 7.5, rotation: 0 },
      { equipmentId: 'workbench', x: 0.5, y: 7.5, rotation: 0 },
      { equipmentId: 'sink-station', x: 0.5, y: 6.0, rotation: 0 },
      { equipmentId: 'cold-storage', x: 6.5, y: 4.0, rotation: 0 },
      { equipmentId: 'storage-shelf', x: 6.5, y: 7.0, rotation: 0 },
    ]
  }
};
