import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BatchCard } from "@/components/BatchCard";
import { NewBatchDialog } from "@/components/NewBatchDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { ProductionAnalytics } from "@/components/ProductionAnalytics";
import { Apple, TrendingUp, Package, Activity, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Batch } from "@/components/BatchCard";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
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
    } catch (error: any) {
      toast.error("Error loading batches: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCreated = async (newBatch: Omit<Batch, "id">) => {
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
      toast.error("Error creating batch: " + error.message);
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
      toast.error("Error updating batch: " + error.message);
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
              <h1 className="text-3xl font-bold text-foreground">CiderTrack</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <NewBatchDialog onBatchCreated={handleBatchCreated} />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
              >
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

        {/* Analytics */}
        {batches.length > 0 && (
          <div className="mb-8">
            <ProductionAnalytics batches={batches} />
          </div>
        )}

        {/* Batches Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Production Batches</h2>
          {batches.length === 0 ? (
            <Card className="p-12 text-center">
              <Apple className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No batches yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first batch to start tracking your cider production
              </p>
              <NewBatchDialog onBatchCreated={handleBatchCreated} />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} onClick={() => handleBatchClick(batch)} />
              ))}
            </div>
          )}
        </div>
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
