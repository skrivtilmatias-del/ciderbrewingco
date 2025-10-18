/**
 * Centralized route path definitions
 * All navigation should use these helpers to ensure consistency
 */

export const paths = {
  // Root
  root: () => '/',
  
  // Main navigation
  batches: () => '/batches',
  production: () => '/production',
  blending: () => '/blending',
  cellar: () => '/cellar',
  tasting: () => '/tasting',
  analytics: () => '/analytics',
  suppliers: () => '/suppliers',
  
  // Auth
  auth: (next?: string) => next ? `/auth?next=${encodeURIComponent(next)}` : '/auth',
  
  // Tools
  tools: {
    calculators: () => '/tools/calculators',
    printLabels: () => '/tools/print-labels',
    floorPlan: () => '/tools/floor-plan',
    costCalculation: () => '/tools/cost-calculation',
    planning: () => '/tools/planning',
    webhooks: () => '/tools/webhooks',
    install: () => '/tools/install',
  },
  
  // Detail pages
  blend: (id: string) => `/blend/${id}`,
  supplier: (id: string) => `/suppliers/${id}`,
  
  // Print
  printLabels: (mode: 'batch' | 'blend', ids: string[]) => 
    `/print/labels?mode=${mode}&ids=${ids.join(',')}`,
  
  // QR redirects
  qr: {
    batch: (id: string) => `/r/b/${id}`,
    blend: (id: string) => `/r/l/${id}`,
  },
  
  // Batch with query params
  batchWithId: (id: string) => `/batches?batch=${id}`,
} as const;

/**
 * Check if a URL is external
 */
export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

/**
 * Get display name for a path
 */
export const getPathName = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/batches': 'Batches',
    '/production': 'Production',
    '/blending': 'Blending',
    '/cellar': 'Cellar',
    '/tasting': 'Tasting',
    '/analytics': 'Analytics',
    '/suppliers': 'Suppliers',
    '/tools/calculators': 'Calculators',
    '/tools/print-labels': 'Print Labels',
    '/tools/floor-plan': 'Floor Plan',
    '/tools/cost-calculation': 'Cost Calculation',
    '/tools/planning': 'Planning Tool',
    '/tools/webhooks': 'Webhooks',
    '/tools/install': 'Install',
    '/auth': 'Authentication',
  };
  
  return pathMap[pathname] || 'Unknown';
};
