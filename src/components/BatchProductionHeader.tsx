import { Card, CardContent } from "@/components/ui/card";
import { Activity, Droplets, TrendingUp, Calendar, Package } from "lucide-react";
import { Batch } from "./BatchCard";

interface BatchProductionHeaderProps {
  batch: Batch;
}

export const BatchProductionHeader = ({ batch }: BatchProductionHeaderProps) => {
  const getDaysInProduction = () => {
    const start = new Date(batch.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const metrics = [
    {
      icon: Activity,
      label: "Current Stage",
      value: batch.currentStage,
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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{batch.name}</h2>
        <p className="text-muted-foreground">Production Overview</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold truncate">{metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
