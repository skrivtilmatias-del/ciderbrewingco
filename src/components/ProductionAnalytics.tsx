import { Card } from "@/components/ui/card";
import { CalendarDays, TrendingUp, BarChart3 } from "lucide-react";
import type { Batch } from "@/components/BatchCard";

interface ProductionAnalyticsProps {
  batches: Batch[];
}

export const ProductionAnalytics = ({ batches }: ProductionAnalyticsProps) => {
  // Calculate analytics
  const completedBatches = batches.filter((b) => b.currentStage === "complete");
  const completionRate =
    batches.length > 0
      ? Math.round((completedBatches.length / batches.length) * 100)
      : 0;

  const varietyBreakdown = batches.reduce((acc, batch) => {
    acc[batch.variety] = (acc[batch.variety] || 0) + batch.volume;
    return acc;
  }, {} as Record<string, number>);

  const topVariety =
    Object.keys(varietyBreakdown).length > 0
      ? Object.entries(varietyBreakdown).sort((a, b) => b[1] - a[1])[0]
      : null;

  const avgBatchSize =
    batches.length > 0
      ? Math.round(batches.reduce((sum, b) => sum + b.volume, 0) / batches.length)
      : 0;

  const currentYearBatches = batches.filter((b) => {
    const batchYear = new Date(b.startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return batchYear === currentYear;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Production Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {completedBatches.length} of {batches.length} batches completed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Batch Size</p>
              <p className="text-3xl font-bold text-foreground">{avgBatchSize}L</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Across all production batches
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <CalendarDays className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Year</p>
              <p className="text-3xl font-bold text-foreground">{currentYearBatches.length}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Batches started in {new Date().getFullYear()}
          </p>
        </Card>
      </div>

      {topVariety && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Variety Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(varietyBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([variety, volume]) => {
                const percentage = Math.round(
                  (volume / batches.reduce((sum, b) => sum + b.volume, 0)) * 100
                );
                return (
                  <div key={variety} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-foreground">{variety}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground ml-4">
                      {volume}L ({percentage}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
};
