import { Card } from "@/components/ui/card";
import { CalendarDays, TrendingUp, BarChart3, Wine, Award, Package, Timer, Activity, Zap, Target, Boxes, FlaskConical } from "lucide-react";
import type { Batch } from "@/components/BatchCard";
import { AIInsights } from "./AIInsights";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

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
  
  // Calculate total volume bottled and average blend size
  const totalVolumeBottled = blendBatches.reduce((sum, b) => sum + (b.total_volume || 0), 0);
  const avgBlendSize = blendBatches.length > 0 
    ? Math.round(totalVolumeBottled / blendBatches.length) 
    : 0;

  // Calculate average production time for completed batches (estimate based on start date)
  const avgProductionDays = completedBatches.length > 0
    ? Math.round(completedBatches.reduce((sum, b) => {
        const start = new Date(b.startDate).getTime();
        const now = new Date().getTime();
        return sum + (now - start) / (1000 * 60 * 60 * 24);
      }, 0) / completedBatches.length)
    : 0;

  // Calculate stage distribution
  const stageDistribution = batches.reduce((acc, batch) => {
    acc[batch.currentStage] = (acc[batch.currentStage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeStages = Object.keys(stageDistribution).filter(s => s !== "Complete").length;

  // Calculate total production volume
  const totalProductionVolume = batches.reduce((sum, b) => sum + b.volume, 0);

  // Calculate batches in progress
  const batchesInProgress = batches.filter(b => b.currentStage !== "Complete").length;

  // Get top tasting scores
  const topTastingScores = tastingAnalyses
    .filter((t) => t.overall_score != null)
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 5);

  const avgTastingScore = tastingAnalyses.length > 0
    ? Math.round(tastingAnalyses.reduce((sum, t) => sum + (t.overall_score || 0), 0) / tastingAnalyses.length)
    : 0;

  // Prepare stage distribution data for pie chart
  const stageChartData = Object.entries(stageDistribution).map(([stage, count]) => ({
    name: stage,
    value: count,
  }));

  const STAGE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--warning))", "hsl(var(--success))"];

  // Prepare variety trends over time (by month)
  const varietyTrendsData = batches.reduce((acc, batch) => {
    const month = new Date(batch.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!acc[month]) acc[month] = {};
    acc[month][batch.variety] = (acc[month][batch.variety] || 0) + batch.volume;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const varietyTrendsChartData = Object.entries(varietyTrendsData)
    .map(([month, varieties]) => ({
      month,
      ...varieties,
    }))
    .slice(-12); // Last 12 months

  // Prepare quality evolution data (tasting scores over time)
  const qualityEvolutionData = tastingAnalyses
    .filter(t => t.overall_score != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(t => ({
      date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: t.overall_score,
      name: t.blend_name || t.competitor_brand || "Unknown",
    }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground px-1">Production Analytics</h2>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-success/10 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {completedBatches.length} of {batches.length} batches completed
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalProductionVolume.toFixed(1)}L</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Avg {avgBatchSize}L per batch
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-accent/10 rounded-lg flex-shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">This Year</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{currentYearBatches.length}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Batches started in {new Date().getFullYear()}
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-chart-2/10 rounded-lg flex-shrink-0">
              <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Blends</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{blendBatches.length}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Created blend batches
          </p>
        </Card>
      </div>

      {/* Production Efficiency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-warning/10 rounded-lg flex-shrink-0">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Avg Production Time</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{avgProductionDays}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Days from start to completion
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-chart-3/10 rounded-lg flex-shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-chart-3" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Active Stages</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{activeStages}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Production phases in progress
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Batches in Progress</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{batchesInProgress}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Currently active batches
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-success/10 rounded-lg flex-shrink-0">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Avg Quality Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {avgTastingScore > 0 ? avgTastingScore : "N/A"}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {tastingAnalyses.length > 0 ? `From ${tastingAnalyses.length} tastings` : "No tastings yet"}
          </p>
        </Card>
      </div>

      {/* Bottle Inventory Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-success/10 rounded-lg flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">75cl Bottles in Cellar</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{total75clBottles}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total standard bottles available
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-chart-2/10 rounded-lg flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">150cl Bottles in Cellar</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{total150clBottles}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total magnum bottles available
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-chart-1/10 rounded-lg flex-shrink-0">
              <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 text-chart-1" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Volume Bottled</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalVolumeBottled.toFixed(1)}L</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total litres in bottles
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-warning/10 rounded-lg flex-shrink-0">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Avg Blend Size</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{avgBlendSize}L</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Average volume per blend
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {stageChartData.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
              Stage Distribution
            </h3>
            <ChartContainer config={{}} className="h-[250px]">
              <PieChart>
                <Pie
                  data={stageChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {stageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </Card>
        )}

        {topVariety && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
              Variety Breakdown
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(varietyBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([variety, volume]) => {
                  const percentage = Math.round(
                    (volume / batches.reduce((sum, b) => sum + b.volume, 0)) * 100
                  );
                  return (
                    <div key={variety} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base text-foreground truncate">{variety}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-2">
                        {volume}L ({percentage}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
      </div>

      {/* Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {varietyTrendsChartData.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
              Variety Trends Over Time
            </h3>
            <ChartContainer config={{}} className="h-[250px]">
              <BarChart data={varietyTrendsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {Object.keys(varietyBreakdown).map((variety, index) => (
                  <Bar key={variety} dataKey={variety} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                ))}
              </BarChart>
            </ChartContainer>
          </Card>
        )}

        {qualityEvolutionData.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
              Quality Score Evolution
            </h3>
            <ChartContainer config={{}} className="h-[250px]">
              <LineChart data={qualityEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
              </LineChart>
            </ChartContainer>
          </Card>
        )}

        {topTastingScores.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-chart-3 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Top Tasting Scores
              </h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {topTastingScores.map((analysis, index) => {
                const getScoreColor = (score: number) => {
                  if (score >= 90) return "text-chart-3";
                  if (score >= 80) return "text-success";
                  if (score >= 70) return "text-chart-2";
                  return "text-muted-foreground";
                };
                
                return (
                  <div key={analysis.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background text-xs sm:text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base text-foreground truncate">{analysis.blend_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(analysis.overall_score)} ml-2 flex-shrink-0`}>
                      {analysis.overall_score}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <AIInsights
        batches={batches} 
        blendBatches={blendBatches} 
        tastingAnalyses={tastingAnalyses}
      />
    </div>
  );
};
