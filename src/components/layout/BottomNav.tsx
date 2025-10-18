import { useState, useEffect, useRef, startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Activity, Wine, Award, Grid, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface BottomNavProps {
  /** Show badge count for batches needing attention */
  batchBadgeCount?: number;
  /** Current user role */
  userRole?: string;
}

/**
 * BottomNav - Mobile-first bottom navigation with native app feel
 * 
 * Features:
 * - Fixed bottom positioning with safe area insets
 * - Auto-hide on scroll down, show on scroll up
 * - Active state animations with accent color
 * - Ripple effect on tap
 * - Haptic feedback (when supported)
 * - Badge notifications
 * - Hide when keyboard is open
 * - Smooth slide-in animation
 * - Responsive: Only shows on mobile/tablet (<768px)
 * 
 * Performance:
 * - Uses transform for 60fps animations
 * - Throttled scroll listener
 * - CSS-only ripple effect
 */
export const BottomNav = ({ batchBadgeCount = 0, userRole = 'production' }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Primary navigation items (always visible)
  const primaryItems: NavItem[] = [
    {
      icon: Package,
      label: 'Batches',
      path: paths.batches(),
      badge: batchBadgeCount,
    },
    {
      icon: Activity,
      label: 'Production',
      path: paths.production(),
    },
    {
      icon: Wine,
      label: 'Blending',
      path: paths.blending(),
    },
    {
      icon: Award,
      label: 'Tasting',
      path: paths.tasting(),
    },
  ];

  // Secondary items (in "More" dropdown)
  const secondaryItems: NavItem[] = [
    {
      icon: Activity,
      label: 'Analytics',
      path: paths.analytics(),
    },
    ...(userRole === 'production'
      ? [
          {
            icon: Grid,
            label: 'Cellar',
            path: paths.cellar(),
          },
          {
            icon: Grid,
            label: 'Suppliers',
            path: paths.suppliers(),
          },
          {
            icon: Grid,
            label: 'Tools',
            path: '/tools',
          },
        ]
      : []),
  ];

  // Check if current path matches nav item
  const isActive = (path: string) => {
    if (path === paths.batches()) {
      return location.pathname === '/' || location.pathname === paths.batches();
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Haptic feedback (when supported)
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Light haptic feedback
    }
  };

  // Handle navigation with haptic feedback
  const handleNavigate = (path: string) => {
    triggerHaptic();
    startTransition(() => navigate(path));
  };

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Throttle scroll events
      scrollTimeout.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        
        // Show nav when scrolling up, hide when scrolling down
        if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Detect keyboard open/close (approximation using viewport resize)
  useEffect(() => {
    const handleResize = () => {
      // On mobile, when keyboard opens, window.innerHeight decreases significantly
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      
      // If viewport is significantly smaller, keyboard is likely open
      setIsKeyboardOpen(viewportHeight < documentHeight * 0.7);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide bottom nav if keyboard is open or on desktop
  if (isKeyboardOpen) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav
        className={cn(
          // Base styles
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-card/95 backdrop-blur-lg border-t border-border',
          'md:hidden', // Hide on desktop (≥768px)
          // Safe area insets for notch devices
          'pb-[env(safe-area-inset-bottom)]',
          // Slide animation
          'transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          // Ensure it's above other content
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Primary Navigation Items */}
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  // Base styles
                  'relative flex flex-col items-center justify-center',
                  'min-w-[60px] h-12 px-3 rounded-lg',
                  'transition-all duration-200',
                  // Hover/active states
                  'hover:bg-accent/10',
                  // Active state
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground',
                  // Tap highlight (ripple effect handled by CSS)
                  'active:scale-95',
                  // Focus visible
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon with scale animation when active */}
                <div
                  className={cn(
                    'relative transition-transform duration-200',
                    active && 'scale-110'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  
                  {/* Badge notification */}
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full animate-pulse"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] mt-0.5 font-medium',
                    'transition-all duration-200',
                    active && 'font-semibold'
                  )}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-fade-in" />
                )}
              </button>
            );
          })}

          {/* More Button with Sheet */}
          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                onClick={triggerHaptic}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-w-[60px] h-12 px-3 rounded-lg',
                  'transition-all duration-200',
                  'hover:bg-accent/10',
                  'text-muted-foreground',
                  'active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-label="More"
              >
                <div className="relative">
                  <Grid className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium">More</span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              
              <div className="grid grid-cols-3 gap-4 py-6">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        handleNavigate(item.path);
                        setMoreSheetOpen(false);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg',
                        'transition-all duration-200',
                        'hover:bg-accent',
                        active ? 'bg-primary/10 text-primary' : 'text-foreground',
                        'active:scale-95'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
};
