import { Clock, AlertTriangle, XCircle, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ProductionAlert } from '@/types/production-metrics.types';

interface AlertsPanelProps {
  alerts: ProductionAlert[];
  onAlertClick: (alert: ProductionAlert) => void;
}

export const AlertsPanel = ({ alerts, onAlertClick }: AlertsPanelProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return Clock;
      case 'action_needed':
        return AlertTriangle;
      case 'quality_issue':
        return XCircle;
      case 'capacity_warning':
        return TrendingUp;
      default:
        return AlertCircle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
        <p className="text-sm font-medium">No Active Alerts</p>
        <p className="text-xs text-muted-foreground mt-1">All batches are on track</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.type);
        return (
          <div
            key={alert.id}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
              getSeverityColor(alert.severity)
            )}
            onClick={() => onAlertClick(alert)}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  {alert.batchNumber && (
                    <Badge variant="outline" className="text-xs">
                      {alert.batchNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-xs mb-2">{alert.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{alert.actionRequired}</p>
                  {alert.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(alert.dueDate, { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
