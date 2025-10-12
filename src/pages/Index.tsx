import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { useDebounce } from "@/hooks/useDebounce";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { BatchCard } from "@/components/BatchCard";
import { NewBatchDialog } from "@/components/NewBatchDialog";
import { NewBlendDialog } from "@/components/NewBlendDialog";
import { BlendBatchCard } from "@/components/BlendBatchCard";
import { BlendBatchDetails } from "@/components/BlendBatchDetails";
import { TastingAnalysisCard } from "@/components/TastingAnalysisCard";
import { TastingAnalysisDialog } from "@/components/TastingAnalysisDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { BatchOverviewHeader } from "@/components/BatchOverviewHeader";
import { BatchTimeline } from "@/components/BatchTimeline";
import { ParameterTrendChart } from "@/components/ParameterTrendChart";
import { QuickActionsPanel } from "@/components/QuickActionsPanel";
import { SmartInsights } from "@/components/SmartInsights";
import { OrganizedLogsList } from "@/components/OrganizedLogsList";
import { ProductionAnalytics } from "@/components/ProductionAnalytics";
import { StageProgressionUI } from "@/components/StageProgressionUI";
import { PrintQRCodes } from "@/components/PrintQRCodes";
import { Apple, TrendingUp, Package, Activity, LogOut, Plus, Search, Calendar, FlaskConical, Settings2, Wine, Award, Warehouse, QrCode } from "lucide-react";
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [blendBatches, setBlendBatches] = useState<any[]>([]);
  const [selectedBlend, setSelectedBlend] = useState<any>(null);
  const [blendDetailsOpen, setBlendDetailsOpen] = useState(false);
  const [tastingAnalyses, setTastingAnalyses] = useState<any[]>([]);
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  
  // Get allowed stages based on current batch stage
  const getAllowedStages = (currentStage: string): string[] => {
    const stageMapping: Record<string, string[]> = {
      'Harvest': ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'],
      'Sorting & Washing': ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'],
      'Milling': ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'],
      'Pressing': ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'],
      'Settling/Enzymes': ['Harvest', 'Sorting & Washing', 'Milling', 'Pressing', 'Settling/Enzymes'],
      'Pitching & Fermentation': ['Pitching & Fermentation', 'Cold Crash'],
      'Cold Crash': ['Pitching & Fermentation', 'Cold Crash'],
      'Malolactic': ['Malolactic', 'Stabilisation/Finings'],
      'Stabilisation/Finings': ['Malolactic', 'Stabilisation/Finings'],
      'Blending': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
      'Racking': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
      'Backsweetening': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
      'Bottling': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
      'Conditioning/Lees Aging': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
      'Tasting/QA': ['Blending', 'Racking', 'Backsweetening', 'Bottling', 'Conditioning/Lees Aging', 'Tasting/QA'],
    };
    return stageMapping[currentStage] || [...STAGES];
  };
  
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
        // Fetch user role
        fetchUserRole(session.user.id);
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
        // Fetch user role when session changes
        if (session.user) {
          fetchUserRole(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role || null);
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserRole(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBatches();
      fetchBlendBatches();
      fetchTastingAnalyses();
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
        attachments: batch.attachments || undefined,
        yeast_type: batch.yeast_type || undefined,
        target_og: batch.target_og ? parseFloat(batch.target_og.toString()) : undefined,
        target_fg: batch.target_fg ? parseFloat(batch.target_fg.toString()) : undefined,
        target_ph: batch.target_ph ? parseFloat(batch.target_ph.toString()) : undefined,
        target_end_ph: batch.target_end_ph ? parseFloat(batch.target_end_ph.toString()) : undefined,
      }));

      setBatches(formattedBatches);

      // Reconcile selected batch with latest data
      const exists = selectedBatch && formattedBatches.some(b => b.id === selectedBatch.id);

      // Auto-select first batch on initial load
      if (!selectedBatch && formattedBatches.length > 0) {
        setSelectedBatch(formattedBatches[0]);
        fetchLogs(formattedBatches[0].id);
      } else if (selectedBatch && !exists && formattedBatches.length > 0) {
        // Previously selected batch no longer exists or is not visible
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

  const fetchBlendBatches = async () => {
    try {
      const { data: blendsData, error: blendsError } = await supabase
        .from("blend_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (blendsError) throw blendsError;

      // Fetch components for each blend
      const blendsWithComponents = await Promise.all(
        blendsData.map(async (blend) => {
          const { data: componentsData, error: componentsError } = await supabase
            .from("blend_components")
            .select(`
              id,
              source_batch_id,
              percentage,
              volume_liters,
              batches:source_batch_id (
                name,
                variety
              )
            `)
            .eq("blend_batch_id", blend.id);

          if (componentsError) throw componentsError;

          return {
            ...blend,
            components: componentsData.map((comp: any) => ({
              id: comp.id,
              source_batch_id: comp.source_batch_id,
              batch_name: comp.batches?.name || "Unknown",
              batch_variety: comp.batches?.variety || "",
              percentage: comp.percentage,
              volume_liters: comp.volume_liters,
            })),
          };
        })
      );

      setBlendBatches(blendsWithComponents);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const fetchTastingAnalyses = async () => {
    try {
      const { data: tastingData, error: tastingError } = await supabase
        .from("tasting_analysis")
        .select(`
          id,
          blend_batch_id,
          taste,
          colour,
          palate,
          overall_score,
          notes,
          created_at,
          blend_batches:blend_batch_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (tastingError) throw tastingError;

      const formattedAnalyses = tastingData.map((analysis: any) => ({
        ...analysis,
        blend_name: analysis.blend_batches?.name || "Unknown Blend",
      }));

      setTastingAnalyses(formattedAnalyses);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
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

    // Verify session before critical operation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please log in again');
      navigate('/auth');
      return;
    }

    // Re-resolve the selected batch from latest state to avoid stale IDs
    const freshSelected = batches.find(b => b.id === selectedBatch.id) || batches[0];
    if (!freshSelected) {
      toast.error('No batch available. Create a batch first.');
      return;
    }

    // Sanity check against backend (prevents RLS 42501 on stale/foreign batch)
    const { data: batchRow, error: batchCheckError } = await supabase
      .from('batches')
      .select('id, user_id, current_stage')
      .eq('id', freshSelected.id)
      .single();

    if (batchCheckError || !batchRow || batchRow.user_id !== session.user.id) {
      await fetchBatches();
      toast.error('Could not verify selected batch. Refreshed your batches, please try again.');
      return;
    }

    // Use the batch's current stage as default for the new note
    const defaultStage = freshSelected.currentStage;

    try {
      const { data, error } = await supabase
        .from('batch_logs')
        .insert([
          {
            batch_id: freshSelected.id,
            user_id: session.user.id,
            stage: defaultStage,
            role: 'General',
            title: '',
            content: '',
            tags: [],
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh logs from backend to ensure visibility
      await fetchLogs(freshSelected.id);
      toast.success('Log entry created');
    } catch (error: any) {
      if (error?.code === '42501') {
        toast.error('Permission denied while creating note. Batch selection refreshed—please try again.');
        await fetchBatches();
      } else {
        toast.error(getUserFriendlyError(error));
      }
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
            yeast_type: newBatch.yeast_type,
            target_og: newBatch.target_og,
            target_fg: newBatch.target_fg,
            target_ph: newBatch.target_ph,
            target_end_ph: newBatch.target_end_ph,
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
        yeast_type: data.yeast_type || undefined,
        target_og: data.target_og ? parseFloat(data.target_og.toString()) : undefined,
        target_fg: data.target_fg ? parseFloat(data.target_fg.toString()) : undefined,
        target_ph: data.target_ph ? parseFloat(data.target_ph.toString()) : undefined,
        target_end_ph: data.target_end_ph ? parseFloat(data.target_end_ph.toString()) : undefined,
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

  const handleBlendCreated = async (blendData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please log in again');
      navigate('/auth');
      return;
    }

    try {
      // Create blend batch
      const { data: blendBatch, error: blendError } = await supabase
        .from("blend_batches")
        .insert([{
          user_id: user.id,
          name: blendData.name,
          total_volume: blendData.total_volume,
          bottles_75cl: blendData.bottles_75cl || 0,
          bottles_150cl: blendData.bottles_150cl || 0,
          notes: blendData.notes || null,
        }])
        .select()
        .single();

      if (blendError) throw blendError;

      // Insert components
      const componentsToInsert = blendData.components.map((comp: any) => ({
        blend_batch_id: blendBatch.id,
        source_batch_id: comp.source_batch_id,
        percentage: comp.percentage,
        volume_liters: comp.volume_liters,
      }));

      const { error: componentsError } = await supabase
        .from("blend_components")
        .insert(componentsToInsert);

      if (componentsError) throw componentsError;

      toast.success("Blend batch created");
      fetchBlendBatches();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleDeleteBlend = async (blendId: string) => {
    if (!confirm("Delete this blend batch?")) return;

    try {
      const { error } = await supabase
        .from("blend_batches")
        .delete()
        .eq("id", blendId);

      if (error) throw error;

      toast.success("Blend batch deleted");
      fetchBlendBatches();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleBlendClick = (blend: any, fromCellar = false) => {
    setSelectedBlend({ ...blend, showInventoryControls: fromCellar });
    setBlendDetailsOpen(true);
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
        // Update existing analysis
        const { error } = await supabase
          .from("tasting_analysis")
          .update({
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
        // Create new analysis
        const { error } = await supabase
          .from("tasting_analysis")
          .insert([{
            user_id: user.id,
            blend_batch_id: data.blend_batch_id,
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

      fetchTastingAnalyses();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleDeleteTasting = async (analysisId: string) => {
    if (!confirm("Delete this tasting analysis?")) return;

    try {
      const { error } = await supabase
        .from("tasting_analysis")
        .delete()
        .eq("id", analysisId);

      if (error) throw error;

      toast.success("Tasting analysis deleted");
      fetchTastingAnalyses();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleEditTasting = (analysis: any) => {
    setEditingTasting(analysis);
    setTastingDialogOpen(true);
  };

  const handleNewTasting = () => {
    setEditingTasting(null);
    setTastingDialogOpen(true);
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Cider Brewing Co</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                {userProfile?.full_name || user.email}
              </span>
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

        <Tabs defaultValue={userRole === "taster" ? "tasting" : "batches"} className="mb-6 sm:mb-8">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 flex-nowrap justify-start gap-1">
              {userRole === "production" && (
                <>
                  <TabsTrigger value="batches" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <Package className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">All Batches</span>
                  </TabsTrigger>
                  <TabsTrigger value="production" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <Activity className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Production</span>
                  </TabsTrigger>
                  <TabsTrigger value="blending" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <Wine className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Blending</span>
                  </TabsTrigger>
                  <TabsTrigger value="cellar" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <Warehouse className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cellar</span>
                  </TabsTrigger>
                  <TabsTrigger value="print-labels" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <QrCode className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Print Labels</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="tasting" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                <Award className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tasting</span>
              </TabsTrigger>
              {userRole === "production" && (
                <>
                  <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <TrendingUp className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="calculators" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">
                    <FlaskConical className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Calculators</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {userRole === "production" && (
            <TabsContent value="batches" className="mt-4 sm:mt-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search batches by name, variety, or yeast type..."
                    value={batchSearchQuery}
                    onChange={(e) => setBatchSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {batches.filter((batch) => {
                  const query = batchSearchQuery.toLowerCase();
                  return (
                    batch.name.toLowerCase().includes(query) ||
                    batch.variety.toLowerCase().includes(query) ||
                    batch.yeast_type?.toLowerCase().includes(query)
                  );
                }).length === 0 ? (
                  <Card className="col-span-full p-12 text-center border-dashed">
                    <p className="text-muted-foreground">
                      {batchSearchQuery ? "No batches match your search." : "No batches yet. Click 'New Batch' to get started."}
                    </p>
                  </Card>
                ) : (
                  batches
                    .filter((batch) => {
                      const query = batchSearchQuery.toLowerCase();
                      return (
                        batch.name.toLowerCase().includes(query) ||
                        batch.variety.toLowerCase().includes(query) ||
                        batch.yeast_type?.toLowerCase().includes(query)
                      );
                    })
                    .map((batch) => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        onClick={() => handleBatchClick(batch)}
                        onDelete={() => handleDeleteBatch(batch.id)}
                      />
                    ))
                )}
              </div>
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="production" className="space-y-4 mt-4 sm:mt-6">
              {selectedBatch ? (
                <>
                  {/* Batch Overview Header */}
                  <BatchOverviewHeader
                    batch={selectedBatch}
                    latestMeasurements={logs.length > 0 ? {
                      og: logs[0].og || undefined,
                      fg: logs[0].fg || undefined,
                      ph: logs[0].ph || undefined,
                      temp_c: logs[0].temp_c || undefined,
                    } : undefined}
                    onEditClick={() => setDetailsOpen(true)}
                    onViewDetails={() => setDetailsOpen(true)}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Timeline - Takes 2 columns on large screens */}
                    <div className="lg:col-span-2">
                      <BatchTimeline
                        currentStage={selectedBatch.currentStage}
                        stageHistory={[]}
                        startDate={selectedBatch.startDate}
                      />
                    </div>

                    {/* Smart Insights - Takes 1 column */}
                    <div>
                      <SmartInsights
                        batch={selectedBatch}
                        logs={logs}
                      />
                    </div>
                  </div>

                  {/* Parameter Trend Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ParameterTrendChart
                      title="Original Gravity"
                      data={logs.map(l => ({
                        date: l.created_at,
                        value: l.og || null
                      }))}
                      color="hsl(var(--info))"
                      unit="SG"
                      targetValue={selectedBatch.target_og}
                    />
                    <ParameterTrendChart
                      title="pH Level"
                      data={logs.map(l => ({
                        date: l.created_at,
                        value: l.ph || null
                      }))}
                      color="hsl(var(--warning))"
                      unit=""
                      targetValue={selectedBatch.target_ph}
                    />
                    <ParameterTrendChart
                      title="Temperature"
                      data={logs.map(l => ({
                        date: l.created_at,
                        value: l.temp_c || null
                      }))}
                      color="hsl(var(--destructive))"
                      unit="°C"
                      targetValue={selectedBatch.target_temp_c}
                    />
                  </div>

                  {/* Quick Actions Panel */}
                  <QuickActionsPanel
                    onAddMeasurement={handleAddLog}
                    onAddObservation={handleAddLog}
                    onScheduleTask={handleAddLog}
                    onAddGeneral={handleAddLog}
                  />

                  {/* Stage Progression */}
                  <StageProgressionUI
                    currentStage={selectedBatch.currentStage}
                    batchId={selectedBatch.id}
                    batchName={selectedBatch.name}
                    onAdvanceStage={handleUpdateStage}
                  />
                  
                  {/* Search and Filter */}
                  <div className="space-y-3 sm:space-y-4">
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
                        <SelectContent className="bg-card border-border z-50 max-h-[300px]">
                          <SelectItem value="All">All stages</SelectItem>
                          {getAllowedStages(selectedBatch.currentStage).map((stage) => (
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

                    {/* Organized Logs List */}
                    {filteredLogs.length === 0 ? (
                      <Card className="p-8 sm:p-12 text-center border-dashed">
                        <p className="text-sm sm:text-base text-muted-foreground">
                          No notes yet. Click "Add Note" to get started.
                        </p>
                      </Card>
                    ) : (
                      <OrganizedLogsList
                        logs={filteredLogs}
                        onDeleteLog={(logId) => selectedBatch && fetchLogs(selectedBatch.id)}
                        onUpdateLog={() => selectedBatch && fetchLogs(selectedBatch.id)}
                      />
                    )}
                  </div>
                </>
              ) : (
                <Card className="p-8 sm:p-12 text-center border-dashed">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Select a batch to view production progress and notes
                  </p>
                </Card>
              )}
            </TabsContent>
          )}

          {userRole === "production" && (
            <>
              <TabsContent value="analytics" className="mt-4 sm:mt-6">
                {batches.length > 0 && (
                  <ProductionAnalytics 
                    batches={batches} 
                    blendBatches={blendBatches}
                    tastingAnalyses={tastingAnalyses}
                  />
                )}
              </TabsContent>

              <TabsContent value="calculators" className="mt-4 sm:mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  <ABVCalculator />
                  <PrimingCalculator />
                  <SO2Calculator />
                </div>
              </TabsContent>

              <TabsContent value="blending" className="mt-4 sm:mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Blend Batches</h2>
                  <NewBlendDialog 
                    availableBatches={batches.map(b => ({ id: b.id, name: b.name, variety: b.variety }))}
                    onBlendCreated={handleBlendCreated}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {blendBatches.length === 0 ? (
                    <Card className="col-span-full p-12 text-center border-dashed">
                      <p className="text-muted-foreground">
                        No blend batches yet. Click "New Blend" to get started.
                      </p>
                    </Card>
                  ) : (
                    blendBatches.map((blend) => (
                      <BlendBatchCard
                        key={blend.id}
                        blend={blend}
                        onDelete={handleDeleteBlend}
                        onClick={handleBlendClick}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cellar" className="mt-4 sm:mt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Cellar Overview</h2>
                  <p className="text-sm text-muted-foreground">Complete inventory of bottled blends</p>
                </div>

                {blendBatches.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No blends in the cellar yet. Create blend batches to start tracking inventory.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Wine className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Blends</p>
                            <p className="text-3xl font-bold text-foreground">{blendBatches.length}</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-success/10 rounded-lg">
                            <Package className="w-6 h-6 text-success" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">75cl Bottles</p>
                            <p className="text-3xl font-bold text-foreground">
                              {blendBatches.reduce((sum, b) => sum + (b.bottles_75cl || 0), 0)}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-chart-2/10 rounded-lg">
                            <Package className="w-6 h-6 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">150cl Bottles</p>
                            <p className="text-3xl font-bold text-foreground">
                              {blendBatches.reduce((sum, b) => sum + (b.bottles_150cl || 0), 0)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Blend Inventory Table */}
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-4">Inventory Details</h3>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Blend</th>
                                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">Volume</th>
                                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">75cl</th>
                                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">150cl</th>
                                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">Location</th>
                                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blendBatches.map((blend) => (
                                <tr 
                                  key={blend.id} 
                                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => handleBlendClick(blend, true)}
                                >
                                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                                    <div className="flex items-center gap-2">
                                      <Wine className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                      <span className="font-medium text-xs sm:text-sm truncate">{blend.name}</span>
                                    </div>
                                  </td>
                                  <td className="text-right py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground">
                                    {blend.total_volume}L
                                  </td>
                                  <td className="text-right py-3 sm:py-4 px-2 sm:px-4">
                                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                                      {blend.bottles_75cl || 0}
                                    </span>
                                  </td>
                                  <td className="text-right py-3 sm:py-4 px-2 sm:px-4">
                                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                                      {blend.bottles_150cl || 0}
                                    </span>
                                  </td>
                                  <td className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                                    {blend.storage_location || <span className="italic text-muted-foreground/50">Not set</span>}
                                  </td>
                                  <td className="text-right py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                                    {new Date(blend.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="print-labels" className="mt-4 sm:mt-6">
                <PrintQRCodes blendBatches={blendBatches} />
              </TabsContent>
            </>
          )}

          <TabsContent value="tasting" className="mt-4 sm:mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tasting Analysis</h2>
              <Button size="sm" onClick={handleNewTasting}>
                <Plus className="h-4 w-4 mr-2" />
                New Tasting
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {tastingAnalyses.length === 0 ? (
                <Card className="col-span-full p-12 text-center border-dashed">
                  <p className="text-muted-foreground">
                    No tasting analyses yet. Click "New Tasting" to get started.
                  </p>
                </Card>
              ) : (
                tastingAnalyses.map((analysis) => (
                  <TastingAnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onDelete={handleDeleteTasting}
                    onEdit={handleEditTasting}
                  />
                ))
              )}
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
      
      <BlendBatchDetails
        blend={selectedBlend}
        open={blendDetailsOpen}
        onOpenChange={setBlendDetailsOpen}
        onBlendUpdated={fetchBlendBatches}
        showInventoryControls={selectedBlend?.showInventoryControls || false}
      />

      <TastingAnalysisDialog
        open={tastingDialogOpen}
        onOpenChange={setTastingDialogOpen}
        blendBatches={blendBatches.map(b => ({ id: b.id, name: b.name }))}
        existingAnalysis={editingTasting}
        onSave={handleSaveTasting}
      />
    </div>
  );
};

export default Index;
