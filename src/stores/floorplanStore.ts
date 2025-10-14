import { create } from 'zustand';
import { EquipmentCatalogItem, PlacedItem, FloorPlan } from '@/types/floorplan';
import { EQUIPMENT_DATABASE } from '@/constants/equipment';
import { enqueueMutation } from '@/offline/queue';

interface FloorPlanState {
  catalog: EquipmentCatalogItem[];
  plan: FloorPlan;
  selectedItemId: string | null;
  snapToGrid: boolean;
  zoomLevel: number;
  
  addCatalogItem: (item: Omit<EquipmentCatalogItem, 'id' | 'createdAt'>) => void;
  updateCatalogItem: (id: string, updates: Partial<EquipmentCatalogItem>) => void;
  removeCatalogItem: (id: string) => void;
  
  addItem: (item: Omit<PlacedItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<PlacedItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  
  setSelectedItemId: (id: string | null) => void;
  setSnapToGrid: (snap: boolean) => void;
  setZoomLevel: (level: number) => void;
  
  savePlan: (name?: string, notes?: string) => void;
  loadPlan: (planId: string) => void;
  updatePlanMeta: (updates: Partial<Pick<FloorPlan, 'name' | 'notes' | 'roomWidthM' | 'roomHeightM'>>) => void;
  
  exportToCSV: () => string;
  importFromCSV: (csv: string) => void;
  checkCollisions: (itemId: string) => string[];
}

// Convert existing equipment database to catalog format
const initialCatalog: EquipmentCatalogItem[] = EQUIPMENT_DATABASE.map(eq => ({
  id: eq.id,
  name: eq.name,
  category: eq.type as any,
  widthM: eq.width,
  heightM: eq.depth,
  capacityL: eq.capacity,
  color: eq.color,
  icon: eq.icon.name,
  createdAt: new Date().toISOString(),
}));

const defaultPlan: FloorPlan = {
  id: crypto.randomUUID(),
  name: 'My Floor Plan',
  notes: '',
  roomWidthM: 10,
  roomHeightM: 7.5,
  items: [],
  updatedAt: new Date().toISOString(),
};

// Load from localStorage
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('floorplan-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        catalog: parsed.catalog || initialCatalog,
        plan: parsed.plan || defaultPlan,
      };
    }
  } catch (e) {
    console.error('Failed to load floor plan from storage', e);
  }
  return { catalog: initialCatalog, plan: defaultPlan };
};

const saveToStorage = (catalog: EquipmentCatalogItem[], plan: FloorPlan) => {
  try {
    localStorage.setItem('floorplan-state', JSON.stringify({ catalog, plan }));
    
    // Queue for offline sync if not online
    if (!navigator.onLine) {
      enqueueMutation(
        '/api/floorplan/save',
        'POST',
        { 'Content-Type': 'application/json' },
        { catalog, plan }
      ).catch(console.error);
    }
  } catch (e) {
    console.error('Failed to save floor plan to storage', e);
  }
};

