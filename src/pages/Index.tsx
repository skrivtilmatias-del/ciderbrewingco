import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { useBatches } from "@/hooks/useBatches";
import { useRealtimeBatches } from "@/hooks/useRealtimeBatches";
import { useParallelProductionData } from "@/hooks/useParallelProductionData";
import { useOptimizedBatches } from "@/hooks/useOptimizedBatches";
import { useRenderTracking } from "@/hooks/useRenderTracking";
import { useDerivedSelectedBatch } from "@/hooks/useDerivedSelectedBatch";
import { useDerivedSelectedBlend } from "@/hooks/useDerivedSelectedBlend";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchBlendData, prefetchAnalyticsData, prefetchSupplierData, prefetchAdjacentBatches } from "@/lib/prefetchUtils";
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AppHeader } from "@/components/layout/AppHeader";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { TabLoadingFallback } from "@/components/ui/TabLoadingFallback";
import { preloadComponent } from "@/lib/lazyPreload";
import { BaseErrorBoundary, TabErrorBoundary } from "@/components/errors";

// ============= Code-Split Tab Components =============
// Lazy load all tabs to reduce initial bundle size from ~800KB to ~300KB
import {
  BatchesTab,
  ProductionTab,
  BlendingTab,
  CellarTab,
  SuppliersTab,
  TastingTab,
  ToolsTab,
  ProductionAnalytics,
  BlendBatchDetailsTabbed,
  TastingAnalysisDialog,
  BatchDetails,
} from "@/components/lazy";
import { Package, Activity, TrendingUp, Settings2, Wine, Award, Warehouse, QrCode, Layout, DollarSign, Loader2, Webhook, Download, FlaskConical, AlertCircle, RefreshCw, Truck } from "lucide-react";
import { BatchSearch } from "@/components/BatchSearch";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import type { Batch } from "@/components/BatchCard";

