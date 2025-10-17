import { useEffect, useRef } from 'react';

/**
 * Hook to save and restore scroll position using sessionStorage
 * Useful for maintaining scroll position when navigating between pages
 * 
 * @param key - Unique key for storing scroll position (e.g., route path)
 * @param scrollElement - Ref to the scrollable element
 */
export const useScrollPosition = (
  key: string,
  scrollElement: React.RefObject<HTMLElement>
) => {
  const restoredRef = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    if (!scrollElement.current || restoredRef.current) return;

    const savedPosition = sessionStorage.getItem(`scroll-${key}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (scrollElement.current) {
          scrollElement.current.scrollTop = position;
          restoredRef.current = true;
        }
      });
    }
  }, [key, scrollElement]);

  // Save scroll position on unmount and during scroll
  useEffect(() => {
    const element = scrollElement.current;
    if (!element) return;

    const savePosition = () => {
      sessionStorage.setItem(`scroll-${key}`, element.scrollTop.toString());
    };

    // Debounce scroll events to avoid excessive storage writes
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(savePosition, 100);
    };

    element.addEventListener('scroll', handleScroll);
    
    // Save on unmount
    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener('scroll', handleScroll);
      savePosition();
    };
  }, [key, scrollElement]);
};
