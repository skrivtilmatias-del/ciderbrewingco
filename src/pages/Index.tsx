import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { paths } from "@/routes/paths";
import { useAppStore } from '@/stores/appStore';
import { AppHeader } from "@/components/layout/AppHeader";
import { BatchesTab } from "@/components/tabs/BatchesTab";
import { ProductionTab } from "@/components/tabs/ProductionTab";
import { BlendingTab } from "@/components/tabs/BlendingTab";
import { CellarTab } from "@/components/tabs/CellarTab";
import { SuppliersTab } from "@/components/tabs/SuppliersTab";
import { TastingTab } from "@/components/tabs/TastingTab";
import { ToolsTab } from "@/components/tabs/ToolsTab";
import { BlendBatchDetailsTabbed } from "@/components/BlendBatchDetailsTabbed";
import { TastingAnalysisDialog } from "@/components/TastingAnalysisDialog";
import { BatchDetails } from "@/components/BatchDetails";
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
  
  // Use state from useAppStore for modals and selection
  const {
    selectedBatch,
    setSelectedBatch,
    detailsOpen,
    setDetailsOpen,
    selectedBlend,
    setSelectedBlend,
    blendDetailsOpen,
    setBlendDetailsOpen,
  } = useAppStore();
  
  const [batches, setBatches] = useState<Batch[]>([]);
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

  // Auto-select first batch when batches are loaded
  useEffect(() => {
    if (!selectedBatch && batches.length > 0) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch, setSelectedBatch]);

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

      // Clear state if no batches
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
          competitor_brand,
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
        blend_name: analysis.competitor_brand 
          ? `${analysis.competitor_brand} (Competitor)` 
          : (analysis.blend_batches?.name || "Unknown Blend"),
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

      // Update selected batch if it's the one being updated
      if (selectedBatch?.id === batchId) {
        setSelectedBatch({ 
          ...selectedBatch, 
          currentStage: newStage as any, 
          progress: progress 
        });
      }

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
        // Create new analysis
        const { error } = await supabase
          .from("tasting_analysis")
          .insert([{
            user_id: user.id,
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
      <AppHeader 
        user={user}
        userProfile={userProfile}
        userRole={userRole}
        onBatchCreated={fetchBatches}
        onTastingSaved={handleSaveTasting}
        blendBatches={blendBatches}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
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
                        <TrendingUp className="h-4 w-4 sm:mr-2" />
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
                      <DropdownMenuItem onClick={() => navigate(paths.tools.analytics())}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
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
                      <DropdownMenuItem onClick={() => navigate(paths.planning())}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Economic Planning Tool
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(paths.webhooks())}>
                        <Webhook className="h-4 w-4 mr-2" />
                        Webhooks & API
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(paths.install())}>
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
              </div>
            )}
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
                onAddLog={handleAddLog}
              />
            </TabsContent>
          )}

          {userRole === "production" && (
            <TabsContent value="tools" className="mt-4 sm:mt-6">
              <ToolsTab 
                batches={batches}
                blendBatches={blendBatches}
                toolView={toolView}
              />
            </TabsContent>
          )}

          {userRole === "production" && (
            <>
              <TabsContent value="blending" className="mt-4 sm:mt-6">
                <BlendingTab 
                  batches={batches}
                  blendBatches={blendBatches}
                />
              </TabsContent>

              <TabsContent value="cellar" className="mt-4 sm:mt-6">
                <CellarTab blendBatches={blendBatches} />
            </TabsContent>
          </>
        )}

        {userRole === "production" && (
          <TabsContent value="suppliers" className="mt-4 sm:mt-6">
            <SuppliersTab />
          </TabsContent>
        )}

        <TabsContent value="tasting" className="mt-4 sm:mt-6">
          <TastingTab blendBatches={blendBatches} />
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
