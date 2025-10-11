import { useState } from "react";
import { BatchCard, Batch } from "@/components/BatchCard";
import { NewBatchDialog } from "@/components/NewBatchDialog";
import { BatchDetails } from "@/components/BatchDetails";
import { Apple, TrendingUp, Package, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

const initialBatches: Batch[] = [
  {
    id: "1",
    name: "Autumn Harvest 2024",
    variety: "Kingston Black",
    volume: 150,
    startDate: "2024-09-15",
    currentStage: "fermentation",
    progress: 45,
    notes: "Strong apple aroma, fermentation proceeding well",
  },
  {
    id: "2",
    name: "Summer Blend",
    variety: "Dabinett Mix",
    volume: 100,
    startDate: "2024-08-01",
    currentStage: "aging",
    progress: 75,
    notes: "Complex flavor profile developing",
  },
  {
    id: "3",
    name: "Winter Reserve",
    variety: "Yarlington Mill",
    volume: 200,
    startDate: "2024-10-01",
    currentStage: "pressing",
    progress: 15,
  },
];

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleBatchCreated = (newBatch: Batch) => {
    setBatches([newBatch, ...batches]);
  };

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  const handleUpdateStage = (batchId: string, newStage: Batch["currentStage"]) => {
    const stageProgress = {
      pressing: 20,
      fermentation: 45,
      aging: 75,
      bottling: 90,
      complete: 100,
    };

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
  };

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
            <NewBatchDialog onBatchCreated={handleBatchCreated} />
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
