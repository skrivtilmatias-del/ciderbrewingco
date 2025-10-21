import { useState, useEffect, useMemo, lazy, Suspense, startTransition } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ErrorBoundary } from 'react-error-boundary';
import { useDebouncedCallback } from 'use-debounce';
import { useHotkeys } from 'react-hotkeys-hook';
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { useBatches } from "@/hooks/useBatches";
import { useBlends } from "@/hooks/useBlends";
import { useTastingAnalysis } from "@/hooks/useTastingAnalysis";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from '@/stores/appStore';
import { AppHeader } from "@/components/layout/AppHeader";
import { 
  Package, Activity, TrendingUp, Settings2, Wine, Award, 
  Warehouse, Truck, QrCode, Layout, DollarSign, Loader2, 
  Webhook, Download, FlaskConical, AlertCircle, RefreshCw, Search 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import type { Batch } from "@/components/BatchCard";

// ✅ Lazy load heavy components
const BatchesTab = lazy(() => import('@/components/tabs/BatchesTab').then(m => ({ default: m.BatchesTab })));
const ProductionTab = lazy(() => import('@/components/tabs/ProductionTab').then(m => ({ default: m.ProductionTab })));
const BlendingTab = lazy(() => import('@/components/tabs/BlendingTab').then(m => ({ default: m.BlendingTab })));
const CellarTab = lazy(() => import('@/components/tabs/CellarTab').then(m => ({ default: m.CellarTab })));
const SuppliersTab = lazy(() => import('@/components/tabs/SuppliersTab').then(m => ({ default: m.SuppliersTab })));
const TastingTab = lazy(() => import('@/components/tabs/TastingTab').then(m => ({ default: m.TastingTab })));
const ToolsTabLazy = lazy(() => import('@/components/tabs/ToolsTab').then(m => ({ default: m.ToolsTab })));
const ProductionAnalytics = lazy(() => import('@/components/ProductionAnalytics').then(m => ({ default: m.ProductionAnalytics })));
const BlendBatchDetailsTabbed = lazy(() => import('@/components/BlendBatchDetailsTabbed').then(m => ({ default: m.BlendBatchDetailsTabbed })));
const TastingAnalysisDialog = lazy(() => import('@/components/TastingAnalysisDialog').then(m => ({ default: m.TastingAnalysisDialog })));
const BatchDetails = lazy(() => import('@/components/BatchDetails').then(m => ({ default: m.BatchDetails })));

// ✅ Loading skeleton component
const TabLoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Card key={i} className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    ))}
  </div>
);

