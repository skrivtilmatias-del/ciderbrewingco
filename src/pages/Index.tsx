import { useState, useEffect, useCallback, useMemo, Suspense, useRef, startTransition } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { useBatches } from "@/hooks/useBatches";
import { useRealtimeBatches } from "@/hooks/useRealtimeBatches";
import { useParallelProductionData } from "@/hooks/useParallelProductionData";
import { useOptimizedBatches } from "@/hooks/useOptimizedBatches";
import type { SortOrder } from "@/hooks/useOptimizedBatches";
import { useRenderTracking } from "@/hooks/useRenderTracking";
import { useDerivedSelectedBatch } from "@/hooks/useDerivedSelectedBatch";
import { useDerivedSelectedBlend } from "@/hooks/useDerivedSelectedBlend";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchBlendData, prefetchAnalyticsData, prefetchSupplierData, prefetchAdjacentBatches } from "@/lib/prefetchUtils";
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTouchFriendlyPrefetch } from "@/hooks/useTouchFriendlyPrefetch";
import { AppHeader } from "@/components/layout/AppHeader";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { TabLoadingFallback } from "@/components/ui/TabLoadingFallback";
import { preloadComponent } from "@/lib/lazyPreload";
import { BaseErrorBoundary, TabErrorBoundary } from "@/components/errors";

