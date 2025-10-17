import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Batch } from "@/components/BatchCard";
import { calculateProgress } from "@/lib/progressUtils";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ProgressOverviewProps {
  batches: Batch[];
  className?: string;
}

/**
 * ProgressOverview - Analytics dashboard showing progress statistics
 * 
 * Displays:
 * - On track count
 * - Ahead count
 * - Behind count
 * - Overdue count
 * - Average progress
 */
export const ProgressOverview = ({ batches, className }: ProgressOverviewProps) => {
  const stats = useMemo(() => {
    if (batches.length === 0) {
      return {
        onTrack: 0,
        ahead: 0,
        behind: 0,
        overdue: 0,
        averageProgress: 0,
      };
    }

    const progressData = batches.map(calculateProgress);

    return {
      onTrack: progressData.filter((p) => p.status === "on-track").length,
      ahead: progressData.filter((p) => p.status === "ahead").length,
      behind: progressData.filter((p) => p.status === "behind").length,
      overdue: progressData.filter((p) => p.status === "overdue").length,
      averageProgress:
        progressData.reduce((sum, p) => sum + p.overallProgress, 0) /
        batches.length,
    };
  }, [batches]);

  const statCards = [
    {
      label: "On Track",
      value: stats.onTrack,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      progressColor: "bg-green-500",
      borderColor: "border-green-200",
    },
    {
      label: "Ahead",
      value: stats.ahead,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      progressColor: "bg-blue-500",
      borderColor: "border-blue-200",
    },
    {
      label: "Behind",
      value: stats.behind,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      progressColor: "bg-orange-500",
      borderColor: "border-orange-200",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      progressColor: "bg-red-500",
      borderColor: "border-red-200",
    },
    {
      label: "Avg Progress",
      value: `${Math.round(stats.averageProgress)}%`,
      icon: TrendingDown,
      color: "text-primary",
      bgColor: "bg-primary/5",
      progressColor: "bg-primary",
      borderColor: "border-primary/20",
      showProgress: true,
      progressValue: stats.averageProgress,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={cn("border-2 transition-all hover:shadow-md", stat.borderColor)}
          >
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    stat.bgColor
                  )}
                >
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className={cn("text-3xl font-bold", stat.color)}>
                  {stat.value}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                {stat.showProgress ? (
                  <Progress
                    value={stat.progressValue}
                    className="mt-2 h-1.5"
                  />
                ) : (
                  <Progress
                    value={100}
                    className={cn("mt-2 h-1.5", stat.progressColor)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
