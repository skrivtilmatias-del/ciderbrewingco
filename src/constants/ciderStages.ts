export const STAGES = [
  "Harvest",
  "Sorting & Washing",
  "Milling",
  "Pressing",
  "Settling/Enzymes",
  "Pitching & Fermentation",
  "Cold Crash",
  "Racking",
  "Malolactic",
  "Stabilisation/Finings",
  "Blending",
  "Backsweetening",
  "Bottling",
  "Conditioning/Lees Aging",
  "Tasting/QA"
] as const;

export type CiderStage = typeof STAGES[number];

export const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  Harvest: [
    "Record orchard & cultivar mix",
    "Measure starch/iodine if needed",
    "Note fruit condition (brix, firmness, rot %)"
  ],
  "Sorting & Washing": [
    "Remove rotten/moldy fruit",
    "Rinse and inspect crates",
    "Log losses (%)"
  ],
  Milling: [
    "Target grist texture logged",
    "Add antioxidants (ppm) if used",
    "Weigh pomace"
  ],
  Pressing: [
    "Press pressure profile",
    "Yield (L/kg)",
    "Clarify plan (settle/enzymes)"
  ],
  "Pitching & Fermentation": [
    "Yeast strain, lot, rehydration",
    "Nutrients (YAN target)",
    "Fermentation temp target"
  ],
  Racking: [
    "Rack date & lees volume",
    "SO₂ add (free/total)",
    "Dissolved O₂ reading"
  ],
  Blending: [
    "Component IDs & %",
    "Sensory goals",
    "Adjust acid/tannin?"
  ],
  Bottling: [
    "Final SO₂ & clarity",
    "Prime sugar or tirage",
    "Closure & lot codes"
  ],
  "Tasting/QA": [
    "Appearance, aroma, palate",
    "Faults check",
    "Action items"
  ]
};

export const ROLE_CHECKLISTS: Record<string, Record<string, string[]>> = {
  Cellar: {
    Pressing: ["Rinse press & lines", "CIP status OK", "Yield per cycle recorded"],
    Racking: ["Purge receiving tank CO₂", "Lees volume recorded", "DO before/after"],
    Bottling: ["Filter integrity test", "Closures sanitized", "Line purge complete"]
  },
  Lab: {
    "Pitching & Fermentation": ["YAN measured", "Viability/Vitality check", "Gravity & pH logged"],
    "Tasting/QA": ["Triangle test scheduled", "SO₂ (free/total) check", "Turbidity noted"],
    Blending: ["Bench trials documented", "Post-blend pH/TA", "Stability tests"]
  }
};

export const STAGE_TEMPLATES: Record<string, string> = {
  "Pitching & Fermentation": `Yeast: \nNutrient plan (YAN target): \nTemp target: \nOG: \npH: \nTA (g/L): \nNotes:`,
  Bottling: `Clarified by: \nSO₂ free/total: \nPrime sugar: \nTarget CO₂ vols: \nFinal gravity: \nActions:`,
  "Tasting/QA": `Appearance: \nAroma: \nPalate: \nBalance/Structure: \nFaults: \nSummary:`
};
