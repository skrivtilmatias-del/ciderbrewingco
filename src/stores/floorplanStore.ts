import { create } from 'zustand';
import { EquipmentCatalogItem, PlacedItem, FloorPlan } from '@/types/floorplan';
import { EQUIPMENT_DATABASE } from '@/constants/equipment';

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
}));
