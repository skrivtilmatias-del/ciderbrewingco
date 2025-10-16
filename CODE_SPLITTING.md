# Code Splitting & Performance Optimization

This document describes the code splitting strategy implemented to reduce the initial bundle size and improve Time to Interactive (TTI).

## Bundle Size Goals

- **Before Optimization**: ~800KB initial bundle
- **After Optimization**: ~300KB initial bundle
- **Target TTI**: < 3 seconds on 3G connection

## Code Splitting Strategy

### 1. Route-Based Splitting (Lazy Loading)

All major tab components are lazy-loaded using React.lazy() and loaded only when navigated to:

```typescript
// ❌ Old: All components loaded upfront
import { BatchesTab } from '@/components/tabs/BatchesTab';
import { ProductionTab } from '@/components/tabs/ProductionTab';

// ✅ New: Components loaded on demand
const BatchesTab = lazy(() => import('@/components/tabs/BatchesTab'));
const ProductionTab = lazy(() => import('@/components/tabs/ProductionTab'));
```

**Lazy-Loaded Components:**
- `BatchesTab` (~50KB)
- `ProductionTab` (~60KB)
- `BlendingTab` (~45KB)
- `CellarTab` (~30KB)
- `SuppliersTab` (~40KB)
- `TastingTab` (~35KB)
- `ToolsTab` (~55KB)
- `ProductionAnalytics` (~70KB with recharts)

**Estimated Savings**: ~385KB removed from initial bundle

### 2. Modal/Dialog Splitting

Modals are split into separate chunks since they're not needed until opened:

```typescript
// These load only when dialogs are opened
const BatchDetails = lazy(() => import('@/components/BatchDetails'));
const BlendBatchDetailsTabbed = lazy(() => import('@/components/BlendBatchDetailsTabbed'));
const TastingAnalysisDialog = lazy(() => import('@/components/TastingAnalysisDialog'));
```

**Estimated Savings**: ~80KB

### 3. Heavy Feature Libraries

Chart libraries and export utilities are loaded only when their features are accessed:

```typescript
// Charts loaded only when analytics tab opens (~100KB)
const ProductionAnalytics = lazy(() => import('@/components/ProductionAnalytics'));

// QR codes loaded only when printing labels (~25KB)
const PrintQRCodes = lazy(() => import('@/components/PrintQRCodes'));

// Canvas libraries loaded only in floor plan tool (~150KB)
// Already split at route level in App.tsx
```

### 4. Vendor Chunk Splitting

Large vendor libraries are split into separate chunks for better caching:

```javascript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query', '@tanstack/react-virtual'],
  'ui-vendor': ['@radix-ui/*'],
  'chart-vendor': ['recharts'],
  'canvas-vendor': ['konva', 'react-konva'],
  'export-vendor': ['jspdf', 'html2canvas', 'xlsx', 'jszip'],
}
```

**Benefits:**
- Better browser caching (vendor code changes less frequently)
- Parallel downloads for faster page load
- Smaller main bundle

## Module Preloading

To maintain instant navigation feel, components are preloaded on hover:

```typescript
const handleBlendingTabHover = () => {
  // Prefetch data
  prefetchBlendData(queryClient);
  // Preload component code
  preloadComponent(BlendingTab);
};
```

**Preloading triggers:**
- Tab button hover
- Dialog open button hover
- Navigation link hover

## Loading States

### Tab Loading Fallback

Smooth skeleton UI shown while tab components load:

```tsx
<Suspense fallback={<TabLoadingFallback />}>
  <BatchesTab {...props} />
</Suspense>
```

### Modal Loading

Silent loading for modals (no fallback needed):

```tsx
<Suspense fallback={null}>
  <BatchDetails {...props} />
</Suspense>
```

## Bundle Analysis

### Generate Bundle Report

```bash
npm run build
# Opens dist/stats.html with interactive bundle visualization
```

The visualizer shows:
- Chunk sizes (minified + gzipped)
- Dependency treemap
- Module sizes
- Optimization opportunities

### Reading the Report

1. **Large chunks** - Consider further splitting if > 500KB
2. **Duplicate modules** - Check for multiple versions of same library
3. **Unused exports** - Look for tree-shaking opportunities

## Performance Monitoring

### Development Mode

Component render tracking is enabled in development:

```typescript
useRenderTracking('ComponentName', { propCount: props.length });
```

Check console for:
- Render counts
- Expensive re-renders
- Component mount/unmount times

### Production Monitoring

Use browser DevTools:
1. **Performance** tab - Record page load
2. **Network** tab - Check chunk load times
3. **Coverage** tab - Find unused code

## Best Practices

### ✅ Do

- Lazy load route-level components
- Split heavy libraries (charts, canvas, PDFs)
- Preload on user intent (hover, click)
- Use Suspense boundaries
- Keep vendor chunks separate
- Monitor bundle size regularly

### ❌ Don't

- Lazy load small components (< 10KB)
- Split components used on every page
- Over-split (creates HTTP overhead)
- Forget loading states
- Ignore bundle analyzer warnings

## Troubleshooting

### Slow Initial Load

1. Check bundle size: `npm run build`
2. Look for large chunks in stats.html
3. Consider further splitting

### White Flash on Navigation

1. Add loading fallback to Suspense
2. Implement preloading on hover
3. Check TabLoadingFallback styling

### Components Not Loading

1. Check browser console for errors
2. Verify dynamic import paths
3. Ensure Suspense boundary exists

## Measuring Success

### Key Metrics

- **Initial Bundle**: < 300KB (gzipped)
- **Time to Interactive**: < 3s (3G)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s

### Tools

- Lighthouse (Chrome DevTools)
- WebPageTest (https://webpagetest.org)
- Bundle analyzer (dist/stats.html)

## Future Optimizations

1. **Service Worker**: Cache chunks for offline access
2. **HTTP/2 Push**: Push critical chunks with initial request
3. **Dynamic Imports**: Load calculations only when calculator opened
4. **Tree Shaking**: Remove unused Radix UI components
5. **Image Optimization**: Convert PNGs to WebP
