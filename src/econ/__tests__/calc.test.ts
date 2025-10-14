import { describe, it, expect } from 'vitest';
import { calcEconomics, applyScenario, calcVariance, priceSensitivity } from '../calc';
import { DEFAULT_ECON_INPUT, Scenario } from '../types';

describe('calcEconomics', () => {
  it('should calculate basic economics correctly', () => {
    const result = calcEconomics(DEFAULT_ECON_INPUT);

    expect(result.totalCOGS).toBeGreaterThan(0);
    expect(result.cogsPerLiter).toBeGreaterThan(0);
    expect(result.cogsPerBottle75cl).toBe(result.cogsPerLiter * 0.75);
    expect(result.bottles75cl).toBeGreaterThan(0);
    expect(result.effectiveVolumeLiters).toBeLessThan(
      DEFAULT_ECON_INPUT.production.volumeLiters
    );
  });

  it('should calculate margins correctly', () => {
    const result = calcEconomics(DEFAULT_ECON_INPUT);

    expect(result.grossMargin75cl).toBe(
      DEFAULT_ECON_INPUT.pricing.bottle75clExclVAT - result.cogsPerBottle75cl
    );
    expect(result.grossMarginPct75cl).toBeGreaterThan(0);
    expect(result.grossMarginPct75cl).toBeLessThan(100);
  });

  it('should calculate revenue and profit', () => {
    const result = calcEconomics(DEFAULT_ECON_INPUT);

    expect(result.totalRevenue).toBe(result.revenue75cl + result.revenue150cl);
    expect(result.totalProfit).toBe(result.totalRevenue - result.totalCOGS);
  });

  it('should handle zero volume gracefully', () => {
    const input = {
      ...DEFAULT_ECON_INPUT,
      production: { ...DEFAULT_ECON_INPUT.production, volumeLiters: 0 },
    };

    const result = calcEconomics(input);
    expect(result.cogsPerLiter).toBe(0);
    expect(result.bottles75cl).toBe(0);
  });

  it('should apply wastage and yield correctly', () => {
    const input = {
      ...DEFAULT_ECON_INPUT,
      production: {
        volumeLiters: 1000,
        wastagePercent: 10,
        yieldEfficiency: 90,
      },
    };

    const result = calcEconomics(input);
    // 1000 * 0.9 (wastage) * 0.9 (yield) = 810L
    expect(result.effectiveVolumeLiters).toBe(810);
  });

  it('should calculate breakdown correctly', () => {
    const result = calcEconomics(DEFAULT_ECON_INPUT);

    const totalBreakdown =
      result.breakdown.juice +
      result.breakdown.yeast +
      result.breakdown.packaging +
      result.breakdown.labor +
      result.breakdown.overhead;

    expect(Math.abs(totalBreakdown - result.totalCOGS)).toBeLessThan(0.01);
  });
});

describe('applyScenario', () => {
  const testScenario: Scenario = {
    name: 'Test Scenario',
    volumeMultiplier: 2,
    priceMultiplier: 1.25,
    appleCostMultiplier: 1.1,
    laborMultiplier: 1.15,
    inflationYearly: 3,
  };

  it('should apply volume multiplier', () => {
    const modified = applyScenario(DEFAULT_ECON_INPUT, testScenario);
    expect(modified.production.volumeLiters).toBe(
      DEFAULT_ECON_INPUT.production.volumeLiters * 2
    );
  });

  it('should apply price multiplier', () => {
    const modified = applyScenario(DEFAULT_ECON_INPUT, testScenario);
    expect(modified.pricing.bottle75clExclVAT).toBe(
      DEFAULT_ECON_INPUT.pricing.bottle75clExclVAT * 1.25
    );
  });

  it('should apply apple cost multiplier', () => {
    const modified = applyScenario(DEFAULT_ECON_INPUT, testScenario);
    expect(modified.ingredients.juicePerLiter).toBe(
      DEFAULT_ECON_INPUT.ingredients.juicePerLiter * 1.1
    );
  });

  it('should apply labor multiplier', () => {
    const modified = applyScenario(DEFAULT_ECON_INPUT, testScenario);
    expect(modified.labor.hourlyRate).toBe(
      DEFAULT_ECON_INPUT.labor.hourlyRate * 1.15
    );
  });

  it('should not mutate original input', () => {
    const original = { ...DEFAULT_ECON_INPUT };
    applyScenario(DEFAULT_ECON_INPUT, testScenario);
    expect(DEFAULT_ECON_INPUT).toEqual(original);
  });
});

describe('calcVariance', () => {
  it('should calculate variance correctly', () => {
    const planned = calcEconomics(DEFAULT_ECON_INPUT);
    const actualInput = {
      ...DEFAULT_ECON_INPUT,
      ingredients: {
        ...DEFAULT_ECON_INPUT.ingredients,
        juicePerLiter: DEFAULT_ECON_INPUT.ingredients.juicePerLiter * 1.2,
      },
    };
    const actual = calcEconomics(actualInput);

    const variance = calcVariance(planned, actual);

    expect(variance.cogsPerLiter.value).toBeGreaterThan(0);
    expect(variance.cogsPerLiter.pct).toBeGreaterThan(0);
    expect(variance.totalCOGS.value).toBeGreaterThan(0);
  });

  it('should handle negative variances', () => {
    const planned = calcEconomics(DEFAULT_ECON_INPUT);
    const actualInput = {
      ...DEFAULT_ECON_INPUT,
      ingredients: {
        ...DEFAULT_ECON_INPUT.ingredients,
        juicePerLiter: DEFAULT_ECON_INPUT.ingredients.juicePerLiter * 0.8,
      },
    };
    const actual = calcEconomics(actualInput);

    const variance = calcVariance(planned, actual);

    expect(variance.cogsPerLiter.value).toBeLessThan(0);
    expect(variance.cogsPerLiter.pct).toBeLessThan(0);
  });
});

describe('priceSensitivity', () => {
  it('should generate price sensitivity analysis', () => {
    const analysis = priceSensitivity(DEFAULT_ECON_INPUT, {
      min: 80,
      max: 140,
      steps: 6,
    });

    expect(analysis).toHaveLength(7); // steps + 1
    expect(analysis[0].price).toBe(80);
    expect(analysis[6].price).toBe(140);

    // Margin should increase with price
    expect(analysis[6].margin).toBeGreaterThan(analysis[0].margin);
    expect(analysis[6].marginPct).toBeGreaterThan(analysis[0].marginPct);
  });

  it('should maintain consistent calculations', () => {
    const analysis = priceSensitivity(DEFAULT_ECON_INPUT, {
      min: 100,
      max: 100,
      steps: 1,
    });

    const direct = calcEconomics(DEFAULT_ECON_INPUT);

    expect(analysis[0].price).toBe(100);
    expect(analysis[0].margin).toBeCloseTo(direct.grossMargin75cl, 2);
    expect(analysis[0].marginPct).toBeCloseTo(direct.grossMarginPct75cl, 2);
  });
});