const initial = loadFromStorage();

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  catalog: initial.catalog,
  plan: initial.plan,
  selectedItemId: null,
  snapToGrid: true,
  zoomLevel: 1,
  
  addCatalogItem: (item) => {
    const newItem: EquipmentCatalogItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const catalog = [...state.catalog, newItem];
      saveToStorage(catalog, state.plan);
      return { catalog };
    });
  },
  
  updateCatalogItem: (id, updates) => {
    set((state) => {
      const catalog = state.catalog.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      saveToStorage(catalog, state.plan);
      return { catalog };
    });
  },
  
  removeCatalogItem: (id) => {
    set((state) => {
      const catalog = state.catalog.filter(item => item.id !== id);
      saveToStorage(catalog, state.plan);
      return { catalog };
    });
  },
  
  addItem: (item) => {
    const newItem: PlacedItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    set((state) => {
      const plan = {
        ...state.plan,
        items: [...state.plan.items, newItem],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { plan, selectedItemId: newItem.id };
    });
  },
  
  updateItem: (id, updates) => {
    set((state) => {
      const plan = {
        ...state.plan,
        items: state.plan.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { plan };
    });
  },
  
  removeItem: (id) => {
    set((state) => {
      const plan = {
        ...state.plan,
        items: state.plan.items.filter(item => item.id !== id),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { 
        plan, 
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId 
      };
    });
  },
  
  duplicateItem: (id) => {
    const item = get().plan.items.find(i => i.id === id);
    if (!item) return;
    
    const newItem: PlacedItem = {
      ...item,
      id: crypto.randomUUID(),
      xM: item.xM + 0.5,
      yM: item.yM + 0.5,
    };
    
    set((state) => {
      const plan = {
        ...state.plan,
        items: [...state.plan.items, newItem],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { plan, selectedItemId: newItem.id };
    });
  },
  
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(3, level)) }),
  
  savePlan: (name, notes) => {
    set((state) => {
      const plan = {
        ...state.plan,
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { plan };
    });
  },
  
  loadPlan: (planId) => {
    // Future: load from API
    console.log('Load plan:', planId);
  },
  
  updatePlanMeta: (updates) => {
    set((state) => {
      const plan = {
        ...state.plan,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(state.catalog, plan);
      return { plan };
    });
  },
  
  exportToCSV: () => {
    const state = get();
    const headers = ['id', 'name', 'catalogId', 'xM', 'yM', 'widthM', 'heightM', 'rotationDeg', 'capacityL', 'color'];
    const rows = state.plan.items.map(item => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.catalogId,
      item.xM,
      item.yM,
      item.widthM,
      item.heightM,
      item.rotationDeg,
      item.capacityL || '',
      item.color,
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
  
  importFromCSV: (csv: string) => {
    try {
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',');
      const items: PlacedItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;
        
        const item: PlacedItem = {
          id: values[0] || crypto.randomUUID(),
          name: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
          catalogId: values[2],
          xM: parseFloat(values[3]) || 0,
          yM: parseFloat(values[4]) || 0,
          widthM: parseFloat(values[5]) || 1,
          heightM: parseFloat(values[6]) || 1,
          rotationDeg: parseFloat(values[7]) || 0,
          capacityL: values[8] ? parseFloat(values[8]) : undefined,
          color: values[9] || '#888',
        };
        items.push(item);
      }
      
      set((state) => {
        const plan = {
          ...state.plan,
          items,
          updatedAt: new Date().toISOString(),
        };
        saveToStorage(state.catalog, plan);
        return { plan };
      });
    } catch (error) {
      console.error('Failed to import CSV:', error);
      throw new Error('Invalid CSV format');
    }
  },
  
  checkCollisions: (itemId: string) => {
    const state = get();
    const item = state.plan.items.find(i => i.id === itemId);
    if (!item) return [];
    
    const collisions: string[] = [];
    
    // Helper to calculate overlap area
    const getOverlapArea = (a: PlacedItem, b: PlacedItem) => {
      const aRight = a.xM + a.widthM;
      const aBottom = a.yM + a.heightM;
      const bRight = b.xM + b.widthM;
      const bBottom = b.yM + b.heightM;
      
      const overlapX = Math.max(0, Math.min(aRight, bRight) - Math.max(a.xM, b.xM));
      const overlapY = Math.max(0, Math.min(aBottom, bBottom) - Math.max(a.yM, b.yM));
      
      return overlapX * overlapY;
    };
    
    for (const other of state.plan.items) {
      if (other.id === itemId) continue;
      
      const overlapArea = getOverlapArea(item, other);
      const itemArea = item.widthM * item.heightM;
      const overlapPercent = (overlapArea / itemArea) * 100;
      
      if (overlapPercent > 5) {
        collisions.push(other.id);
      }
    }
    
    return collisions;
  },
}));
