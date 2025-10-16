import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { useBatches } from "@/hooks/useBatches";
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
import { Package, Activity, TrendingUp, Settings2, Wine, Award, Warehouse, QrCode, Layout, DollarSign, Loader2, Webhook, Download, FlaskConical, AlertCircle, RefreshCw } from "lucide-react";
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
  } = useAppStore();
  
  // Derive selected batch and blend from React Query cache (single source of truth)
  const selectedBatch = useDerivedSelectedBatch();
  const selectedBlend = useDerivedSelectedBlend();
  
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
    onNewBatch: () => {
      // TODO: Open new batch dialog
      console.log('Open new batch dialog');
    },
    onFocusSearch: () => {
      // Focus search input if it exists
      searchInputRef.current?.focus();
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

  // Use optimized batches hook with proper memoization
  const batchFilters = useMemo(() => ({
    stages: [],
    dateRange: {},
    volumeRange: [0, 10000] as [number, number],
    status: 'all' as const,
    variety: '',
    alcoholRange: [0, 12] as [number, number],
  }), []);

  // This hook memoizes all expensive computations
  const { sorted: optimizedBatches, groupedByStage } = useOptimizedBatches({
    batches,
    searchQuery: batchSearchQuery,
    filters: batchFilters,
    sortOrder: batchSortOrder as any,
  });

  // Handle batch selection from QR redirect via URL params
  const qrRedirectHandled = useRef(false);
  useEffect(() => {
    if (qrRedirectHandled.current) return;
    
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId && batches.length > 0) {
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setSelectedBatchId(batch.id);
        setTimeout(() => {
          navigate("/production", { replace: true });
          qrRedirectHandled.current = true;
        }, 100);
      } else {
        toast.error(`Batch ${batchId} not found`);
        navigate("/batches", { replace: true });
      }
    }
  }, [location.search, batches.length, navigate, setSelectedBatchId]);

  // Track if initial batch selection has been made
  const hasInitializedSelection = useRef(false);
  
  // Auto-select first batch on initial load and handle edge cases
  useEffect(() => {
    // No batches available - clear selection
    if (batches.length === 0) {
      if (selectedBatchId) {
        setSelectedBatchId(null);
      }
      hasInitializedSelection.current = false;
      return;
    }
    
    // If we have a selected batch, verify it still exists
    if (selectedBatchId) {
      const batchStillExists = batches.some(b => b.id === selectedBatchId);
      if (!batchStillExists) {
        // Selected batch was deleted - select first batch
        setSelectedBatchId(batches[0].id);
        hasInitializedSelection.current = true;
      }
      return;
    }
    
    // No selection and haven't initialized yet - select first batch
    if (!hasInitializedSelection.current) {
      setSelectedBatchId(batches[0].id);
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
    const batchExists = batches.some(b => b.id === batch.id);
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
    const currentIndex = batches.findIndex(b => b.id === batch.id);
    if (currentIndex >= 0) {
      prefetchAdjacentBatches(queryClient, batches, currentIndex, 3).catch(() => {
        // Silently fail - prefetch is optional optimization
      });
    }
  }, [batches, queryClient, setSelectedBatchId, setDetailsOpen]);

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
   */
  const handleBlendingTabHover = useCallback(() => {
    // Prefetch both data and component code
    prefetchBlendData(queryClient).catch(() => {
      // Silently fail - prefetch is optional
    });
    preloadComponent(BlendingTab).catch(() => {
      // Silently fail
    });
  }, [queryClient]);

  const handleAnalyticsTabHover = useCallback(() => {
    // Prefetch both data and component code
    prefetchAnalyticsData(queryClient).catch(() => {
      // Silently fail
    });
    preloadComponent(ProductionAnalytics).catch(() => {
      // Silently fail
    });
  }, [queryClient]);

  const handleSuppliersTabHover = useCallback(() => {
    // Prefetch both data and component code
    prefetchSupplierData(queryClient).catch(() => {
      // Silently fail
    });
    preloadComponent(SuppliersTab).catch(() => {
      // Silently fail
    });
  }, [queryClient]);

  const handleProductionTabHover = useCallback(() => {
    preloadComponent(ProductionTab).catch(() => {
      // Silently fail
    });
  }, []);

  const handleBatchesTabHover = useCallback(() => {
    preloadComponent(BatchesTab).catch(() => {
      // Silently fail
    });
  }, []);

  const handleTastingTabHover = useCallback(() => {
    preloadComponent(TastingTab).catch(() => {
      // Silently fail
    });
  }, []);

  const handleToolsTabHover = useCallback(() => {
    preloadComponent(ToolsTab).catch(() => {
      // Silently fail
    });
  }, []);

  const handleCellarTabHover = useCallback(() => {
    preloadComponent(CellarTab).catch(() => {
      // Silently fail
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
    // Check which specific queries failed
    const failedQueries = Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([name]) => name);
    
    const hasAnyData = batches.length > 0 || blends.length > 0;
    
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
              <div>
                {errors.batches && <p>Failed to load batches: {errors.batches.message}</p>}
                {errors.blends && <p>Failed to load blends: {errors.blends.message}</p>}
                {errors.suppliers && <p>Failed to load suppliers: {errors.suppliers.message}</p>}
              </div>
              {hasAnyData && (
                <p className="text-sm text-muted-foreground">
                  Some data loaded successfully. You can continue using the app with limited functionality.
                </p>
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
                  blends.length > 0 && 'Blends'
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show loading state - only show skeleton if ALL queries are loading
  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
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
                          <TrendingUp className="h-4 w-4 sm:mr-2" />
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
                    batches={optimizedBatches}
                    selectedBatch={selectedBatch}
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
