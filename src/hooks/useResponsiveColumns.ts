import { useState, useEffect } from 'react';

/**
 * Hook to calculate number of columns based on screen width
 * Updates on window resize with debouncing
 * 
 * @param layout - 'grid' or 'list' layout mode
 * @returns number of columns for current screen size
 */
export const useResponsiveColumns = (layout: 'grid' | 'list'): number => {
  const getColumns = () => {
    if (layout === 'list') return 1;
    
    const width = window.innerWidth;
    if (width >= 1280) return 3; // Desktop: 3 columns
    if (width >= 768) return 2;  // Tablet: 2 columns
    return 1; // Mobile: 1 column
  };

  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce resize events to avoid excessive recalculations
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setColumns(getColumns());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [layout]);

  return columns;
};
