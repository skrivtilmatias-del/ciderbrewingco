import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { useDebounce } from "@/hooks/useDebounce";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { BatchCard } from "@/components/BatchCard";
import { NewBatchDialog } from "@/components/NewBatchDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { ProductionAnalytics } from "@/components/ProductionAnalytics";
import { StageProgressionUI } from "@/components/StageProgressionUI";
import { Apple, TrendingUp, Package, Activity, LogOut, Plus, Search, Calendar, FlaskConical, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Batch } from "@/components/BatchCard";
import { BatchLogCard, type BatchLog } from "@/components/BatchLogCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABVCalculator } from "@/components/calculators/ABVCalculator";
import { PrimingCalculator } from "@/components/calculators/PrimingCalculator";
import { SO2Calculator } from "@/components/calculators/SO2Calculator";
import { STAGES } from "@/constants/ciderStages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  
  // Debounce search query to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Monitor session timeout
  useSessionTimeout(5);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session token refreshed successfully');
      }
      
      // Handle sign out or expired sessions
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchBatches();
    }
  }, [user]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedBatches: Batch[] = data.map((batch) => ({
        id: batch.id,
        name: batch.name,
        variety: batch.variety,
        volume: parseFloat(batch.volume.toString()),
        startDate: batch.started_at,
        currentStage: batch.current_stage as Batch["currentStage"],
        progress: batch.progress,
        notes: batch.notes || undefined,
      }));

      setBatches(formattedBatches);

      // Auto-select first batch on initial load and fetch its logs
      if (!selectedBatch && formattedBatches.length > 0) {
        setSelectedBatch(formattedBatches[0]);
        fetchLogs(formattedBatches[0].id);
      }

      // If no batches, clear logs and details
      if (formattedBatches.length === 0) {
        setLogs([]);
        setSelectedBatch(null);
        setDetailsOpen(false);
      }
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from("batch_logs")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data as BatchLog[]);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
    fetchLogs(batch.id);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Delete this batch and all its logs?")) return;

    // Verify session before critical operation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please log in again');
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", batchId);

      if (error) throw error;

      setBatches(batches.filter(b => b.id !== batchId));
      if (selectedBatch?.id === batchId) {
        setSelectedBatch(batches[0] || null);
        if (batches[0]) fetchLogs(batches[0].id);
      }
      toast.success("Batch deleted");
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleAddLog = async () => {
    if (!selectedBatch) return;

    try {
      const { data, error } = await supabase
        .from("batch_logs")
        .insert([{
          batch_id: selectedBatch.id,
          user_id: user.id,
          stage: "Harvest",
          role: "General",
          title: "",
          content: "",
          tags: [],
        }])
        .select()
        .single();

      if (error) throw error;

      setLogs([data as BatchLog, ...logs]);
      toast.success("Log entry created");
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = debouncedSearchQuery === "" || 
      log.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      log.content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      log.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    
    const matchesStage = stageFilter === "All" || log.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const handleBatchCreated = async (newBatch: Omit<Batch, "id">) => {
    // Verify session before critical operation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please log in again');
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from("batches")
        .insert([
          {
            name: newBatch.name,
            variety: newBatch.variety,
            volume: newBatch.volume,
            current_stage: newBatch.currentStage,
            progress: newBatch.progress,
            notes: newBatch.notes,
            started_at: newBatch.startDate,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const formattedBatch: Batch = {
        id: data.id,
        name: data.name,
        variety: data.variety,
        volume: parseFloat(data.volume.toString()),
        startDate: data.started_at,
        currentStage: data.current_stage as Batch["currentStage"],
        progress: data.progress,
        notes: data.notes || undefined,
      };

      setBatches([formattedBatch, ...batches]);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  const handleUpdateStage = async (batchId: string, newStage: Batch["currentStage"]) => {
    // Calculate progress based on stage
    const allStages = [
      'Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes',
      'Pitching & Fermentation', 'Cold Crash', 'Racking', 'Malolactic',
      'Stabilisation/Finings', 'Blending', 'Backsweetening', 'Bottling',
      'Conditioning/Lees Aging', 'Tasting/QA', 'Complete'
    ];
    
    const stageIndex = allStages.indexOf(newStage);
    const progress = stageIndex === allStages.length - 1 
      ? 100 
      : Math.round(((stageIndex + 1) / allStages.length) * 100);

    try {
      const { error } = await supabase
        .from("batches")
        .update({
          current_stage: newStage,
          progress: progress,
          completed_at: newStage === "Complete" ? new Date().toISOString() : null,
        })
        .eq("id", batchId);

      if (error) throw error;

      setBatches(
        batches.map((batch) =>
          batch.id === batchId
            ? { ...batch, currentStage: newStage, progress: progress }
            : batch
        )
      );

      setSelectedBatch((prev) =>
        prev?.id === batchId
          ? { ...prev, currentStage: newStage, progress: progress }
          : prev
      );

      toast.success(`Batch advanced to ${newStage}`);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const activeBatches = batches.filter((b) => b.currentStage !== "Complete").length;
  const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);
  const avgProgress =
    batches.length > 0
      ? Math.round(batches.reduce((sum, b) => sum + b.progress, 0) / batches.length)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Apple className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Cider Brewing Co Notepad</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{user.email}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{selectedBatch?.name || "Select Batch"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                  <DropdownMenuLabel>Switch Batch</DropdownMenuLabel>
                  {batches.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => handleBatchSelect(b)}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => selectedBatch && handleDeleteBatch(selectedBatch.id)}>
                    Delete Current Batch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NewBatchDialog onBatchCreated={handleBatchCreated} />
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={handleSignOut} title="Sign Out">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Batches</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{activeBatches}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-info/10 rounded-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalVolume}L</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{avgProgress}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="batches" className="mb-6 sm:mb-8">
          <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="batches" className="text-xs sm:text-sm whitespace-nowrap">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              All Batches
            </TabsTrigger>
            <TabsTrigger value="stages" className="text-xs sm:text-sm whitespace-nowrap">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Stage Progress
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm whitespace-nowrap">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="calculators" className="text-xs sm:text-sm whitespace-nowrap">
              <FlaskConical className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Calculators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {batches.length === 0 ? (
                <Card className="col-span-full p-12 text-center border-dashed">
                  <p className="text-muted-foreground">
                    No batches yet. Click "New Batch" to get started.
                  </p>
                </Card>
              ) : (
                batches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onClick={() => handleBatchClick(batch)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="stages" className="mt-4 sm:mt-6">
            {selectedBatch ? (
              <StageProgressionUI
                currentStage={selectedBatch.currentStage}
                batchId={selectedBatch.id}
                batchName={selectedBatch.name}
                onAdvanceStage={handleUpdateStage}
              />
            ) : (
              <Card className="p-8 sm:p-12 text-center border-dashed">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Select a batch to view stage progression
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-[200px] text-sm">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="All">All stages</SelectItem>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage} className="text-sm">
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddLog} disabled={!selectedBatch} size="sm" className="whitespace-nowrap">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Note</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {filteredLogs.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center border-dashed">
                <p className="text-sm sm:text-base text-muted-foreground">
                  No notes yet. Click "Add Note" to get started.
                </p>
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <BatchLogCard
                  key={log.id}
                  log={log}
                  onUpdate={() => selectedBatch && fetchLogs(selectedBatch.id)}
                  onDelete={() => selectedBatch && fetchLogs(selectedBatch.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 sm:mt-6">
            {batches.length > 0 && <ProductionAnalytics batches={batches} />}
          </TabsContent>

          <TabsContent value="calculators" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <ABVCalculator />
              <PrimingCalculator />
              <SO2Calculator />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BatchDetails
        batch={selectedBatch}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdateStage={handleUpdateStage}
        onBatchUpdated={fetchBatches}
      />
    </div>
  );
};

export default Index;
