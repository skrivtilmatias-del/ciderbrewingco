import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * LazyPreload - Enhanced lazy loading with preload capability
 * Allows components to be preloaded on hover for instant navigation
 */
export type PreloadableComponent<T = any> = LazyExoticComponent<ComponentType<T>> & {
  preload: () => Promise<{ default: ComponentType<T> }>;
};

/**
 * Create a lazy-loaded component with preload capability
 * @param factory - Dynamic import function
 * @returns Lazy component with preload method
 */
export function lazyWithPreload<T = any>(
  factory: () => Promise<{ default: ComponentType<T> }>
): PreloadableComponent<T> {
  const Component = lazy(factory);
  (Component as any).preload = factory;
  return Component as PreloadableComponent<T>;
}

/**
 * Preload a component module
 * @param component - Component with preload method
 */
export async function preloadComponent<T = any>(
  component: PreloadableComponent<T>
): Promise<void> {
  try {
    await component.preload();
  } catch (error) {
    console.warn('Failed to preload component:', error);
  }
}
