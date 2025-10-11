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
    const stageProgress = {
      pressing: 20,
      fermentation: 45,
      aging: 75,
      bottling: 90,
      complete: 100,
    };

    try {
      const { error } = await supabase
        .from("batches")
        .update({
          current_stage: newStage,
          progress: stageProgress[newStage],
          completed_at: newStage === "complete" ? new Date().toISOString() : null,
        })
        .eq("id", batchId);

      if (error) throw error;

      setBatches(
        batches.map((batch) =>
          batch.id === batchId
            ? { ...batch, currentStage: newStage, progress: stageProgress[newStage] }
            : batch
        )
      );

      setSelectedBatch((prev) =>
        prev?.id === batchId
          ? { ...prev, currentStage: newStage, progress: stageProgress[newStage] }
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

  const activeBatches = batches.filter((b) => b.currentStage !== "complete").length;
  const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);
  const avgProgress =
    batches.length > 0
      ? Math.round(batches.reduce((sum, b) => sum + b.progress, 0) / batches.length)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Apple className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Cider Brewing Co Notepad</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="w-4 h-4 mr-2" />
                    {selectedBatch?.name || "Select Batch"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
              <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Batches</p>
                <p className="text-3xl font-bold text-foreground">{activeBatches}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <Package className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-3xl font-bold text-foreground">{totalVolume}L</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Progress</p>
                <p className="text-3xl font-bold text-foreground">{avgProgress}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="mb-8">
          <TabsList>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="calculators">
              <FlaskConical className="h-4 w-4 mr-2" />
              Calculators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All stages</SelectItem>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddLog} disabled={!selectedBatch}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>

            {filteredLogs.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <p className="text-muted-foreground">
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

          <TabsContent value="analytics">
            {batches.length > 0 && <ProductionAnalytics batches={batches} />}
          </TabsContent>

          <TabsContent value="calculators">
            <div className="grid md:grid-cols-3 gap-6">
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
      />
    </div>
  );
};

export default Index;
