import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  FileDown,
  Save,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Droplets,
  FlaskConical,
  Percent,
  Clock,
  FileText,
  DollarSign,
  Award,
  Search,
} from "lucide-react";
import { useBatchComparisonStore } from "@/stores/batchComparisonStore";
import type { Batch } from "@/components/BatchCard";
import type { BatchLog } from "@/types/batchLog.types";
import { format, differenceInDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BatchComparisonProps {
  batches: Batch[];
  batchLogs: Record<string, BatchLog[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchComparison = ({
  batches,
  batchLogs,
  open,
  onOpenChange,
}: BatchComparisonProps) => {
  const { selectedBatchIds, visibleMetrics, toggleMetric, savePreset, clearSelection } =
    useBatchComparisonStore();

  const [presetName, setPresetName] = useState("");
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get selected batches data
  const selectedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));

  // Calculate insights
  const insights = calculateInsights(selectedBatches, batchLogs);

  // Synchronized scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      const scrollTop = e.currentTarget.scrollTop;
      const scrollContainers = scrollContainerRef.current.querySelectorAll(".batch-column");
      scrollContainers.forEach((container) => {
        if (container !== e.currentTarget) {
          container.scrollTop = scrollTop;
        }
      });
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    savePreset(presetName, selectedBatchIds);
    setPresetName("");
    setShowPresetDialog(false);
    toast.success("Comparison preset saved");
  };

  const handleExportPDF = () => {
    toast.info("PDF export functionality would be implemented here");
    // In a real implementation, use jsPDF or similar
  };

  const handleFindSimilar = () => {
    toast.info("Find similar batches functionality would be implemented here");
    // In a real implementation, search for batches with similar characteristics
  };

  if (selectedBatches.length < 2) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Batch Comparison ({selectedBatches.length} batches)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFindSimilar}>
                <Search className="w-4 h-4 mr-2" />
                Find Similar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPresetDialog(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Preset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Analyze and compare production metrics across multiple batches
          </DialogDescription>
        </DialogHeader>

        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Switch
              checked={visibleMetrics.basicDetails}
              onCheckedChange={() => toggleMetric("basicDetails")}
            />
            <Label>Basic Details</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={visibleMetrics.timeline}
              onCheckedChange={() => toggleMetric("timeline")}
            />
            <Label>Timeline</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={visibleMetrics.measurements}
              onCheckedChange={() => toggleMetric("measurements")}
            />
            <Label>Measurements</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={visibleMetrics.notes}
              onCheckedChange={() => toggleMetric("notes")}
            />
            <Label>Notes</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={diffMode} onCheckedChange={setDiffMode} />
            <Label>Diff Mode</Label>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis Insights
            </h3>
            <ul className="space-y-1 text-sm">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {insight.type === "warning" ? (
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  )}
                  <span>{insight.message}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Comparison Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          style={{ minHeight: 0 }}
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedBatches.length}, minmax(300px, 1fr))` }}>
            {selectedBatches.map((batch) => (
              <div
                key={batch.id}
                className="batch-column overflow-y-auto space-y-4"
                onScroll={handleScroll}
              >
                {/* Batch Header */}
                <Card className="p-4 sticky top-0 z-10 bg-background shadow-md">
                  <h3 className="font-semibold text-lg">{batch.name}</h3>
                  <p className="text-sm text-muted-foreground">{batch.variety}</p>
                  <Badge variant="outline" className="mt-2">
                    {batch.currentStage}
                  </Badge>
                </Card>

                {/* Basic Details */}
                {visibleMetrics.basicDetails && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Basic Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <DetailRow
                        label="Volume"
                        value={`${batch.volume}L`}
                        highlight={diffMode}
                        allValues={selectedBatches.map((b) => b.volume)}
                        currentValue={batch.volume}
                      />
                      <DetailRow
                        label="Started"
                        value={format(new Date(batch.startDate), "MMM dd, yyyy")}
                        highlight={diffMode}
                        allValues={selectedBatches.map((b) => b.startDate)}
                        currentValue={batch.startDate}
                      />
                      <DetailRow
                        label="Progress"
                        value={`${batch.progress}%`}
                        highlight={diffMode}
                        allValues={selectedBatches.map((b) => b.progress)}
                        currentValue={batch.progress}
                      />
                      <DetailRow
                        label="Days Active"
                        value={differenceInDays(new Date(), new Date(batch.startDate))}
                        highlight={diffMode}
                        allValues={selectedBatches.map((b) =>
                          differenceInDays(new Date(), new Date(b.startDate))
                        )}
                        currentValue={differenceInDays(new Date(), new Date(batch.startDate))}
                      />
                    </div>
                  </Card>
                )}

                {/* Timeline */}
                {visibleMetrics.timeline && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Stage Timeline
                    </h4>
                    <Progress value={batch.progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{batch.currentStage}</p>
                  </Card>
                )}

                {/* Measurements */}
                {visibleMetrics.measurements && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Latest Measurements
                    </h4>
                    <BatchMeasurements
                      logs={batchLogs[batch.id] || []}
                      targetPh={batch.targetPh}
                      targetOg={batch.targetOg}
                      targetFg={batch.targetFg}
                    />
                  </Card>
                )}

                {/* Notes */}
                {visibleMetrics.notes && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes ({(batchLogs[batch.id] || []).length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(batchLogs[batch.id] || []).slice(0, 5).map((log) => (
                        <div key={log.id} className="text-sm p-2 bg-muted/30 rounded">
                          <p className="font-medium">{log.title || "Note"}</p>
                          {log.content && (
                            <p className="text-muted-foreground text-xs line-clamp-2">
                              {log.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Measurements Chart */}
        {visibleMetrics.measurements && (
          <Card className="p-4 mt-4">
            <h4 className="font-semibold mb-3">pH Over Time</h4>
            <MeasurementChart batches={selectedBatches} batchLogs={batchLogs} metric="ph" />
          </Card>
        )}

        {/* Save Preset Dialog */}
        {showPresetDialog && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6 w-96">
              <h3 className="font-semibold mb-4">Save Comparison Preset</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., Q1 2024 Batches"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePreset}>Save Preset</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper Components

interface DetailRowProps {
  label: string;
  value: string | number;
  highlight: boolean;
  allValues: any[];
  currentValue: any;
}

const DetailRow = ({ label, value, highlight, allValues, currentValue }: DetailRowProps) => {
  const isDifferent = highlight && allValues.some((v) => v !== currentValue);

  return (
    <div className={cn("flex justify-between py-1", isDifferent && "bg-warning/10 px-2 rounded")}>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

interface BatchMeasurementsProps {
  logs: BatchLog[];
  targetPh?: number | null;
  targetOg?: number | null;
  targetFg?: number | null;
}

const BatchMeasurements = ({ logs, targetPh, targetOg, targetFg }: BatchMeasurementsProps) => {
  const latestLog = logs[logs.length - 1];

  return (
    <div className="space-y-2 text-sm">
      {latestLog?.ph && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">pH:</span>
          <span className="font-medium">
            {latestLog.ph}
            {targetPh && ` (target: ${targetPh})`}
          </span>
        </div>
      )}
      {latestLog?.og && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">OG:</span>
          <span className="font-medium">{latestLog.og}</span>
        </div>
      )}
      {latestLog?.fg && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">FG:</span>
          <span className="font-medium">{latestLog.fg}</span>
        </div>
      )}
      {latestLog?.temp_c && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Temp:</span>
          <span className="font-medium">{latestLog.temp_c}°C</span>
        </div>
      )}
      {!latestLog && <p className="text-muted-foreground text-xs">No measurements yet</p>}
    </div>
  );
};

interface MeasurementChartProps {
  batches: Batch[];
  batchLogs: Record<string, BatchLog[]>;
  metric: "ph" | "og" | "fg" | "temp_c";
}

const MeasurementChart = ({ batches, batchLogs, metric }: MeasurementChartProps) => {
  // Prepare chart data
  const chartData = batches.map((batch) => {
    const logs = batchLogs[batch.id] || [];
    return {
      name: batch.name,
      data: logs
        .filter((log) => log[metric] != null)
        .map((log) => ({
          date: new Date(log.created_at).getTime(),
          value: log[metric],
        })),
    };
  });

  const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(timestamp) => format(new Date(timestamp), "MMM dd")}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(timestamp) => format(new Date(timestamp as number), "MMM dd, yyyy")}
        />
        <Legend />
        {chartData.map((batch, idx) => (
          <Line
            key={batch.name}
            data={batch.data}
            type="monotone"
            dataKey="value"
            name={batch.name}
            stroke={colors[idx]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Calculate insights from batch comparison
function calculateInsights(batches: Batch[], batchLogs: Record<string, BatchLog[]>) {
  const insights: Array<{ type: "info" | "warning"; message: string }> = [];

  if (batches.length < 2) return insights;

  // Compare progress
  const progressValues = batches.map((b) => b.progress);
  const maxProgress = Math.max(...progressValues);
  const minProgress = Math.min(...progressValues);

  if (maxProgress - minProgress > 20) {
    const ahead = batches.find((b) => b.progress === maxProgress);
    const behind = batches.find((b) => b.progress === minProgress);
    insights.push({
      type: "info",
      message: `${ahead?.name} is ${maxProgress - minProgress}% ahead of ${behind?.name}`,
    });
  }

  // Compare volumes
  const volumes = batches.map((b) => b.volume);
  const maxVolume = Math.max(...volumes);
  const minVolume = Math.min(...volumes);

  if (maxVolume !== minVolume) {
    const percentDiff = ((maxVolume - minVolume) / minVolume) * 100;
    if (percentDiff > 15) {
      insights.push({
        type: "warning",
        message: `Volume varies by ${percentDiff.toFixed(0)}% across batches`,
      });
    }
  }

  // Compare age
  const ages = batches.map((b) => differenceInDays(new Date(), new Date(b.startDate)));
  const maxAge = Math.max(...ages);
  const minAge = Math.min(...ages);

  if (maxAge - minAge > 7) {
    insights.push({
      type: "info",
      message: `Oldest batch is ${maxAge - minAge} days older than newest`,
    });
  }

  return insights;
}
