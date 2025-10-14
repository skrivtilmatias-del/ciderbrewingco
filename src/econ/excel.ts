/**
 * Excel import/export for economic planning
 */

import * as XLSX from 'xlsx';
import { EconInput, EconInputZ, EconResult } from './types';

/**
 * Export economics to Excel workbook
 */
export const exportToExcel = (
  input: EconInput,
  result: EconResult,
  filename: string = 'cider-economics.xlsx'
): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Input Parameters
  const inputData = [
    ['Section', 'Parameter', 'Value', 'Unit'],
    ['Ingredients', 'Juice Cost', input.ingredients.juicePerLiter, 'kr/L'],
    ['Ingredients', 'Yeast Cost', input.ingredients.yeastPer1000L, 'kr/1000L'],
    ['Ingredients', 'Sugar Cost', input.ingredients.sugarPerKg, 'kr/kg'],
    ['Ingredients', 'Other Costs', input.ingredients.otherPerBottle, 'kr/bottle'],
    [],
    ['Packaging', 'Bottle 75cl', input.packaging.bottle75cl, 'kr'],
    ['Packaging', 'Bottle 150cl', input.packaging.bottle150cl, 'kr'],
    ['Packaging', 'Label', input.packaging.label, 'kr'],
    ['Packaging', 'Cap', input.packaging.cap, 'kr'],
    ['Packaging', 'Box', input.packaging.box, 'kr'],
    [],
    ['Labor', 'Hourly Rate', input.labor.hourlyRate, 'kr/h'],
    ['Labor', 'Hours per Batch', input.labor.hoursPerBatch, 'hours'],
    ['Labor', 'Monthly Fixed', input.labor.monthlyFixed, 'kr'],
    [],
    ['Overhead', 'Monthly Fixed', input.overhead.monthlyFixed, 'kr'],
    ['Overhead', 'Per Liter', input.overhead.perLiter, 'kr/L'],
    ['Overhead', 'Percent of COGS', input.overhead.percentOfCOGS, '%'],
    [],
    ['Production', 'Volume', input.production.volumeLiters, 'L'],
    ['Production', 'Wastage', input.production.wastagePercent, '%'],
    ['Production', 'Yield Efficiency', input.production.yieldEfficiency, '%'],
    [],
    ['Pricing', 'Bottle 75cl Price', input.pricing.bottle75clExclVAT, 'kr'],
    ['Pricing', 'Bottle 150cl Price', input.pricing.bottle150clExclVAT, 'kr'],
    ['Pricing', 'Price Inflation', input.pricing.priceInflationYearly, '%/year'],
  ];

  const wsInput = XLSX.utils.aoa_to_sheet(inputData);
  XLSX.utils.book_append_sheet(wb, wsInput, 'Inputs');

  // Sheet 2: Results
  const resultsData = [
    ['Metric', 'Value', 'Unit'],
    ['Total Ingredients', result.totalIngredients.toFixed(2), 'kr'],
    ['Total Packaging', result.totalPackaging.toFixed(2), 'kr'],
    ['Total Labor', result.totalLabor.toFixed(2), 'kr'],
    ['Total Overhead', result.totalOverhead.toFixed(2), 'kr'],
    ['Total COGS', result.totalCOGS.toFixed(2), 'kr'],
    [],
    ['COGS per Liter', result.cogsPerLiter.toFixed(2), 'kr/L'],
    ['COGS per Bottle 75cl', result.cogsPerBottle75cl.toFixed(2), 'kr'],
    ['COGS per Bottle 150cl', result.cogsPerBottle150cl.toFixed(2), 'kr'],
    [],
    ['Effective Volume', result.effectiveVolumeLiters.toFixed(0), 'L'],
    ['Bottles 75cl', result.bottles75cl, 'units'],
    ['Bottles 150cl', result.bottles150cl, 'units'],
    [],
    ['Gross Margin 75cl', result.grossMargin75cl.toFixed(2), 'kr'],
    ['Gross Margin % 75cl', result.grossMarginPct75cl.toFixed(1), '%'],
    ['Gross Margin 150cl', result.grossMargin150cl.toFixed(2), 'kr'],
    ['Gross Margin % 150cl', result.grossMarginPct150cl.toFixed(1), '%'],
    [],
    ['Revenue 75cl', result.revenue75cl.toFixed(2), 'kr'],
    ['Revenue 150cl', result.revenue150cl.toFixed(2), 'kr'],
    ['Total Revenue', result.totalRevenue.toFixed(2), 'kr'],
    ['Total Profit', result.totalProfit.toFixed(2), 'kr'],
    [],
    ['Breakeven Bottles 75cl', result.breakevenBottles75cl, 'units'],
    ['Breakeven Volume', result.breakevenVolumeLiters.toFixed(0), 'L'],
    ['Breakeven Revenue', result.breakevenRevenue.toFixed(2), 'kr'],
  ];

  const wsResults = XLSX.utils.aoa_to_sheet(resultsData);
  XLSX.utils.book_append_sheet(wb, wsResults, 'Results');

  // Sheet 3: COGS Breakdown
  const breakdownData = [
    ['Category', 'Amount (kr)', 'Percentage'],
    ['Juice', result.breakdown.juice.toFixed(2), ((result.breakdown.juice / result.totalCOGS) * 100).toFixed(1) + '%'],
    ['Yeast', result.breakdown.yeast.toFixed(2), ((result.breakdown.yeast / result.totalCOGS) * 100).toFixed(1) + '%'],
    ['Packaging', result.breakdown.packaging.toFixed(2), ((result.breakdown.packaging / result.totalCOGS) * 100).toFixed(1) + '%'],
    ['Labor', result.breakdown.labor.toFixed(2), ((result.breakdown.labor / result.totalCOGS) * 100).toFixed(1) + '%'],
    ['Overhead', result.breakdown.overhead.toFixed(2), ((result.breakdown.overhead / result.totalCOGS) * 100).toFixed(1) + '%'],
    ['Total', result.totalCOGS.toFixed(2), '100%'],
  ];

  const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownData);
  XLSX.utils.book_append_sheet(wb, wsBreakdown, 'Breakdown');

  // Write file
  XLSX.writeFile(wb, filename);
};

