import { useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

/**
 * useTouchFriendlyPrefetch - Smart prefetching for mobile and desktop
 * 
 * Strategy:
 * - Desktop: Use hover events for instant prefetching
 * - Mobile: Use Intersection Observer to prefetch when element is near viewport
 * 
 * This provides a better UX since mobile devices don't have hover states
 * and we want to prefetch before the user actually taps the element.
 * 
 * @param prefetchFn - Function to execute for prefetching
 * @param enabled - Whether prefetching is enabled
 * @returns Ref to attach to element and hover handler for desktop
 */
export const useTouchFriendlyPrefetch = (
  prefetchFn: () => void,
  enabled = true
) => {
  const isMobile = useIsMobile();
  const elementRef = useRef<HTMLElement>(null);
  const hasPrefetched = useRef(false);

  /**
   * Hover handler for desktop
   * Returns immediately on mobile to avoid unnecessary work
   */
  const handleHover = useCallback(() => {
    if (!enabled || hasPrefetched.current || isMobile) return;
    
    hasPrefetched.current = true;
    prefetchFn();
  }, [enabled, isMobile, prefetchFn]);

  /**
   * Intersection Observer for mobile
   * Prefetches when element is 200px from viewport
   */
  useEffect(() => {
    if (!enabled || !isMobile || hasPrefetched.current) return;

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Prefetch when element is near viewport (within 200px)
          if (entry.isIntersecting && !hasPrefetched.current) {
            hasPrefetched.current = true;
            prefetchFn();
          }
        });
      },
      {
        // Start prefetching when element is 200px from viewport
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isMobile, prefetchFn]);

  /**
   * Reset prefetch flag when component unmounts or prefetchFn changes
   * This allows re-prefetching if the same tab is visited again
   */
  useEffect(() => {
    return () => {
      hasPrefetched.current = false;
    };
  }, [prefetchFn]);

  return {
    ref: elementRef,
    onMouseEnter: handleHover,
  };
};
