import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CostInputs {
  // Ingredient costs (DKK per unit)
  juiceCostPerLiter: number;
  yeastCostPer1000L: number;
  bottleCost75cl: number;
  capCost: number;
  labelCost: number;
  sugarCostPerKg: number;
  otherCostsPerBottle: number;
  
  // Production scale
  productionVolumeLiters: number;
  bottlesPer75cl: number;
  yieldEfficiency: number; // % (e.g., 95 = 5% loss)
  
  // Pricing
  bottlePriceExclVAT: number;
  priceInflationYearly: number; // %
  
  // Labor costs (DKK)
  laborCostMonthly: number;
  laborGrowthYearly: number; // %
  
  // Overhead costs (DKK)
  overheadCostMonthly: number;
  
  // Investment
  initialInvestment: number;
  yearlyCapex: number[];
}

export interface ScenarioSettings {
  name: string;
  costInflation: number; // % yearly
  demandGrowth: number; // % yearly
  priceStrategy: 'conservative' | 'moderate' | 'aggressive';
}

interface CostCalculationState {
  inputs: CostInputs;
  scenario: ScenarioSettings;
  updateInput: (key: keyof CostInputs, value: number) => void;
  updateScenario: (key: keyof ScenarioSettings, value: any) => void;
  resetToDefaults: () => void;
}

const defaultInputs: CostInputs = {
  juiceCostPerLiter: 8,
  yeastCostPer1000L: 741,
  bottleCost75cl: 3,
  capCost: 0.1,
  labelCost: 4,
  sugarCostPerKg: 0.1,
  otherCostsPerBottle: 10.96,
  productionVolumeLiters: 1000,
  bottlesPer75cl: 1333,
  yieldEfficiency: 95,
  bottlePriceExclVAT: 110,
  priceInflationYearly: 3,
  laborCostMonthly: 0,
  laborGrowthYearly: 5,
  overheadCostMonthly: 10000,
  initialInvestment: 20000,
  yearlyCapex: [18000, 8000, 9000, 300000, 90000, 300000, 120000, 100000, 100000, 650000, 0],
};

const defaultScenario: ScenarioSettings = {
  name: 'Moderate Growth',
  costInflation: 2.5,
  demandGrowth: 50,
  priceStrategy: 'moderate',
};

export const useCostCalculationStore = create<CostCalculationState>()(
  persist(
    (set) => ({
      inputs: defaultInputs,
      scenario: defaultScenario,
      updateInput: (key, value) =>
        set((state) => ({
          inputs: { ...state.inputs, [key]: value },
        })),
      updateScenario: (key, value) =>
        set((state) => ({
          scenario: { ...state.scenario, [key]: value },
        })),
      resetToDefaults: () =>
        set({
          inputs: defaultInputs,
          scenario: defaultScenario,
        }),
    }),
    {
      name: 'cost-calculation-storage',
    }
  )
);
