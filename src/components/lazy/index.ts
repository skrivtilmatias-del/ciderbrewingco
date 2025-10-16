/**
 * Lazy-loaded components with code splitting
 * This file centralizes all lazy imports to reduce initial bundle size
 * 
 * Bundle Size Targets:
 * - Initial: ~300KB (down from ~800KB)
 * - Tabs: ~50-100KB each (loaded on demand)
 * - Heavy features: Loaded only when needed
 */

import { lazyWithPreload } from '@/lib/lazyPreload';

// ============= Tab Components (Primary Code Split Points) =============
// Each tab is a separate chunk that loads only when user navigates to it

export const BatchesTab = lazyWithPreload(() => 
  import('@/components/tabs/BatchesTab')
    .then(module => ({ default: module.BatchesTab }))
);

export const ProductionTab = lazyWithPreload(() => 
  import('@/components/tabs/ProductionTab')
    .then(module => ({ default: module.ProductionTab }))
);

export const BlendingTab = lazyWithPreload(() => 
  import('@/components/tabs/BlendingTab')
    .then(module => ({ default: module.BlendingTab }))
);

export const CellarTab = lazyWithPreload(() => 
  import('@/components/tabs/CellarTab')
    .then(module => ({ default: module.CellarTab }))
);

export const SuppliersTab = lazyWithPreload(() => 
  import('@/components/tabs/SuppliersTab')
    .then(module => ({ default: module.SuppliersTab }))
);

export const TastingTab = lazyWithPreload(() => 
  import('@/components/tabs/TastingTab')
    .then(module => ({ default: module.TastingTab }))
);

export const ToolsTab = lazyWithPreload(() => 
  import('@/components/tabs/ToolsTab')
    .then(module => ({ default: module.ToolsTab }))
);

// ============= Heavy Feature Components =============
// These are loaded only when specific features are accessed

export const ProductionAnalytics = lazyWithPreload(() => 
  import('@/components/ProductionAnalytics')
    .then(module => ({ default: module.ProductionAnalytics }))
);

// ============= Modal/Dialog Components =============
// Split modals to reduce initial bundle - they're not needed until opened

export const BatchDetails = lazyWithPreload(() => 
  import('@/components/BatchDetails')
    .then(module => ({ default: module.BatchDetails }))
);

export const BlendBatchDetailsTabbed = lazyWithPreload(() => 
  import('@/components/BlendBatchDetailsTabbed')
    .then(module => ({ default: module.BlendBatchDetailsTabbed }))
);

export const TastingAnalysisDialog = lazyWithPreload(() => 
  import('@/components/TastingAnalysisDialog')
    .then(module => ({ default: module.TastingAnalysisDialog }))
);

// ============= Chart Components =============
// Charts are heavy (recharts library) - only load when analytics is opened

export const ParameterTrendChart = lazyWithPreload(() => 
  import('@/components/ParameterTrendChart')
    .then(module => ({ default: module.ParameterTrendChart }))
);

// ============= Utility Components =============
// QR codes, exports, etc. - load on demand

export const PrintQRCodes = lazyWithPreload(() => 
  import('@/components/PrintQRCodes')
    .then(module => ({ default: module.PrintQRCodes }))
);