// ============= Code-Split Tab Components =============
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
  
  // Still use individual hooks for mutations
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
  
  // Derive selected batch and blend from React Query cache
  const selectedBatch = useDerivedSelectedBatch();
  const selectedBlend = useDerivedSelectedBlend();
  
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep a ref to the current batches array to avoid stale closures
  const batchesRef = useRef(batches);
  batchesRef.current = batches;

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

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
    onNewBatch: () => {
      const event = new CustomEvent('openNewBatch');
      window.dispatchEvent(event);
    },
    onFocusSearch: () => {
      const tabsWithSearch = ['batches', 'production', 'blending'];
      if (!tabsWithSearch.includes(activeTab)) {
        toast.info('Search is available on Batches, Production, and Blending tabs');
        return;
      }
      
      // Use setTimeout to ensure the search input is rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select(); // Also select text for better UX
        }
      }, 0);
    },
  });

  // Show keyboard shortcuts hint only once
  useEffect(() => {
    if (!user) return;
    
    const hasSeenShortcutsHint = localStorage.getItem('hasSeenShortcutsHint');
    if (!hasSeenShortcutsHint) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          toast.info('Press ? to view keyboard shortcuts', {
            duration: 5000,
          });
          localStorage.setItem('hasSeenShortcutsHint', 'true');
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  // Use optimized batches hook
  const { sorted: optimizedBatches } = useOptimizedBatches({
    batches,
    searchQuery: batchSearchQuery,
    filters: batchFilters,
    sortOrder: batchSortOrder,
  });

  // Handle batch selection from QR redirect
  useEffect(() => {
    if (batches.length === 0) return;
    
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId) {
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setSelectedBatchId(batch.id);
        navigate("/production", { replace: true });
      } else {
        toast.error(`Batch ${batchId} not found`);
        navigate("/batches", { replace: true });
      }
    }
  }, [location.search, batches, setSelectedBatchId, navigate]);

  // Auto-select first batch on initial load with improved logic
  useEffect(() => {
    // Skip if loading or no batches
    if (isLoading || batches.length === 0) {
      if (selectedBatchId && batches.length === 0) {
        setSelectedBatchId(null);
      }
      return;
    }
    
    // If we have a selected batch, verify it still exists
    if (selectedBatchId) {
      const batchExists = batches.some(b => b.id === selectedBatchId);
      if (!batchExists) {
        // Selected batch was deleted - select first batch if available
        if (batches.length > 0) {
          setSelectedBatchId(batches[0].id);
        } else {
          setSelectedBatchId(null);
        }
      }
      return;
    }
    
    // No selection and we have batches - select first one
    if (batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId, setSelectedBatchId, isLoading]);

  // Memoize event handlers
  const handleBatchClick = useCallback((batch: Batch | null | undefined) => {
    if (!batch?.id) {
      console.error('handleBatchClick: Invalid batch', batch);
      return;
    }
    
    // Verify batch exists
    const batchExists = batchesRef.current.some(b => b.id === batch.id);
    if (!batchExists) {
      console.warn('handleBatchClick: Batch not found', batch.id);
      toast.error('This batch is no longer available');
      return;
    }
    
    setSelectedBatchId(batch.id);
    setDetailsOpen(true);
    
    // Prefetch adjacent batches
    const currentIndex = batchesRef.current.findIndex(b => b.id === batch.id);
    if (currentIndex >= 0 && isMountedRef.current) {
      prefetchAdjacentBatches(queryClient, batchesRef.current, currentIndex, 3).catch(() => {
        // Silent fail
      });
    }
  }, [queryClient, setSelectedBatchId, setDetailsOpen]);

  const handleUpdateStage = useCallback(async (batchId: string, newStage: Batch["currentStage"]) => {
    try {
      await updateStage({ batchId, newStage });
    } catch (error) {
      console.error('Failed to update stage:', error);
      toast.error('Failed to update batch stage');
    }
  }, [updateStage]);

  const handleGoToProduction = useCallback((batch: Batch) => {
    if (!batch?.id) return;
    
    // Verify batch exists in current batches array
    const batchExists = batchesRef.current.some(b => b.id === batch.id);
    if (!batchExists) {
      toast.error('This batch is no longer available');
      return;
    }
    
    setSelectedBatchId(batch.id);
    setDetailsOpen(false);
    navigate("/production");
    
    // Prefetch adjacent batches
    const currentIndex = batchesRef.current.findIndex(b => b.id === batch.id);
    if (currentIndex >= 0 && isMountedRef.current) {
      prefetchAdjacentBatches(queryClient, batchesRef.current, currentIndex, 3).catch(() => {
        // Silent fail
      });
    }
  }, [navigate, queryClient, setSelectedBatchId, setDetailsOpen]);

  // Touch-friendly prefetch hooks
  const blendingTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      Promise.all([
        prefetchBlendData(queryClient),
        preloadComponent(BlendingTab)
      ]).catch(() => {});
    }, [queryClient])
  );

  const analyticsTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      Promise.all([
        prefetchAnalyticsData(queryClient),
        preloadComponent(ProductionAnalytics)
      ]).catch(() => {});
    }, [queryClient])
  );

  const suppliersTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      Promise.all([
        prefetchSupplierData(queryClient),
        preloadComponent(SuppliersTab)
      ]).catch(() => {});
    }, [queryClient])
  );

  const productionTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      preloadComponent(ProductionTab).catch(() => {});
    }, [])
  );

  const batchesTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      preloadComponent(BatchesTab).catch(() => {});
    }, [])
  );

  const tastingTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      preloadComponent(TastingTab).catch(() => {});
    }, [])
  );

  const toolsTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      preloadComponent(ToolsTab).catch(() => {});
    }, [])
  );

  const cellarTabPrefetch = useTouchFriendlyPrefetch(
    useCallback(() => {
      if (!isMountedRef.current) return;
      preloadComponent(CellarTab).catch(() => {});
    }, [])
  );

  const handleSaveTasting = useCallback(async (data: any, analysisId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Session expired. Please log in again");
      navigate("/auth");
      return;
    }

    try {
      const tastingData = {
        blend_batch_id: data.blend_batch_id || null,
        competitor_brand: data.competitor_brand || null,
        taste: data.taste || null,
        colour: data.colour || null,
        palate: data.palate || null,
        overall_score: data.overall_score || null,
        notes: data.notes || null,
        attachments: data.attachments || null,
      };

      if (analysisId) {
        const { error } = await supabase
          .from("tasting_analysis")
          .update(tastingData)
          .eq("id", analysisId);

        if (error) throw error;
        toast.success("Tasting analysis updated");
      } else {
        const { error } = await supabase
          .from("tasting_analysis")
          .insert([{
            user_id: user!.id,
            ...tastingData
          }]);

        if (error) throw error;
        toast.success("Tasting analysis created");
      }
      
      // Invalidate tasting queries
      queryClient.invalidateQueries({ queryKey: ['tasting-analysis'] });
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  }, [user, navigate, queryClient]);

  const handleRetry = useCallback(() => {
    retryParallelData();
  }, [retryParallelData]);

  // Error state with improved UX
  if (hasError && !isLoading) {
    const failedResources = Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([name]) => name);
    
    const hasAnyData = batches.length > 0 || blends.length > 0;
    
    const affectedFeatures = {
      batches: ['All Batches tab', 'Production tracking', 'Batch details'],
      blends: ['Blending tab', 'Cellar management', 'Tasting notes'],
      suppliers: ['Supplier management', 'Cost calculations']
    };
    
    const limitedFeatures = failedResources
      .flatMap(resource => affectedFeatures[resource as keyof typeof affectedFeatures] || []);
    
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <h1 className="text-xl font-bold">CiderTracker</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription className="space-y-4">
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
          
          {hasAnyData && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Showing available data for: {[
                  batches.length > 0 && `${batches.length} Batches`,
                  blends.length > 0 && `${blends.length} Blends`,
                  suppliers.length > 0 && `${suppliers.length} Suppliers`
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Loading state with improved visual feedback
  if (isLoading || authLoading || !user) {
    const hasPartialData = batches.length > 0 || blends.length > 0;
    
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-6">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Production Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(loadingStates).map(([key, loading]) => {
                  const counts = {
                    batches: batches.length,
                    blends: blends.length,
                    suppliers: suppliers.length
                  };
                  const count = counts[key as keyof typeof counts];
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key}</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : count > 0 ? (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <span>✓</span>
                          <span className="text-muted-foreground">({count})</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {!hasPartialData && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
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
          onBatchCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            const event = new CustomEvent('batchCreated');
            window.dispatchEvent(event);
          }}
          onTastingSaved={handleSaveTasting}
          blendBatches={blends}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 md:pb-6">
          <Tabs value={activeTab} className="mb-6 sm:mb-8">
            {/* Tabs and Search/Sort Controls */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                {/* Desktop Tabs */}
                <div className="hidden md:block overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0">
                  <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 h-auto p-1">
                    {userRole === "production" && (
                      <>
                        <TabsTrigger value="batches" asChild>
                          <button 
                            ref={batchesTabPrefetch.ref as any}
                            onClick={() => startTransition(() => navigate(paths.batches()))} 
                            onMouseEnter={batchesTabPrefetch.onMouseEnter}
                            className="py-1.5 px-3 transition-colors"
                            aria-label={`All Batches (${batches.length})`}
                          >
                            <Package className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">All Batches</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="production" asChild>
                          <button 
                            ref={productionTabPrefetch.ref as any}
                            onClick={() => startTransition(() => navigate(paths.production()))} 
                            onMouseEnter={productionTabPrefetch.onMouseEnter}
                            className="py-1.5 px-3 transition-colors"
                          >
                            <Activity className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Production</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="blending" asChild>
                          <button 
                            ref={blendingTabPrefetch.ref as any}
                            onClick={() => startTransition(() => navigate(paths.blending()))} 
                            onMouseEnter={blendingTabPrefetch.onMouseEnter}
                            className="py-1.5 px-3 transition-colors"
                          >
                            <Wine className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Blending</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="cellar" asChild>
                          <button 
                            ref={cellarTabPrefetch.ref as any}
                            onClick={() => startTransition(() => navigate(paths.cellar()))} 
                            onMouseEnter={cellarTabPrefetch.onMouseEnter}
                            className="py-1.5 px-3 transition-colors"
                          >
                            <Warehouse className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Cellar</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="suppliers" asChild>
                          <button 
                            ref={suppliersTabPrefetch.ref as any}
                            onClick={() => startTransition(() => navigate(paths.suppliers()))} 
                            onMouseEnter={suppliersTabPrefetch.onMouseEnter}
                            className="py-1.5 px-3 transition-colors"
                          >
                            <Truck className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Suppliers</span>
                          </button>
                        </TabsTrigger>
                      </>
                    )}
                    <TabsTrigger value="tasting" asChild>
                      <button 
                        ref={tastingTabPrefetch.ref as any}
                        onClick={() => startTransition(() => navigate(paths.tasting()))} 
                        onMouseEnter={tastingTabPrefetch.onMouseEnter}
                        className="py-1.5 px-3 transition-colors"
                      >
                        <Award className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Tasting</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" asChild>
                      <button 
                        ref={analyticsTabPrefetch.ref as any}
                        onClick={() => startTransition(() => navigate(paths.analytics()))} 
                        onMouseEnter={analyticsTabPrefetch.onMouseEnter}
                        className="py-1.5 px-3 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Analytics</span>
                      </button>
                    </TabsTrigger>
                    {userRole === "production" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            ref={toolsTabPrefetch.ref as any}
                            onMouseEnter={toolsTabPrefetch.onMouseEnter}
                            variant={activeTab === "tools" ? "default" : "ghost"} 
                            size="sm" 
                            className="inline-flex items-center justify-center text-xs sm:text-sm whitespace-nowrap py-1.5 px-3 h-9 leading-tight"
                          >
                            <Settings2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Tools</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Tools</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.calculators()))}>
                            <FlaskConical className="h-4 w-4 mr-2" />
                            Calculators
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.printLabels()))}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Print Labels
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.floorPlan()))}>
                            <Layout className="h-4 w-4 mr-2" />
                            Floor Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.costCalculation()))}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cost Calculation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.planning()))}>
                            <Settings2 className="h-4 w-4 mr-2" />
                            Economic Planning
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startTransition(() => navigate(paths.tools.webhooks()))}>
                            <Webhook className="h-4 w-4 mr-2" />
                            Webhooks
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TabsList>
                </div>

                {/* Search and Sort - Desktop */}
                {(activeTab === "batches" || activeTab === "production" || activeTab === "blending") && (
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <BatchSearch
                      ref={searchInputRef}
                      value={batchSearchQuery}
                      onChange={(v) => startTransition(() => setBatchSearchQuery(v))}
                      totalCount={batches.length}
                      resultCount={optimizedBatches.length}
                      className="w-64"
                    />
                    <Select
                      value={batchSortOrder}
                      onValueChange={(value) => startTransition(() => setBatchSortOrder(value as SortOrder))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                        <SelectItem value="volume-high">Volume high-low</SelectItem>
                        <SelectItem value="volume-low">Volume low-high</SelectItem>
                        <SelectItem value="progress-high">Progress high-low</SelectItem>
                        <SelectItem value="progress-low">Progress low-high</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Mobile Search */}
              {(activeTab === "batches" || activeTab === "production" || activeTab === "blending") && (
                <div className="md:hidden">
                  <BatchSearch
                    ref={searchInputRef}
                    value={batchSearchQuery}
                    onChange={(v) => startTransition(() => setBatchSearchQuery(v))}
                    totalCount={batches.length}
                    resultCount={optimizedBatches.length}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Tab Content */}
            <TabsContent value="batches" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <BatchesTab
                  batches={optimizedBatches}
                  onBatchClick={handleBatchClick}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="production" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ProductionTab
                  batches={batches}
                  selectedBatch={selectedBatch}
                  onSelectBatch={handleBatchClick}
                  onUpdateStage={handleUpdateStage}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="blending" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <BlendingTab 
                  batches={batches as any}
                  blendBatches={blends}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="cellar" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <CellarTab blendBatches={blends} />
              </Suspense>
            </TabsContent>

            <TabsContent value="suppliers" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <SuppliersTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="tasting" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <TastingTab blendBatches={blends} />
              </Suspense>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ProductionAnalytics batches={batches} />
              </Suspense>
            </TabsContent>

            <TabsContent value="tools" className="mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ToolsTab 
                  batches={batches}
                  blendBatches={blends}
                  toolView={toolView as any} 
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>

        <BottomNav userRole={userRole} />

        {selectedBatch && (
          <BatchDetails
            batch={selectedBatch}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            onGoToProduction={handleGoToProduction}
            onUpdateStage={handleUpdateStage}
          />
        )}

        {selectedBlend && (
          <BlendBatchDetailsTabbed
            blend={selectedBlend}
            open={blendDetailsOpen}
            onOpenChange={setBlendDetailsOpen}
            onBlendUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['blends'] });
            }}
          />
        )}

        <TastingAnalysisDialog
          open={tastingDialogOpen}
          onOpenChange={setTastingDialogOpen}
          onSave={handleSaveTasting}
          blendBatches={blends}
          preSelectedBlendId={selectedBlendIdForTasting || undefined}
        />
      </div>
    </BaseErrorBoundary>
  );
};

export default Index;