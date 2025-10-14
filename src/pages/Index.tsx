import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { BatchCard } from "@/components/BatchCard";
import { NewBatchDialog } from "@/components/NewBatchDialog";
import { NewBlendDialog } from "@/components/NewBlendDialog";
import { BlendBatchCard } from "@/components/BlendBatchCard";
import { BlendBatchDetailsTabbed } from "@/components/BlendBatchDetailsTabbed";
import { TastingAnalysisCard } from "@/components/TastingAnalysisCard";
import { TastingAnalysisDialog } from "@/components/TastingAnalysisDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { BatchOverviewHeader } from "@/components/BatchOverviewHeader";
import { BatchProductionHeader } from "@/components/BatchProductionHeader";
import { ParameterTrendChart } from "@/components/ParameterTrendChart";
import { QuickActionsPanel } from "@/components/QuickActionsPanel";
import { SmartInsights } from "@/components/SmartInsights";
import { OrganizedLogsList } from "@/components/OrganizedLogsList";
import { ProductionAnalytics } from "@/components/ProductionAnalytics";
import { StageProgressionUI } from "@/components/StageProgressionUI";
import { PrintQRCodes } from "@/components/PrintQRCodes";
import { FloorPlan } from "@/pages/FloorPlan";
import { CellarOverview } from "@/components/CellarOverview";
import { SupplierOverview } from "@/components/SupplierOverview";
import { Apple, TrendingUp, Package, Activity, LogOut, Plus, Search, Calendar, FlaskConical, Settings2, Wine, Award, Warehouse, QrCode, Layout, DollarSign, Loader2, Webhook, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Batch } from "@/components/BatchCard";
import { BatchLogCard, type BatchLog } from "@/components/BatchLogCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ABVCalculator } from "@/components/calculators/ABVCalculator";
import { PrimingCalculator } from "@/components/calculators/PrimingCalculator";
import { SO2Calculator } from "@/components/calculators/SO2Calculator";
import { CostCalculation } from "@/components/CostCalculation";
import { STAGES } from "@/constants/ciderStages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toolView } = useParams();
  const { user, userRole, userProfile, loading: authLoading } = useAuth();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [blendSearchQuery, setBlendSearchQuery] = useState("");
  const [tastingSearchQuery, setTastingSearchQuery] = useState("");
  const [batchSortOrder, setBatchSortOrder] = useState("newest");
  const [stageFilter, setStageFilter] = useState("All");
  
  // Determine active tab from route
  const getActiveTabFromPath = (): "batches" | "production" | "blending" | "cellar" | "tasting" | "tools" | "suppliers" => {
    const path = location.pathname;
    if (path === '/batches' || path === '/') return 'batches';
    if (path === '/production') return 'production';
    if (path === '/blending') return 'blending';
    if (path === '/cellar') return 'cellar';
    if (path === '/tasting') return 'tasting';
    if (path.startsWith('/tools')) return 'tools';
    return 'batches';
  };
  
  const activeTab = getActiveTabFromPath();
  const [toolsView, setToolsView] = useState<"analytics" | "calculators" | "print-labels" | "floor-plan" | "cost-calculation" | "planning-tool">(toolView as any || "analytics");
  
  // Sync toolsView with URL parameter
  useEffect(() => {
    if (toolView && ['analytics', 'calculators', 'print-labels', 'floor-plan', 'cost-calculation'].includes(toolView)) {
      setToolsView(toolView as any);
    }
  }, [toolView]);
  
  const [blendBatches, setBlendBatches] = useState<any[]>([]);
  const [selectedBlend, setSelectedBlend] = useState<any>(null);
  const [blendDetailsOpen, setBlendDetailsOpen] = useState(false);
  const [tastingAnalyses, setTastingAnalyses] = useState<any[]>([]);
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);
  const [selectedBlendIdForTasting, setSelectedBlendIdForTasting] = useState<string | null>(null);
  
  // Get allowed stages based on current batch stage
  const getAllowedStages = (currentStage: string): string[] => {
    const stageMapping: Record<string, string[]> = {
      'Harvest': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Sorting': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Washing': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Milling': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Pressing': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Settling': ['Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling'],
      'Enzymes': ['Enzymes', 'Pitching', 'Fermentation', 'Cold Crash'],
      'Pitching': ['Enzymes', 'Pitching', 'Fermentation', 'Cold Crash'],
      'Fermentation': ['Enzymes', 'Pitching', 'Fermentation', 'Cold Crash'],
      'Cold Crash': ['Enzymes', 'Pitching', 'Fermentation', 'Cold Crash'],
      'Racking': ['Racking', 'Malolactic', 'Stabilisation'],
      'Malolactic': ['Racking', 'Malolactic', 'Stabilisation'],
      'Stabilisation': ['Racking', 'Malolactic', 'Stabilisation'],
      'Blending': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
      'Backsweetening': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
      'Bottling': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
      'Conditioning': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
      'Lees Aging': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
      'Tasting': ['Blending', 'Backsweetening', 'Bottling', 'Conditioning', 'Lees Aging', 'Tasting'],
    };
    return stageMapping[currentStage] || [...STAGES];
  };
  
  // Debounce search query to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedBlendSearchQuery = useDebounce(blendSearchQuery, 300);

  // Auth is now handled by useAuth hook
  // Redirect is handled in useAuth

  useEffect(() => {
    if (user) {
      fetchBatches();
      fetchBlendBatches();
      fetchTastingAnalyses();
    }
  }, [user]);

  // Handle batch selection from QR redirect via URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const batchId = params.get("batch");

    if (batchId && batches.length > 0) {
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setSelectedBatch(batch);
        fetchLogs(batch.id);
        navigate("/production");
      }
    }
  }, [location.search, batches, navigate]);

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
        apple_origin: batch.apple_origin || undefined,
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

      // Fetch components and tasting data for each blend
      const blendsWithData = await Promise.all(
        blendsData.map(async (blend) => {
          // Fetch components
          const { data: componentsData, error: componentsError } = await supabase
            .from("blend_components")
            .select(`
              id,
              source_batch_id,
              percentage,
              volume_liters,
              spillage,
              batches:source_batch_id (
                name,
                variety
              )
            `)
            .eq("blend_batch_id", blend.id);

          if (componentsError) throw componentsError;

          // Fetch tasting analyses
          const { data: tastingData, error: tastingError } = await supabase
            .from("tasting_analysis")
            .select("overall_score, notes, created_at")
            .eq("blend_batch_id", blend.id)
            .order("created_at", { ascending: false });

          if (tastingError) throw tastingError;

          // Calculate average score
          const average_score = tastingData.length > 0
            ? tastingData.reduce((sum, t) => sum + (t.overall_score || 0), 0) / tastingData.length
            : null;

          // Get latest tasting note
          const latest_tasting = tastingData.length > 0 && tastingData[0].notes
            ? tastingData[0].notes
            : null;

          return {
            ...blend,
            components: componentsData.map((comp: any) => ({
              id: comp.id,
              source_batch_id: comp.source_batch_id,
              batch_name: comp.batches?.name || "Unknown",
              batch_variety: comp.batches?.variety || "",
              percentage: comp.percentage,
              volume_liters: comp.volume_liters,
              spillage: comp.spillage || 0,
            })),
            average_score,
            tasting_count: tastingData.length,
            latest_tasting,
          };
        })
      );

      setBlendBatches(blendsWithData);
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
          user_id,
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

      // Fetch all unique user profiles
      const userIds = [...new Set(tastingData.map((t: any) => t.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(
        profilesData?.map((p: any) => [p.id, p.full_name]) || []
      );

      const formattedAnalyses = tastingData.map((analysis: any) => ({
        ...analysis,
        blend_name: analysis.blend_batches?.name || "Unknown Blend",
        user_name: profilesMap.get(analysis.user_id) || "Unknown User",
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

  const handleAddLog = async (title: string = '', role: string = 'General') => {
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
            role: role,
            title: title,
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
      'Harvest', 'Sorting', 'Washing', 'Milling', 'Pressing', 'Settling',
      'Enzymes', 'Pitching', 'Fermentation', 'Cold Crash', 'Racking', 'Malolactic',
      'Stabilisation', 'Blending', 'Backsweetening', 'Bottling',
      'Conditioning', 'Lees Aging', 'Tasting', 'Complete'
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
        spillage: comp.spillage || 0,
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

      // If tasting has attachments and a blend_batch_id, add them to the blend batch
      if (data.attachments && data.attachments.length > 0 && data.blend_batch_id) {
        const { data: blendData } = await supabase
          .from("blend_batches")
          .select("attachments")
          .eq("id", data.blend_batch_id)
          .single();

        if (blendData) {
          const existingAttachments = blendData.attachments || [];
          const newAttachments = data.attachments.filter(
            (att: string) => !existingAttachments.includes(att)
          );

          if (newAttachments.length > 0) {
            await supabase
              .from("blend_batches")
              .update({
                attachments: [...existingAttachments, ...newAttachments]
              })
              .eq("id", data.blend_batch_id);
          }
        }
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

  const handleGoToProduction = (batch: Batch) => {
    setSelectedBatch(batch);
    fetchLogs(batch.id);
    setDetailsOpen(false);
    navigate("/production");
  };

  // Calculate batch usage and remaining volumes
  const batchUsageInfo = useMemo(() => {
    return batches.map(batch => {
      const volumeUsedInBlends = blendBatches.reduce((total, blend) => {
        const componentVolume = blend.components
          ?.filter((comp: any) => comp.source_batch_id === batch.id)
          .reduce((sum: number, comp: any) => {
            const volume = parseFloat(comp.volume_liters) || 0;
            const spillage = parseFloat(comp.spillage) || 0;
            return sum + volume + spillage; // Include spillage in total usage
          }, 0) || 0;
        return total + componentVolume;
      }, 0);
      
      const remainingVolume = batch.volume - volumeUsedInBlends;
      const usagePercentage = (volumeUsedInBlends / batch.volume) * 100;
      
      return {
        ...batch,
        volumeUsed: volumeUsedInBlends,
        volumeRemaining: remainingVolume,
        usagePercentage,
        isAvailable: remainingVolume > 0.1
      };
    }).sort((a, b) => b.volumeRemaining - a.volumeRemaining);
  }, [batches, blendBatches]);

  // Calculate available batches (exclude those fully used in blends)
  const availableBatchesForBlending = useMemo(() => {
    return batchUsageInfo
      .filter(b => b.isAvailable)
      .map(b => ({ id: b.id, name: b.name, variety: b.variety }));
  }, [batchUsageInfo]);

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

  const activeBatches = batches.filter((b) => b.currentStage !== "Complete").length;
  const totalVolume = batches.reduce((sum, b) => sum + b.volume, 0);
  const avgProgress =
    batches.length > 0
      ? Math.round(batches.reduce((sum, b) => sum + b.progress, 0) / batches.length)
      : 0;

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Apple className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary flex-shrink-0" />
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">Cider Brewing Co</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                {userProfile?.full_name || user.email}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-10"
                    size="sm"
                    onClick={() => setTastingDialogOpen(true)}
                  >
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">New </span>Tasting
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a new tasting analysis</TooltipContent>
              </Tooltip>
              {userRole !== "taster" && (
                <NewBatchDialog onBatchCreated={handleBatchCreated} />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" onClick={handleSignOut}>
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0 h-auto p-1">
                {userRole === "production" && (
                  <>
                    <TabsTrigger value="batches" asChild>
                      <button onClick={() => navigate('/batches')} className="py-1.5 px-3">
                        <Package className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">All Batches</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="production" asChild>
                      <button onClick={() => navigate('/production')} className="py-1.5 px-3">
                        <Activity className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Production</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="blending" asChild>
                      <button onClick={() => navigate('/blending')} className="py-1.5 px-3">
                        <Wine className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Blending</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="cellar" asChild>
                      <button onClick={() => navigate('/cellar')} className="py-1.5 px-3">
                        <Warehouse className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Cellar</span>
                      </button>
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" asChild>
                      <button onClick={() => navigate('/suppliers')} className="py-1.5 px-3">
                        <TrendingUp className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Suppliers</span>
                      </button>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="tasting" asChild>
                  <button onClick={() => navigate('/tasting')} className="py-1.5 px-3">
                    <Award className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Tasting</span>
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
                      <DropdownMenuItem onClick={() => navigate("/tools/analytics")}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/tools/calculators")}>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Calculators
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/tools/print-labels")}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Print Labels
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/tools/floor-plan")}>
                        <Layout className="h-4 w-4 mr-2" />
                        Floor Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/tools/cost-calculation")}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Cost Calculation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/planning")}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Economic Planning Tool
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/webhooks")}>
                        <Webhook className="h-4 w-4 mr-2" />
                        Webhooks & API
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/install")}>
                        <Download className="h-4 w-4 mr-2" />
                        Install App
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TabsList>
            </div>
            
        {(activeTab === "batches" || activeTab === "production" || activeTab === "blending") && userRole === "production" && (
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                      activeTab === "batches" 
                        ? "Search batches..." 
                        : activeTab === "production"
                        ? "Search batches by name, variety, or stage..."
                        : "Search blends..."
                    }
                    value={activeTab === "blending" ? blendSearchQuery : batchSearchQuery}
                    onChange={(e) => activeTab === "blending" ? setBlendSearchQuery(e.target.value) : setBatchSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab === "batches" && (
                  <Select value={batchSortOrder} onValueChange={setBatchSortOrder}>
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
                )}
                {activeTab === "blending" && (
                  <NewBlendDialog 
                    availableBatches={availableBatchesForBlending}
                    onBlendCreated={handleBlendCreated}
                  />
                )}
              </div>
            )}
          </div>

          {userRole === "production" && (
            <TabsContent value="batches" className="mt-4 sm:mt-6">
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
                    .sort((a, b) => {
                      switch (batchSortOrder) {
                        case "newest":
                          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                        case "oldest":
                          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                        case "name-asc":
                          return a.name.localeCompare(b.name);
                        case "name-desc":
                          return b.name.localeCompare(a.name);
                        case "volume-high":
                          return (b.volume || 0) - (a.volume || 0);
                        case "volume-low":
                          return (a.volume || 0) - (b.volume || 0);
                        case "progress-high":
                          return (b.progress || 0) - (a.progress || 0);
                        case "progress-low":
                          return (a.progress || 0) - (b.progress || 0);
                        default:
                          return 0;
                      }
                    })
                    .map((batch) => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        onClick={() => handleBatchClick(batch)}
                        onDelete={() => handleDeleteBatch(batch.id)}
                        onAdvanceStage={(newStage) => handleUpdateStage(batch.id, newStage)}
                        onPreviousStage={(newStage) => handleUpdateStage(batch.id, newStage)}
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
                  {/* Show filtered results if searching */}
                  {batchSearchQuery && (
                    <Card className="p-2 max-h-[200px] overflow-y-auto">
                      {batches
                        .filter((batch) => {
                          const query = batchSearchQuery.toLowerCase();
                          return (
                            batch.name.toLowerCase().includes(query) ||
                            batch.variety.toLowerCase().includes(query) ||
                            batch.currentStage.toLowerCase().includes(query)
                          );
                        })
                        .map((batch) => (
                          <button
                            key={batch.id}
                            onClick={() => {
                              handleBatchSelect(batch);
                              setBatchSearchQuery("");
                            }}
                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-sm">{batch.name}</span>
                            <span className="text-xs text-muted-foreground">• {batch.variety}</span>
                            <Badge variant="outline" className="text-xs ml-auto">{batch.currentStage}</Badge>
                          </button>
                        ))}
                      {batches.filter((batch) => {
                        const query = batchSearchQuery.toLowerCase();
                        return (
                          batch.name.toLowerCase().includes(query) ||
                          batch.variety.toLowerCase().includes(query) ||
                          batch.currentStage.toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          No batches found
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Batch Production Header */}
                  <BatchProductionHeader batch={selectedBatch} />

                  {/* Stage Progression */}
                  <StageProgressionUI
                    currentStage={selectedBatch.currentStage}
                    batchId={selectedBatch.id}
                    batchName={selectedBatch.name}
                    onAdvanceStage={handleUpdateStage}
                  />


                  {/* Smart Insights */}
                  <SmartInsights
                    batch={selectedBatch}
                    logs={logs}
                  />

                  {/* Parameter Trend Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ParameterTrendChart
                      title="OG"
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
                    onAddMeasurement={() => handleAddLog('Measurement', 'Lab')}
                    onAddObservation={() => handleAddLog('Observation', 'Observation')}
                    onScheduleTask={() => handleAddLog('Note', 'General')}
                    onAddGeneral={() => handleAddLog('Note', 'General')}
                  />
                  
                  {/* Organized Logs List */}
                  <div className="space-y-3 sm:space-y-4">
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
            <TabsContent value="tools" className="mt-4 sm:mt-6">
              {toolsView === "analytics" && batches.length > 0 && (
                <ProductionAnalytics 
                  batches={batches} 
                  blendBatches={blendBatches}
                  tastingAnalyses={tastingAnalyses}
                />
              )}

              {toolsView === "calculators" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  <ABVCalculator />
                  <PrimingCalculator />
                  <SO2Calculator />
                </div>
              )}

              {toolsView === "print-labels" && (
                <PrintQRCodes blendBatches={blendBatches} />
              )}

              {toolsView === "floor-plan" && (
                <div className="h-[calc(100vh-250px)]">
                  <FloorPlan />
                </div>
              )}

              {toolsView === "cost-calculation" && (
                <CostCalculation />
              )}
            </TabsContent>
          )}

          {userRole === "production" && (
            <>
              <TabsContent value="blending" className="mt-4 sm:mt-6">
                {/* Available Batches Overview - Compact */}
                {batchUsageInfo.filter(b => b.isAvailable).length > 0 && (
                  <Card className="mb-4">
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-semibold mb-3">Available for Blending</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {batchUsageInfo.filter(b => b.isAvailable).map((batch) => (
                          <div key={batch.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border">
                            <Apple className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{batch.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {batch.volumeRemaining.toFixed(1)}L / {batch.volume.toFixed(1)}L
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              {(100 - batch.usagePercentage).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Blend Batches */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {blendBatches.length === 0 ? (
                    <Card className="col-span-full p-12 text-center border-dashed">
                      <Wine className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                      <h3 className="text-lg font-semibold mb-2">No Blends Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first blend batch to start tracking your cider blends.
                      </p>
                      <NewBlendDialog 
                        availableBatches={availableBatchesForBlending}
                        onBlendCreated={handleBlendCreated}
                      />
                    </Card>
                  ) : (
                    blendBatches
                      .filter(blend => {
                        if (debouncedBlendSearchQuery === "") return true;
                        const searchLower = debouncedBlendSearchQuery.toLowerCase();
                        return (
                          blend.name.toLowerCase().includes(searchLower) ||
                          blend.notes?.toLowerCase().includes(searchLower) ||
                          blend.components.some((c: any) => 
                            c.batch_name.toLowerCase().includes(searchLower) ||
                            c.batch_variety.toLowerCase().includes(searchLower)
                          )
                        );
                      })
                      .map((blend) => (
                        <BlendBatchCard
                          key={blend.id}
                          blend={blend}
                          onDelete={handleDeleteBlend}
                          onClick={handleBlendClick}
                          onAddTastingNote={(blendId) => {
                            setSelectedBlendIdForTasting(blendId);
                            setTastingDialogOpen(true);
                          }}
                        />
                      ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cellar" className="mt-4 sm:mt-6">
                {blendBatches.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <Warehouse className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold mb-2">Cellar is Empty</h3>
                    <p className="text-muted-foreground mb-4">
                      Create blend batches and bottle them to start tracking your cellar inventory.
                    </p>
                    <NewBlendDialog 
                      availableBatches={availableBatchesForBlending}
                      onBlendCreated={handleBlendCreated}
                    />
                  </Card>
                ) : (
                  <CellarOverview 
                    blends={blendBatches}
                    onBlendClick={(blend) => handleBlendClick(blend, true)}
                    onRefresh={fetchBlendBatches}
                  />
                )}
            </TabsContent>
          </>
        )}

        {userRole === "production" && (
          <TabsContent value="suppliers" className="mt-4 sm:mt-6">
            <SupplierOverview />
          </TabsContent>
        )}

        <TabsContent value="tasting" className="mt-4 sm:mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4">Tasting Analysis</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tastings by blend name, notes, or descriptors..."
                  value={tastingSearchQuery}
                  onChange={(e) => setTastingSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {tastingAnalyses.filter((analysis) => {
                if (!tastingSearchQuery) return true;
                const query = tastingSearchQuery.toLowerCase();
                const blendName = blendBatches.find(b => b.id === analysis.blend_batch_id)?.name || '';
                return (
                  blendName.toLowerCase().includes(query) ||
                  analysis.notes?.toLowerCase().includes(query) ||
                  analysis.colour?.toLowerCase().includes(query) ||
                  analysis.palate?.toLowerCase().includes(query) ||
                  analysis.taste?.toLowerCase().includes(query)
                );
              }).length === 0 ? (
                <Card className="col-span-full p-12 text-center border-dashed">
                  <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold mb-2">
                    {tastingSearchQuery ? "No Results Found" : "No Tastings Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {tastingSearchQuery 
                      ? "Try adjusting your search to find tasting analyses." 
                      : "Start documenting your tasting notes with detailed sensory analysis."
                    }
                  </p>
                  {!tastingSearchQuery && (
                    <Button onClick={handleNewTasting}>
                      <Award className="h-4 w-4 mr-2" />
                      Create First Tasting
                    </Button>
                  )}
                </Card>
              ) : (
                tastingAnalyses.filter((analysis) => {
                  if (!tastingSearchQuery) return true;
                  const query = tastingSearchQuery.toLowerCase();
                  const blendName = blendBatches.find(b => b.id === analysis.blend_batch_id)?.name || '';
                  return (
                    blendName.toLowerCase().includes(query) ||
                    analysis.notes?.toLowerCase().includes(query) ||
                    analysis.colour?.toLowerCase().includes(query) ||
                    analysis.palate?.toLowerCase().includes(query) ||
                    analysis.taste?.toLowerCase().includes(query)
                  );
                }).map((analysis) => (
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
        onGoToProduction={handleGoToProduction}
      />
      
      <BlendBatchDetailsTabbed
        blend={selectedBlend}
        open={blendDetailsOpen}
        onOpenChange={setBlendDetailsOpen}
        onBlendUpdated={fetchBlendBatches}
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
        blendBatches={blendBatches
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