/**
 * Import economics from Excel workbook
 * Expects specific structure matching exportToExcel
 */
export const importFromExcel = (file: File): Promise<EconInput> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });

        // Read Inputs sheet
        const wsInput = wb.Sheets['Inputs'];
        if (!wsInput) {
          throw new Error('Missing "Inputs" sheet');
        }

        const inputData = XLSX.utils.sheet_to_json<any>(wsInput, { header: 1 });

        // Parse input data (skip header)
        const parseValue = (section: string, param: string): number => {
          const row = inputData.find(
            (r: any[]) => r[0] === section && r[1] === param
          ) as any[];
          return row ? parseFloat(row[2]) : 0;
        };

        const input: EconInput = {
          ingredients: {
            juicePerLiter: parseValue('Ingredients', 'Juice Cost'),
            yeastPer1000L: parseValue('Ingredients', 'Yeast Cost'),
            sugarPerKg: parseValue('Ingredients', 'Sugar Cost'),
            otherPerBottle: parseValue('Ingredients', 'Other Costs'),
          },
          packaging: {
            bottle75cl: parseValue('Packaging', 'Bottle 75cl'),
            bottle150cl: parseValue('Packaging', 'Bottle 150cl'),
            label: parseValue('Packaging', 'Label'),
            cap: parseValue('Packaging', 'Cap'),
            box: parseValue('Packaging', 'Box'),
          },
          labor: {
            hourlyRate: parseValue('Labor', 'Hourly Rate'),
            hoursPerBatch: parseValue('Labor', 'Hours per Batch'),
            monthlyFixed: parseValue('Labor', 'Monthly Fixed'),
          },
          overhead: {
            monthlyFixed: parseValue('Overhead', 'Monthly Fixed'),
            perLiter: parseValue('Overhead', 'Per Liter'),
            percentOfCOGS: parseValue('Overhead', 'Percent of COGS'),
          },
          production: {
            volumeLiters: parseValue('Production', 'Volume'),
            wastagePercent: parseValue('Production', 'Wastage'),
            yieldEfficiency: parseValue('Production', 'Yield Efficiency'),
          },
          pricing: {
            bottle75clExclVAT: parseValue('Pricing', 'Bottle 75cl Price'),
            bottle150clExclVAT: parseValue('Pricing', 'Bottle 150cl Price'),
            priceInflationYearly: parseValue('Pricing', 'Price Inflation'),
          },
        };

        // Validate with Zod
        const validated = EconInputZ.parse(input);
        resolve(validated);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};
