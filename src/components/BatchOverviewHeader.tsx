import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Batch } from "./BatchCard";
import { Droplets, FlaskConical, Thermometer, Calendar, TrendingUp, TrendingDown, AlertCircle, Edit, ExternalLink, Download } from "lucide-react";
import { differenceInDays } from "date-fns";

interface BatchOverviewHeaderProps {
  batch: Batch;
  latestMeasurements?: {
    og?: number;
    fg?: number;
    ph?: number;
    temp_c?: number;
  };
  onEditClick: () => void;
  onViewDetails: () => void;
}

export const BatchOverviewHeader = ({ 
  batch, 
  latestMeasurements,
  onEditClick,
  onViewDetails 
}: BatchOverviewHeaderProps) => {
  const daysInProduction = differenceInDays(new Date(), new Date(batch.startDate));
  
  const getTargetStatus = (current: number | undefined, target: number | undefined) => {
    if (!current || !target) return null;
    const diff = Math.abs(current - target);
    const percentDiff = (diff / target) * 100;
    
    if (percentDiff <= 5) return { status: "good", icon: TrendingUp, color: "text-success" };
    if (percentDiff <= 10) return { status: "warning", icon: AlertCircle, color: "text-warning" };
    return { status: "alert", icon: TrendingDown, color: "text-destructive" };
  };

  const ogStatus = getTargetStatus(latestMeasurements?.og, batch.target_og);
  const phStatus = getTargetStatus(latestMeasurements?.ph, batch.target_ph);

  return (
    <Card className="p-4 sm:p-6 border-2">
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{batch.name}</h2>
            <p className="text-sm text-muted-foreground">{batch.variety}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Details
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Volume
            </p>
            <p className="text-lg font-semibold">{batch.volume}L</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Days in Production
            </p>
            <p className="text-lg font-semibold">{daysInProduction} days</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Stage</p>
            <Badge className="text-xs">{batch.currentStage}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Progress</p>
            <div className="flex items-center gap-2">
              <Progress value={batch.progress} className="h-2 flex-1" />
              <span className="text-sm font-semibold">{batch.progress}%</span>
            </div>
          </div>
        </div>

        {/* Target vs Actual */}
        {(batch.target_og || batch.target_ph || latestMeasurements?.temp_c) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
            {batch.target_og && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">OG</span>
                  {ogStatus && <ogStatus.icon className={`h-4 w-4 ${ogStatus.color}`} />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">
                    {latestMeasurements?.og 
                      ? latestMeasurements.og >= 1.5 
                        ? Math.round(latestMeasurements.og) 
                        : Math.round((latestMeasurements.og - 1) * 1000) + 1000
                      : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {batch.target_og >= 1.5 ? Math.round(batch.target_og) : Math.round((batch.target_og - 1) * 1000) + 1000}
                  </span>
                </div>
              </div>
            )}

            {batch.target_ph && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">pH Level</span>
                  {phStatus && <phStatus.icon className={`h-4 w-4 ${phStatus.color}`} />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{latestMeasurements?.ph || "—"}</span>
                  <span className="text-xs text-muted-foreground">/ {batch.target_ph}</span>
                </div>
              </div>
            )}

            {latestMeasurements?.temp_c && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Temperature</span>
                  <Thermometer className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{latestMeasurements.temp_c}°C</span>
                  {batch.target_temp_c && (
                    <span className="text-xs text-muted-foreground">/ {batch.target_temp_c}°C</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
