import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar, Lightbulb, LucideIcon } from "lucide-react";
import { Batch } from "./BatchCard";
import { differenceInDays, addDays, format } from "date-fns";

interface SmartInsightsProps {
  batch: Batch;
  logs: Array<{
    created_at: string;
    og?: number | null;
    fg?: number | null;
    ph?: number | null;
  }>;
}

export const SmartInsights = ({ batch, logs }: SmartInsightsProps) => {
  const insights: Array<{
    type: 'success' | 'warning' | 'info' | 'alert';
    icon: LucideIcon;
    title: string;
    description: string;
  }> = [];

  // Calculate fermentation rate
  const ogLogs = logs.filter(l => l.og).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  if (ogLogs.length >= 2) {
    const firstOG = ogLogs[0].og!;
    const latestOG = ogLogs[ogLogs.length - 1].og!;
    const daysDiff = differenceInDays(
      new Date(ogLogs[ogLogs.length - 1].created_at),
      new Date(ogLogs[0].created_at)
    );
    
    if (daysDiff > 0) {
      const gravityDrop = firstOG - latestOG;
      const dailyRate = (gravityDrop / daysDiff) * 1000; // Points per day
      
      if (dailyRate > 5) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Active Fermentation',
          description: `Fermenting at ${dailyRate.toFixed(1)} points/day. Healthy rate.`
        });
      } else if (dailyRate > 1) {
        insights.push({
          type: 'info',
          icon: TrendingDown,
          title: 'Slowing Fermentation',
          description: `Rate: ${dailyRate.toFixed(1)} points/day. May be nearing completion.`
        });
      } else if (daysDiff > 3) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Stuck Fermentation?',
          description: 'Very slow gravity drop. Consider checking temperature or nutrients.'
        });
      }

      // Estimate completion
      if (batch.target_fg && latestOG > batch.target_fg && dailyRate > 0.5) {
        const pointsToGo = (latestOG - batch.target_fg) * 1000;
        const daysToComplete = Math.ceil(pointsToGo / dailyRate);
        const estimatedDate = addDays(new Date(), daysToComplete);
        
        insights.push({
          type: 'info',
          icon: Calendar,
          title: 'Estimated Completion',
          description: `Around ${format(estimatedDate, "MMM dd")} (${daysToComplete} days)`
        });
      }
    }
  }

  // pH checks
  const phLogs = logs.filter(l => l.ph);
  if (phLogs.length > 0 && batch.target_ph) {
    const latestPH = phLogs[phLogs.length - 1].ph!;
    const diff = Math.abs(latestPH - batch.target_ph);
    
    if (diff > 0.5) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'pH Outside Target',
        description: `Current pH ${latestPH} vs target ${batch.target_ph}. Consider adjustment.`
      });
    } else if (diff <= 0.2) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'pH On Target',
        description: `pH at ${latestPH} is within ideal range.`
      });
    }
  }

  // Production time analysis
  const daysInProduction = differenceInDays(new Date(), new Date(batch.startDate));
  if (daysInProduction > 30 && batch.currentStage.includes('Fermentation')) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Extended Fermentation',
      description: `${daysInProduction} days. Consider checking if ready to rack.`
    });
  }

  // Progress-based insights
  if (batch.progress >= 80 && !batch.currentStage.includes('Bottling') && batch.currentStage !== 'Complete') {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Nearing Completion',
      description: 'Consider planning for bottling or final adjustments.'
    });
  }

  if (insights.length === 0) {
    return null;
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'alert': return 'text-destructive';
      default: return 'text-info';
    }
  };

  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'alert': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        Smart Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
            <insight.icon className={`h-4 w-4 mt-0.5 ${getIconColor(insight.type)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">{insight.title}</p>
                <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                  {insight.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