// ✅ Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="max-w-md w-full">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>Something went wrong</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error?.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go home
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toolView } = useParams();
  const { user, userRole, userProfile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const { batches, isLoading: batchesLoading, error: batchesError, updateStage } = useBatches();
  const { blends, isLoading: blendsLoading, error: blendsError } = useBlends();
  const { analyses: tastingAnalyses } = useTastingAnalysis();
  
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
  
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  
  // ✅ Derive selected batch from ID (no sync useEffect needed!)
  const selectedBatch = useMemo(() => {
    return selectedBatchId ? batches.find(b => b.id === selectedBatchId) : null;
  }, [batches, selectedBatchId]);
  
  // ✅ Derive selected blend from ID
  const selectedBlend = useMemo(() => {
    return selectedBlendId ? blends?.find(b => b.id === selectedBlendId) : null;
  }, [blends, selectedBlendId]);
  
  // ✅ Memoize active tab
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

  // ✅ Memoize filtered and sorted batches
  const filteredBatches = useMemo(() => {
    let result = batches;
    
    if (batchSearchQuery.trim()) {
      const query = batchSearchQuery.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.variety.toLowerCase().includes(query) ||
        b.apple_origin?.toLowerCase().includes(query)
      );
    }
    
    switch (batchSortOrder) {
      case 'newest':
        return [...result].sort((a, b) => 
          new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
        );
      case 'oldest':
        return [...result].sort((a, b) => 
          new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime()
        );
      case 'name-asc':
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...result].sort((a, b) => b.name.localeCompare(a.name));
      case 'volume-high':
        return [...result].sort((a, b) => b.volume - a.volume);
      case 'volume-low':
        return [...result].sort((a, b) => a.volume - b.volume);
      case 'progress-high':
        return [...result].sort((a, b) => (b.progress || 0) - (a.progress || 0));
      case 'progress-low':
        return [...result].sort((a, b) => (a.progress || 0) - (b.progress || 0));
      default:
        return result;
    }
  }, [batches, batchSearchQuery, batchSortOrder]);

  // ✅ Handle QR redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId && batches.length > 0) {
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setSelectedBatchId(batch.id);
        navigate("/production", { replace: true });
      }
    }
  }, [location.search, batches, navigate, setSelectedBatchId]);

  // ✅ Auto-select first batch
  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches.length, selectedBatchId, setSelectedBatchId]);

  // ✅ Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      startTransition(() => {
        setBatchSearchQuery(value);
      });
    },
    300
  );

  // ✅ Keyboard shortcuts
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
  });
  useHotkeys('ctrl+b, cmd+b', () => navigate(paths.batches()));
  useHotkeys('ctrl+p, cmd+p', (e) => {
    e.preventDefault();
    navigate(paths.production());
  });

  // ✅ Optimized handlers with transitions
  const handleBatchClick = (batch: Batch) => {
    startTransition(() => {
      setSelectedBatchId(batch.id);
      setDetailsOpen(true);
    });
  };

  const handleUpdateStage = async (batchId: string, newStage: Batch["currentStage"]) => {
    // Optimistic update
    const previousBatches = queryClient.getQueryData(['batches']);
    
    queryClient.setQueryData(['batches'], (old: Batch[] | undefined) =>
      old?.map(b => b.id === batchId ? { ...b, currentStage: newStage } : b)
    );
    
    try {
      await updateStage({ batchId, newStage });
    } catch (error) {
      queryClient.setQueryData(['batches'], previousBatches);
      toast.error('Failed to update stage');
    }
  };

  const handleGoToProduction = (batch: Batch) => {
    startTransition(() => {
      setSelectedBatchId(batch.id);
      setDetailsOpen(false);
      navigate("/production");
    });
  };

  const handleSaveTasting = async (data: any, analysisId?: string) => {
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
          .insert([{ user_id: user!.id, ...tastingData }]);

        if (error) throw error;
        toast.success("Tasting analysis created");
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasting-analysis'] });
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const loading = batchesLoading || blendsLoading;
  const hasError = batchesError || blendsError;

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['batches'] });
    queryClient.invalidateQueries({ queryKey: ['blend-batches'] });
  };

  // ✅ Error state
  if (hasError && !loading) {
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
                {batchesError && <p>Batches: {getUserFriendlyError(batchesError)}</p>}
                {blendsError && <p>Blends: {getUserFriendlyError(blendsError)}</p>}
              </div>
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // ✅ Loading state
  if (loading || authLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <TabLoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleRetry}>
      <div className="min-h-dvh bg-background overflow-x-hidden">
        <AppHeader 
          user={user}
          userProfile={userProfile}
          userRole={userRole}
          onBatchCreated={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
          onTastingSaved={handleSaveTasting}
          blendBatches={blends}
        />

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Tabs value={activeTab} className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0">
                  <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 h-auto p-1">
                    {userRole === "production" && (
                      <>
                        <TabsTrigger value="batches" asChild>
                          <button onClick={() => startTransition(() => navigate(paths.batches()))} className="py-1.5 px-3">
                            <Package className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">All Batches</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="production" asChild>
                          <button onClick={() => startTransition(() => navigate(paths.production()))} className="py-1.5 px-3">
                            <Activity className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Production</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="blending" asChild>
                          <button onClick={() => startTransition(() => navigate(paths.blending()))} className="py-1.5 px-3">
                            <Wine className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Blending</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="cellar" asChild>
                          <button onClick={() => startTransition(() => navigate(paths.cellar()))} className="py-1.5 px-3">
                            <Warehouse className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Cellar</span>
                          </button>
                        </TabsTrigger>
                        <TabsTrigger value="suppliers" asChild>
                          <button onClick={() => startTransition(() => navigate(paths.suppliers()))} className="py-1.5 px-3">
                            <Truck className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Suppliers</span>
                          </button>
                        </TabsTrigger>
                      </>
                    )}
                    <TabsTrigger value="tasting" asChild>
                      <button onClick={() => startTransition(() => navigate(paths.tasting()))} className="py-1.5 px-3">
                        <Award className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Tasting</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" asChild>
                      <button onClick={() => startTransition(() => navigate(paths.analytics()))} className="py-1.5 px-3">
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
                            className="inline-flex items-center justify-center text-xs sm:text-sm whitespace-nowrap py-1.5 px-3 h-9"
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
                            Cost Management
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

                {(activeTab === "batches" || activeTab === "production" || activeTab === "blending") && userRole === "production" && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                    <div className="relative w-full sm:w-[220px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search batches..."
                        defaultValue={batchSearchQuery}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select 
                      value={batchSortOrder} 
                      onValueChange={(v) => startTransition(() => setBatchSortOrder(v))}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
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
              <>
                <TabsContent value="batches">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    {filteredBatches.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No batches found</h3>
                        <p className="text-muted-foreground mb-4">
                          {batchSearchQuery 
                            ? `No results for "${batchSearchQuery}"`
                            : "Create your first batch to get started"
                          }
                        </p>
                        {batchSearchQuery && (
                          <Button variant="outline" onClick={() => setBatchSearchQuery('')}>
                            Clear search
                          </Button>
                        )}
                      </Card>
                    ) : (
                      <BatchesTab 
                        batches={filteredBatches}
                        onBatchClick={handleBatchClick}
                        onUpdateStage={handleUpdateStage}
                      />
                    )}
                  </Suspense>
                </TabsContent>

                <TabsContent value="production">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <ProductionTab 
                      batches={filteredBatches}
                      selectedBatch={selectedBatch}
                      onSelectBatch={(batch) => setSelectedBatchId(batch?.id || null)}
                      onUpdateStage={handleUpdateStage}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="blending">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <BlendingTab 
                      batches={batches}
                      blendBatches={blends || []}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="cellar">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <CellarTab blendBatches={blends || []} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="suppliers">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <SuppliersTab />
                  </Suspense>
                </TabsContent>

                <TabsContent value="tools">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <ToolsTabLazy 
                      batches={batches}
                      blendBatches={blends || []}
                      toolView={toolView}
                    />
                  </Suspense>
                </TabsContent>
              </>
            )}

            <TabsContent value="tasting">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <TastingTab blendBatches={blends || []} />
              </Suspense>
            </TabsContent>

            {userRole === "production" && (
              <TabsContent value="analytics">
                <Suspense fallback={<TabLoadingSkeleton />}>
                  <ProductionAnalytics 
                    batches={batches} 
                    blendBatches={blends || []}
                    tastingAnalyses={tastingAnalyses || []}
                  />
                </Suspense>
              </TabsContent>
            )}
          </Tabs>
        </main>

        <Suspense fallback={null}>
          {selectedBatch && (
            <BatchDetails
              batch={selectedBatch}
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              onUpdateStage={handleUpdateStage}
              onBatchUpdated={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
              onGoToProduction={handleGoToProduction}
            />
          )}
        </Suspense>
        
        <Suspense fallback={null}>
          {selectedBlend && (
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
          )}
        </Suspense>

        <Suspense fallback={null}>
          <TastingAnalysisDialog
            open={tastingDialogOpen}
            onOpenChange={(open) => {
              setTastingDialogOpen(open);
              if (!open) {
                setSelectedBlendIdForTasting(null);
              }
            }}
            blendBatches={(blends || [])
              .filter(b => (b.bottles_75cl || 0) > 0 || (b.bottles_150cl || 0) > 0)
              .map(b => ({ id: b.id, name: b.name }))
            }
            onSave={handleSaveTasting}
            preSelectedBlendId={selectedBlendIdForTasting}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