const Index = () => {
  // Track renders for performance monitoring
  useRenderTracking('Index');

  const navigate = useNavigate();
  const location = useLocation();
  const { toolView } = useParams();
  const { user, userRole, userProfile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Enable real-time updates
  useRealtimeBatches();
  
  // Use parallel data fetching hook for optimal performance
  // This fetches batches, blends, and suppliers in parallel to eliminate request waterfalls
  const { 
    batches, 
    blends, 
    suppliers,
    isLoading, 
    hasError, 
    errors,
    retry: retryParallelData,
    loadingStates 
  } = useParallelProductionData();
  
  // Still use individual hooks for mutations and side effects
  // Note: useBatches also fetches data but TanStack Query deduplicates it automatically
  // since both use the same queryKey ['batches']. The hook's backfill logic still runs.
  const { updateStage } = useBatches();
  
  // Use state from useAppStore
  const {
    selectedBatchId,
    setSelectedBatchId,
    detailsOpen,
    setDetailsOpen,
    selectedBlendId,
    setSelectedBlendId,
    blendDetailsOpen,
    setBlendDetailsOpen,
    batchSearchQuery,
    setBatchSearchQuery,
    batchSortOrder,
    setBatchSortOrder,
    batchFilters,
  } = useAppStore();
  
  // Derive selected batch and blend from React Query cache (single source of truth)
  const selectedBatch = useDerivedSelectedBatch();
  const selectedBlend = useDerivedSelectedBlend();
  
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Track if component is mounted to prevent memory leaks from async operations
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
    onNewBatch: () => {
      // Trigger new batch dialog via CustomEvent
      // This allows components to listen and respond without tight coupling
      const event = new CustomEvent('openNewBatch');
      window.dispatchEvent(event);
    },
    onFocusSearch: () => {
      // Only focus search on tabs where it's visible
      const tabsWithSearch = ['batches', 'production', 'blending'];
      if (!tabsWithSearch.includes(activeTab)) {
        toast.info('Search is available on Batches, Production, and Blending tabs');
        return;
      }
      
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      } else {
        console.warn('Search input ref not available - ensure BatchSearch is rendered with ref');
      }
    },
  });
  
  // Memoize active tab computation
  const activeTab = useMemo((): "batches" | "production" | "blending" | "cellar" | "tasting" | "analytics" | "suppliers" | "tools" => {
    const path = location.pathname;
    if (path === '/batches' || path === '/') return 'batches';
    if (path === '/production') return 'production';
    if (path === '/blending') return 'blending';
    if (path === '/cellar') return 'cellar';
    if (path === '/tasting') return 'tasting';
    if (path === '/analytics') return 'analytics';
    if (path === '/suppliers') return 'suppliers';
    if (path.startsWith('/tools')) return 'tools';
    return 'batches';
  }, [location.pathname]);

  // This hook memoizes all expensive computations
  const { sorted: optimizedBatches, groupedByStage } = useOptimizedBatches({
    batches,
    searchQuery: batchSearchQuery,
    filters: batchFilters, // From store
    sortOrder: batchSortOrder as any,
  });

  // Handle batch selection from QR redirect via URL params
  const qrRedirectHandled = useRef(false);
  useEffect(() => {
    // Only run once on mount when we have batches
    if (qrRedirectHandled.current || batchesRef.current.length === 0) return;
    
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId) {
      const batch = batchesRef.current.find((b) => b.id === batchId);
      if (batch) {
        qrRedirectHandled.current = true;
        setSelectedBatchId(batch.id);
        navigate("/production", { replace: true });
      } else {
        toast.error(`Batch ${batchId} not found`);
        navigate("/batches", { replace: true });
      }
    }
  }, [location.search]); // Only depend on search params to avoid race conditions

  // Track if initial batch selection has been made
  const hasInitializedSelection = useRef(false);
  // Keep a ref to the current batches array to avoid stale closures
  const batchesRef = useRef(batches);
  batchesRef.current = batches;
  
  // Auto-select first batch on initial load and handle edge cases
  // Dependencies: Only batches.length and selectedBatchId to avoid unnecessary reruns
  useEffect(() => {
    const currentBatches = batchesRef.current;
    
    // No batches available - clear selection
    if (currentBatches.length === 0) {
      if (selectedBatchId) {
        setSelectedBatchId(null);
      }
      hasInitializedSelection.current = false;
      return;
    }
    
    // If we have a selected batch, verify it still exists
    if (selectedBatchId) {
      const batchStillExists = currentBatches.some(b => b.id === selectedBatchId);
      if (!batchStillExists) {
        // Selected batch was deleted - select first batch
        setSelectedBatchId(currentBatches[0].id);
        hasInitializedSelection.current = true;
      }
      return;
    }
    
    // No selection and haven't initialized yet - select first batch
    if (!hasInitializedSelection.current) {
      setSelectedBatchId(currentBatches[0].id);
      hasInitializedSelection.current = true;
    }
  }, [batches.length, selectedBatchId]);

  // Memoize event handlers with useCallback to prevent unnecessary re-renders
  const handleBatchClick = useCallback((batch: Batch | null | undefined) => {
    // Defensive: Early return for null/undefined batch
    if (!batch) return;
    
    // Defensive: Validate batch has required id property
    if (!batch.id) {
      console.error('handleBatchClick: Batch missing required id property', batch);
      return;
    }
    
    // Defensive: Verify batch exists in current batch list
    // Use ref for latest data to avoid stale closures
    const batchExists = batchesRef.current.some(b => b.id === batch.id);
    if (!batchExists) {
      console.warn('handleBatchClick: Batch not found in current batch list', batch.id);
      toast.error('This batch is no longer available');
      return;
    }
    
    setSelectedBatchId(batch.id);
    setDetailsOpen(true);
    
    /**
     * Smart Prefetching: Prefetch adjacent batches
     * When user clicks a batch, anticipate they might view the next ones
     * Prefetch the next 3 batches for smooth scrolling experience
     */
    const currentIndex = batchesRef.current.findIndex(b => b.id === batch.id);
    if (currentIndex >= 0) {
      prefetchAdjacentBatches(queryClient, batchesRef.current, currentIndex, 3).catch(() => {
        // Silently fail - prefetch is optional optimization
      });
    }
  }, [queryClient, setSelectedBatchId, setDetailsOpen]); // Removed batches dependency to fix stale closure

  const handleUpdateStage = useCallback(async (batchId: string, newStage: Batch["currentStage"]) => {
    // Use the mutation from useBatches hook
    updateStage({ batchId, newStage });
  }, [updateStage]);


  const handleGoToProduction = useCallback((batch: Batch) => {
    setSelectedBatchId(batch.id);
    setDetailsOpen(false);
    navigate("/production");
    
    /**
     * Prefetch adjacent batches when entering production view
     * User is likely to navigate between batches in production
     */
    const currentIndex = batches.findIndex(b => b.id === batch.id);
    if (currentIndex >= 0) {
      prefetchAdjacentBatches(queryClient, batches, currentIndex, 3).catch(() => {
        // Silently fail
      });
    }
  }, [batches, navigate, queryClient, setSelectedBatchId, setDetailsOpen]);

  /**
   * Tab Hover Prefetching Handlers
   * Strategy: Prefetch data AND component code when user hovers over tab
   * Makes tab navigation feel instant
   * 
   * Memory Leak Prevention: Uses isMountedRef to prevent operations after unmount
   */
  const handleBlendingTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Prefetch both data and component code
    Promise.all([
      prefetchBlendData(queryClient),
      preloadComponent(BlendingTab)
    ]).catch(() => {
      // Silently fail - prefetch is optional
      // Check mounted before any potential state updates
      if (!isMountedRef.current) return;
    });
  }, [queryClient]);

  const handleAnalyticsTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Prefetch both data and component code
    Promise.all([
      prefetchAnalyticsData(queryClient),
      preloadComponent(ProductionAnalytics)
    ]).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, [queryClient]);

  const handleSuppliersTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Prefetch both data and component code
    Promise.all([
      prefetchSupplierData(queryClient),
      preloadComponent(SuppliersTab)
    ]).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, [queryClient]);

  const handleProductionTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    preloadComponent(ProductionTab).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, []);

  const handleBatchesTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    preloadComponent(BatchesTab).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, []);

  const handleTastingTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    preloadComponent(TastingTab).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, []);

  const handleToolsTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    preloadComponent(ToolsTab).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, []);

  const handleCellarTabHover = useCallback(() => {
    if (!isMountedRef.current) return;
    
    preloadComponent(CellarTab).catch(() => {
      // Silently fail - prefetch is optional
      if (!isMountedRef.current) return;
    });
  }, []);

  const handleSaveTasting = async (data: any, analysisId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Session expired. Please log in again");
      navigate("/auth");
      return;
    }

    try {
      if (analysisId) {
        const { error } = await supabase
          .from("tasting_analysis")
          .update({
            blend_batch_id: data.blend_batch_id || null,
            competitor_brand: data.competitor_brand || null,
            taste: data.taste || null,
            colour: data.colour || null,
            palate: data.palate || null,
            overall_score: data.overall_score || null,
            notes: data.notes || null,
            attachments: data.attachments || null,
          })
          .eq("id", analysisId);

        if (error) throw error;
        toast.success("Tasting analysis updated");
      } else {
        const { error } = await supabase
          .from("tasting_analysis")
          .insert([{
            user_id: user!.id,
            blend_batch_id: data.blend_batch_id || null,
            competitor_brand: data.competitor_brand || null,
            taste: data.taste || null,
            colour: data.colour || null,
            palate: data.palate || null,
            overall_score: data.overall_score || null,
            notes: data.notes || null,
            attachments: data.attachments || null,
          }]);

        if (error) throw error;
        toast.success("Tasting analysis created");
      }
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  // Retry function - uses the combined retry from parallel hook
  const handleRetry = () => {
    retryParallelData();
  };

  // Show error state - handle partial failures gracefully
  if (hasError && !isLoading) {
    const failedResources = Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([name]) => name);
    
    const hasAnyData = batches.length > 0 || blends.length > 0;
    
    // Map failed resources to affected features
    const affectedFeatures = {
      batches: ['All Batches tab', 'Production tracking', 'Batch details'],
      blends: ['Blending tab', 'Cellar management', 'Tasting notes'],
      suppliers: ['Supplier management', 'Cost calculations']
    };
    
    const limitedFeatures = failedResources
      .flatMap(resource => affectedFeatures[resource as keyof typeof affectedFeatures] || []);
    
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <h1 className="text-xl font-bold">CiderTracker</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription className="space-y-4">
              {/* Show specific errors */}
              <div className="space-y-2">
                {Object.entries(errors).map(([key, error]) => 
                  error ? (
                    <p key={key} className="text-sm">
                      <strong className="font-semibold capitalize">{key}:</strong>{' '}
                      {getUserFriendlyError(error)}
                    </p>
                  ) : null
                )}
              </div>
              
              {/* Show affected features */}
              {hasAnyData && limitedFeatures.length > 0 && (
                <div className="text-sm">
                  <p className="font-semibold mb-1">Limited Features:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {limitedFeatures.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry Failed Requests
              </Button>
            </AlertDescription>
          </Alert>
          
          {/* Show available data even if some queries failed */}
          {hasAnyData && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Showing available data for: {[
                  batches.length > 0 && 'Batches',
                  blends.length > 0 && 'Blends',
                  suppliers.length > 0 && 'Suppliers'
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show loading state with granular loading indicators
  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-6">
            {/* Granular loading indicators for each resource */}
            <div className="space-y-3 max-w-md">
              {/* Batches loading state */}
              {loadingStates.batches ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : batches.length > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-500">✓</span> Batches loaded ({batches.length})
                </p>
              ) : null}
              
              {/* Blends loading state */}
              {loadingStates.blends ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : blends.length > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-500">✓</span> Blends loaded ({blends.length})
                </p>
              ) : null}
              
              {/* Suppliers loading state */}
              {loadingStates.suppliers ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : suppliers.length > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-500">✓</span> Suppliers loaded ({suppliers.length})
                </p>
              ) : null}
            </div>
            
            {/* Show skeleton cards for visual feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BaseErrorBoundary level="root">
      <div className="min-h-dvh bg-background overflow-x-hidden">
        <KeyboardShortcutsDialog 
          open={showShortcuts} 
          onOpenChange={setShowShortcuts} 
        />
        
        <AppHeader 
          user={user}
          userProfile={userProfile}
          userRole={userRole}
          onBatchCreated={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
          onTastingSaved={handleSaveTasting}
          blendBatches={blends}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Tabs value={activeTab} className="mb-6 sm:mb-8">{/* ... keep existing code */}
          {/* Tabs and Search/Sort Controls */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            {/* Row 1: Tabs on left, Search/Sort on right (desktop) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* Tabs - Hidden on Mobile (bottom nav used instead) */}
              <div className="overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0 hidden md:block">
                <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 h-auto p-1">
                  {userRole === "production" && (
                    <>
                      <TabsTrigger value="batches" asChild>
                        <button 
                          onClick={() => navigate(paths.batches())} 
                          onMouseEnter={handleBatchesTabHover}
                          className="py-1.5 px-3"
                        >
                          <Package className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">All Batches</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="production" asChild>
                        <button 
                          onClick={() => navigate(paths.production())} 
                          onMouseEnter={handleProductionTabHover}
                          className="py-1.5 px-3"
                        >
                          <Activity className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Production</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="blending" asChild>
                        <button 
                          onClick={() => navigate(paths.blending())} 
                          onMouseEnter={handleBlendingTabHover}
                          className="py-1.5 px-3"
                        >
                          <Wine className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Blending</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="cellar" asChild>
                        <button 
                          onClick={() => navigate(paths.cellar())} 
                          onMouseEnter={handleCellarTabHover}
                          className="py-1.5 px-3"
                        >
                          <Warehouse className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cellar</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="suppliers" asChild>
                        <button 
                          onClick={() => navigate(paths.suppliers())} 
                          onMouseEnter={handleSuppliersTabHover}
                          className="py-1.5 px-3"
                        >
                          <Truck className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Suppliers</span>
                        </button>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger value="tasting" asChild>
                    <button 
                      onClick={() => navigate(paths.tasting())} 
                      onMouseEnter={handleTastingTabHover}
                      className="py-1.5 px-3"
                    >
                      <Award className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Tasting</span>
                    </button>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" asChild>
                    <button 
                      onClick={() => navigate(paths.analytics())} 
                      onMouseEnter={handleAnalyticsTabHover}
                      className="py-1.5 px-3"
                    >
                      <TrendingUp className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Analytics</span>
                    </button>
                  </TabsTrigger>
                  {userRole === "production" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant={activeTab === "tools" ? "default" : "ghost"} 
                          size="sm" 
                          className="inline-flex items-center justify-center text-xs sm:text-sm whitespace-nowrap py-1.5 px-3 h-9 leading-tight"
                        >
                          <Settings2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Tools</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                        <DropdownMenuLabel>Tools</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(paths.tools.calculators())}>
                          <FlaskConical className="h-4 w-4 mr-2" />
                          Calculators
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.printLabels())}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Print Labels
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.floorPlan())}>
                          <Layout className="h-4 w-4 mr-2" />
                          Floor Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.costCalculation())}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Cost Calculation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.planning())}>
                          <Settings2 className="h-4 w-4 mr-2" />
                          Economic Planning Tool
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.webhooks())}>
                          <Webhook className="h-4 w-4 mr-2" />
                          Webhooks & API
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(paths.tools.install())}>
                          <Download className="h-4 w-4 mr-2" />
                          Install App
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TabsList>
              </div>

              {/* Search and Sort Controls - Show on batches, production, and blending tabs */}
              {(activeTab === "batches" || activeTab === "production" || activeTab === "blending") && userRole === "production" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  <BatchSearch
                    ref={searchInputRef}
                    value={batchSearchQuery}
                    onChange={setBatchSearchQuery}
                    totalCount={batches.length}
                    resultCount={optimizedBatches.length}
                    className="w-full sm:w-[300px]"
                  />
                  <Select value={batchSortOrder} onValueChange={setBatchSortOrder}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background z-50">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="volume-high">Volume (High-Low)</SelectItem>
                      <SelectItem value="volume-low">Volume (Low-High)</SelectItem>
                      <SelectItem value="progress-high">Progress (High-Low)</SelectItem>
                      <SelectItem value="progress-low">Progress (Low-High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {userRole === "production" && (
            <TabsContent value="batches" className="mt-4 sm:mt-6">
              <TabErrorBoundary tabName="All Batches">
                <Suspense fallback={<TabLoadingFallback />}>
                  <BatchesTab 
                    batches={batches}
                    onBatchClick={handleBatchClick}
                    onUpdateStage={handleUpdateStage}
                  />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="production" className="mt-4 sm:mt-6">
              <TabErrorBoundary tabName="Production">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ProductionTab 
                    batches={optimizedBatches as any}
                    selectedBatch={selectedBatch as any}
                    onSelectBatch={(batch) => setSelectedBatchId(batch.id)}
                    onUpdateStage={handleUpdateStage}
                  />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="tools" className="mt-4 sm:mt-6">
              <TabErrorBoundary tabName="Tools">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ToolsTab 
                    batches={batches}
                    blendBatches={blends || []}
                    toolView={toolView}
                  />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          )}

          {userRole === "production" && (
            <>
              <TabsContent value="blending" className="mt-4 sm:mt-6">
                <TabErrorBoundary tabName="Blending">
                  <Suspense fallback={<TabLoadingFallback />}>
                    <BlendingTab 
                      batches={batches}
                      blendBatches={blends || []}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="cellar" className="mt-4 sm:mt-6">
                <TabErrorBoundary tabName="Cellar">
                  <Suspense fallback={<TabLoadingFallback />}>
                    <CellarTab blendBatches={blends || []} />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>
            </>
          )}

          {userRole === "production" && (
            <TabsContent value="suppliers" className="mt-4 sm:mt-6">
              <TabErrorBoundary tabName="Suppliers">
                <Suspense fallback={<TabLoadingFallback />}>
                  <SuppliersTab />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          )}

          <TabsContent value="tasting" className="mt-4 sm:mt-6">
            <TabErrorBoundary tabName="Tasting">
              <Suspense fallback={<TabLoadingFallback />}>
                <TastingTab blendBatches={blends || []} />
              </Suspense>
            </TabErrorBoundary>
          </TabsContent>

          {userRole === "production" && (
            <TabsContent value="analytics" className="mt-4 sm:mt-6">
              <TabErrorBoundary tabName="Analytics">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ProductionAnalytics batches={batches} />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Lazy-load modals with Suspense - they're not needed until opened */}
      <Suspense fallback={null}>
        <BatchDetails
          batch={selectedBatch}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onUpdateStage={handleUpdateStage}
          onBatchUpdated={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
          onGoToProduction={handleGoToProduction}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <BlendBatchDetailsTabbed
          blend={selectedBlend}
          open={blendDetailsOpen}
          onOpenChange={setBlendDetailsOpen}
          onBlendUpdated={() => queryClient.invalidateQueries({ queryKey: ['blend-batches'] })}
          onAddTastingNote={(blendId) => {
            setBlendDetailsOpen(false);
            setSelectedBlendIdForTasting(blendId);
            setTastingDialogOpen(true);
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TastingAnalysisDialog
          open={tastingDialogOpen}
          onOpenChange={(open) => {
            setTastingDialogOpen(open);
            if (!open) {
              setSelectedBlendIdForTasting(null);
              setEditingTasting(null);
            }
          }}
          blendBatches={(blends || [])
            .filter(b => (b.bottles_75cl || 0) > 0 || (b.bottles_150cl || 0) > 0)
            .map(b => ({ id: b.id, name: b.name }))
          }
          existingAnalysis={editingTasting}
          onSave={handleSaveTasting}
          preSelectedBlendId={selectedBlendIdForTasting}
        />
      </Suspense>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        batchBadgeCount={batches.filter(b => b.progress < 100).length}
        userRole={userRole}
      />
      </div>
    </BaseErrorBoundary>
  );
};

export default Index;
