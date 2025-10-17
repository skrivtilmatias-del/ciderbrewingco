import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Droplets, TrendingUp, Calendar, Package, Download } from "lucide-react";
import { ExportDialog } from "@/components/production/ExportDialog";
import type { Batch } from "@/types/batch.types";

interface BatchProductionHeaderProps {
  batch: Batch;
  allBatches?: Batch[];
}

export const BatchProductionHeader = ({ batch, allBatches = [] }: BatchProductionHeaderProps) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const getDaysInProduction = () => {
    const start = new Date(batch.started_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const metrics = [
    {
      icon: Activity,
      label: "Current Stage",
      value: batch.current_stage,
      bgColor: "bg-orange-50 dark:bg-orange-950",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: Droplets,
      label: "Total Volume",
      value: `${batch.volume}L`,
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: TrendingUp,
      label: "Progress",
      value: `${batch.progress}%`,
      bgColor: "bg-green-50 dark:bg-green-950",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: Calendar,
      label: "Days in Production",
      value: getDaysInProduction().toString(),
      bgColor: "bg-purple-50 dark:bg-purple-950",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: Package,
      label: "Variety",
      value: batch.variety,
      bgColor: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <>
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        batches={allBatches}
        selectedBatches={[batch]}
      />

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{batch.name}</h2>
            <p className="text-sm text-muted-foreground">Production Overview</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${metric.bgColor} flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1 truncate">{metric.label}</p>
                    <p className="text-lg font-bold truncate" title={metric.value}>{metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
};
