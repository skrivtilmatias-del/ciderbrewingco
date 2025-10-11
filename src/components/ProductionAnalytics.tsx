import { Card } from "@/components/ui/card";
import { CalendarDays, TrendingUp, BarChart3, Wine, Award, Package } from "lucide-react";
import type { Batch } from "@/components/BatchCard";

interface ProductionAnalyticsProps {
  batches: Batch[];
  blendBatches?: any[];
  tastingAnalyses?: any[];
}

export const ProductionAnalytics = ({ batches, blendBatches = [], tastingAnalyses = [] }: ProductionAnalyticsProps) => {
  // Calculate analytics
  const completedBatches = batches.filter((b) => b.currentStage === "Complete");
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

  // Calculate bottle inventory
  const total75clBottles = blendBatches.reduce((sum, b) => sum + (b.bottles_75cl || 0), 0);
  const total150clBottles = blendBatches.reduce((sum, b) => sum + (b.bottles_150cl || 0), 0);

  // Get top tasting scores
  const topTastingScores = tastingAnalyses
    .filter((t) => t.overall_score != null)
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Production Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-chart-2/10 rounded-lg">
              <Wine className="w-6 h-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Blends</p>
              <p className="text-3xl font-bold text-foreground">{blendBatches.length}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Created blend batches
          </p>
        </Card>
      </div>

      {/* Bottle Inventory Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Package className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">75cl Bottles in Cellar</p>
              <p className="text-3xl font-bold text-foreground">{total75clBottles}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Total standard bottles available
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-chart-2/10 rounded-lg">
              <Package className="w-6 h-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">150cl Bottles in Cellar</p>
              <p className="text-3xl font-bold text-foreground">{total150clBottles}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Total magnum bottles available
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {topTastingScores.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-chart-3" />
              <h3 className="text-lg font-semibold text-foreground">
                Top Tasting Scores
              </h3>
            </div>
            <div className="space-y-3">
              {topTastingScores.map((analysis, index) => {
                const getScoreColor = (score: number) => {
                  if (score >= 90) return "text-chart-3";
                  if (score >= 80) return "text-success";
                  if (score >= 70) return "text-chart-2";
                  return "text-muted-foreground";
                };
                
                return (
                  <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{analysis.blend_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                      {analysis.overall_score}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
