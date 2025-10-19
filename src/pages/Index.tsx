import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { useBatches } from "@/hooks/useBatches";
import { useBlends } from "@/hooks/useBlends";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from '@/stores/appStore';
import { AppHeader } from "@/components/layout/AppHeader";
import { BatchesTab } from "@/components/tabs/BatchesTab";
import { ProductionTab } from "@/components/tabs/ProductionTab";
import { BlendingTab } from "@/components/tabs/BlendingTab";
import { CellarTab } from "@/components/tabs/CellarTab";
import { SuppliersTab } from "@/components/tabs/SuppliersTab";
import { TastingTab } from "@/components/tabs/TastingTab";
import { ToolsTab } from "@/components/tabs/ToolsTab";
import { ProductionAnalytics } from "@/components/ProductionAnalytics";
import { BlendBatchDetailsTabbed } from "@/components/BlendBatchDetailsTabbed";
import { TastingAnalysisDialog } from "@/components/TastingAnalysisDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { Package, Activity, TrendingUp, Settings2, Wine, Award, Warehouse, Truck, QrCode, Layout, DollarSign, Loader2, Webhook, Download, FlaskConical, AlertCircle, RefreshCw, Search } from "lucide-react";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toolView } = useParams();
  const { user, userRole, userProfile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Use hooks for data fetching
  const { batches, isLoading: batchesLoading, error: batchesError, updateStage } = useBatches();
  const { blends, isLoading: blendsLoading, error: blendsError } = useBlends();
  
  // Use state from useAppStore
  const {
    selectedBatch,
    setSelectedBatch,
    detailsOpen,
    setDetailsOpen,
    selectedBlend,
    setSelectedBlend,
    blendDetailsOpen,
    setBlendDetailsOpen,
    batchSearchQuery,
    setBatchSearchQuery,
    batchSortOrder,
    setBatchSortOrder,
  } = useAppStore();
  
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  
  // Determine active tab from route
  const getActiveTabFromPath = (): "batches" | "production" | "blending" | "cellar" | "tasting" | "analytics" | "suppliers" | "tools" => {
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
  };
  
  const activeTab = getActiveTabFromPath();

  // Handle batch selection from QR redirect via URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId && batches.length > 0) {
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setSelectedBatch(batch);
        navigate("/production");
      }
    }
  }, [location.search, batches, navigate, setSelectedBatch]);

  // Auto-select first batch when batches are loaded
  useEffect(() => {
    if (!selectedBatch && batches.length > 0) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch, setSelectedBatch]);

  // Automatically sync selectedBatch when batches data updates
  useEffect(() => {
    if (selectedBatch) {
      const updatedBatch = batches.find(b => b.id === selectedBatch.id);
      if (updatedBatch && JSON.stringify(updatedBatch) !== JSON.stringify(selectedBatch)) {
        setSelectedBatch(updatedBatch);
      }
    }
  }, [batches, selectedBatch?.id, setSelectedBatch]);

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  const handleUpdateStage = async (batchId: string, newStage: Batch["currentStage"]) => {
    // Use the mutation from useBatches hook
    updateStage({ batchId, newStage });
  };

  const handleGoToProduction = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(false);
    navigate("/production");
  };

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

  const loading = batchesLoading || blendsLoading;
  const hasError = batchesError || blendsError;

  // Retry function
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['batches'] });
    queryClient.invalidateQueries({ queryKey: ['blend-batches'] });
  };

  // Show error state
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
                {batchesError && <p>Failed to load batches: {batchesError.message}</p>}
                {blendsError && <p>Failed to load blends: {blendsError.message}</p>}
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

  // Show loading state
  if (loading || !user) {
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
          {/* Tabs and Search/Sort Controls */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            {/* Row 1: Tabs on left, Search/Sort on right (desktop) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* Tabs */}
              <div className="overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 h-auto p-1">
                  {userRole === "production" && (
                    <>
                      <TabsTrigger value="batches" asChild>
                        <button onClick={() => navigate(paths.batches())} className="py-1.5 px-3">
                          <Package className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">All Batches</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="production" asChild>
                        <button onClick={() => navigate(paths.production())} className="py-1.5 px-3">
                          <Activity className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Production</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="blending" asChild>
                        <button onClick={() => navigate(paths.blending())} className="py-1.5 px-3">
                          <Wine className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Blending</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="cellar" asChild>
                        <button onClick={() => navigate(paths.cellar())} className="py-1.5 px-3">
                          <Warehouse className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Cellar</span>
                        </button>
                      </TabsTrigger>
                      <TabsTrigger value="suppliers" asChild>
                        <button onClick={() => navigate(paths.suppliers())} className="py-1.5 px-3">
                          <Truck className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Suppliers</span>
                        </button>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger value="tasting" asChild>
                    <button onClick={() => navigate(paths.tasting())} className="py-1.5 px-3">
                      <Award className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Tasting</span>
                    </button>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" asChild>
                    <button onClick={() => navigate(paths.analytics())} className="py-1.5 px-3">
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
                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search batches..."
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
              <BatchesTab 
                batches={batches}
                onBatchClick={handleBatchClick}
                onUpdateStage={handleUpdateStage}
              />
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="production" className="mt-4 sm:mt-6">
              <ProductionTab 
                batches={batches}
                selectedBatch={selectedBatch}
                onSelectBatch={setSelectedBatch}
                onUpdateStage={handleUpdateStage}
              />
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="tools" className="mt-4 sm:mt-6">
              <ToolsTab 
                batches={batches}
                blendBatches={blends || []}
                toolView={toolView}
              />
            </TabsContent>
          )}

          {userRole === "production" && (
            <>
              <TabsContent value="blending" className="mt-4 sm:mt-6">
                <BlendingTab 
                  batches={batches}
                  blendBatches={blends || []}
                />
              </TabsContent>

              <TabsContent value="cellar" className="mt-4 sm:mt-6">
                <CellarTab blendBatches={blends || []} />
              </TabsContent>
            </>
          )}

          {userRole === "production" && (
            <TabsContent value="suppliers" className="mt-4 sm:mt-6">
              <SuppliersTab />
            </TabsContent>
          )}

          <TabsContent value="tasting" className="mt-4 sm:mt-6">
            <TastingTab blendBatches={blends || []} />
          </TabsContent>

          {userRole === "production" && (
            <TabsContent value="analytics" className="mt-4 sm:mt-6">
              <ProductionAnalytics batches={batches} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <BatchDetails
        batch={selectedBatch}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdateStage={handleUpdateStage}
        onBatchUpdated={() => queryClient.invalidateQueries({ queryKey: ['batches'] })}
        onGoToProduction={handleGoToProduction}
      />
      
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
    </div>
  );
};

export default Index;
