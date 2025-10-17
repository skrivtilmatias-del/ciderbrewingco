import { ArrowRight, CheckCircle2, Package, Activity, Circle, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Milestone } from '@/types/production-metrics.types';

interface MilestonesTimelineProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
}

export const MilestonesTimeline = ({ milestones, onMilestoneClick }: MilestonesTimelineProps) => {
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'stage_change':
        return ArrowRight;
      case 'completion':
        return CheckCircle2;
      case 'bottling':
        return Package;
      case 'measurement':
        return Activity;
      default:
        return Circle;
    }
  };

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CalendarIcon className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No Upcoming Milestones</p>
        <p className="text-xs text-muted-foreground mt-1">All batches are ahead of schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
      {milestones.map((milestone, index) => {
        const Icon = getMilestoneIcon(milestone.type);
        return (
          <div
            key={milestone.id}
            className="flex items-start gap-3 cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors -ml-2"
            onClick={() => onMilestoneClick(milestone)}
          >
            {/* Timeline Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  milestone.isOverdue
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    : 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              {index < milestones.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2 min-h-[20px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold">{milestone.description}</p>
                <Badge variant={milestone.isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                  {milestone.batchNumber}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarIcon className="w-3 h-3" />
                <span>
                  {milestone.isOverdue
                    ? `Overdue by ${Math.abs(milestone.daysUntil)} days`
                    : milestone.daysUntil === 0
                    ? 'Today'
                    : milestone.daysUntil === 1
                    ? 'Tomorrow'
                    : `In ${milestone.daysUntil} days`}
                </span>
                <span className="text-muted-foreground">•</span>
                <span>{format(milestone.dueDate, 'MMM d')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
