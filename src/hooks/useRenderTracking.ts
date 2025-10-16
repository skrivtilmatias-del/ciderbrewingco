import { useEffect, useRef } from 'react';

interface RenderMetrics {
  count: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

const renderMetrics = new Map<string, RenderMetrics>();

/**
 * Hook to track component render performance
 * Logs warnings for components that re-render too frequently or take too long
 */
export const useRenderTracking = (componentName: string, props?: Record<string, any>) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    renderCount.current++;
    renderTimes.current.push(duration);
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    const avgRenderTime = 
      renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

    const metrics: RenderMetrics = {
      count: renderCount.current,
      lastRenderTime: duration,
      averageRenderTime: avgRenderTime,
    };

    renderMetrics.set(componentName, metrics);

    // Log warnings in development
    if (process.env.NODE_ENV === 'development') {
      // Warn if component renders too frequently
      if (renderCount.current > 50 && renderCount.current % 10 === 0) {
        console.warn(
          `🔄 ${componentName} has rendered ${renderCount.current} times. Consider optimization.`
        );
      }

      // Warn if render is slow
      if (duration > 16) {
        console.warn(
          `🐌 ${componentName} slow render: ${duration.toFixed(2)}ms (target: <16ms for 60fps)`
        );
      }

      // Log props that changed (helps identify unnecessary re-renders)
      if (props && renderCount.current > 1) {
        const propsChanged = Object.keys(props).filter((key) => {
          const current = props[key];
          const previous = (window as any).__lastProps?.[componentName]?.[key];
          return current !== previous;
        });

        if (propsChanged.length > 0) {
          console.log(`🔧 ${componentName} re-rendered due to:`, propsChanged);
        }

        // Store props for next comparison
        if (!(window as any).__lastProps) {
          (window as any).__lastProps = {};
        }
        (window as any).__lastProps[componentName] = { ...props };
      }
    }

    // Reset start time for next render
    startTime.current = performance.now();
  });

  const currentMetrics = renderMetrics.get(componentName);

  return currentMetrics;
};

/**
 * Get all render metrics (useful for debugging)
 */
export const getRenderMetrics = () => {
  return Array.from(renderMetrics.entries()).map(([name, metrics]) => ({
    component: name,
    ...metrics,
  }));
};

/**
 * Clear all render metrics
 */
export const clearRenderMetrics = () => {
  renderMetrics.clear();
  if ((window as any).__lastProps) {
    (window as any).__lastProps = {};
  }
};
