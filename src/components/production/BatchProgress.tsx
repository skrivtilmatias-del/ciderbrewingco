import { format, formatDistance } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Batch } from "@/components/BatchCard";
import {
  calculateProgress,
  getDaysInStage,
  getEstimatedCompletionDate,
  getNextMilestone,
  needsAction,
  getColorForStatus,
  EXPECTED_DURATIONS,
  type ProgressCalculation,
} from "@/lib/progressUtils";
import { CircularProgress } from "./CircularProgress";
import { LinearProgress } from "./LinearProgress";

/**
 * ProgressTooltipContent - Detailed progress information for tooltip
 */
const ProgressTooltipContent = ({
  progress,
  batch,
}: {
  progress: ProgressCalculation;
  batch: Batch;
}) => {
  const colors = getColorForStatus(progress.status);
  const daysInStage = getDaysInStage(batch);
  const expectedDuration = EXPECTED_DURATIONS[batch.currentStage]?.typical || 1;

  return (
    <div className="space-y-2 p-2 min-w-[200px]">
      <div className="font-semibold">{batch.name}</div>
      <Separator />
      <div className="grid gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Stage:</span>
          <span className="font-medium">{batch.currentStage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Days in Stage:</span>
          <span className="font-medium">{daysInStage} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expected:</span>
          <span className="font-medium">{expectedDuration} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Progress:</span>
          <span className="font-medium">
            {Math.round(progress.overallProgress)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <Badge className={cn("text-xs", colors.bgClass, colors.textClass)} variant="secondary">
            {progress.status}
          </Badge>
        </div>
        {progress.status !== 'on-track' && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Variance:</span>
            <span
              className={cn(
                "font-medium",
                progress.daysAhead > 0 ? "text-blue-600" : "text-orange-600"
              )}
            >
              {progress.daysAhead > 0 ? '+' : ''}
              {progress.daysAhead} days
            </span>
          </div>
        )}
      </div>
      <Separator />
      <div className="text-xs text-muted-foreground">
        Est. completion: {format(getEstimatedCompletionDate(batch), 'MMM dd, yyyy')}
      </div>
    </div>
  );
};

/**
 * ProgressBadge - Status badges for batch progress
 */
export const ProgressBadge = ({ batch }: { batch: Batch }) => {
  const progress = calculateProgress(batch);
  const actionStatus = needsAction(batch);
  const badges = [];

  // Overdue badge - only show when it makes sense
  if (progress.status === 'overdue') {
    badges.push(
      <Badge
        key="overdue"
        variant="destructive"
        className="animate-pulse gap-1"
      >
        <AlertCircle className="h-3 w-3" />
        {-progress.daysAhead}d Overdue
      </Badge>
    );
  }

  // Behind schedule
  if (progress.status === 'behind') {
    badges.push(
      <Badge
        key="behind"
        variant="secondary"
        className="bg-orange-100 text-orange-700 gap-1"
      >
        <Clock className="h-3 w-3" />
        {-progress.daysAhead}d Behind
      </Badge>
    );
  }

  // Ahead of schedule
  if (progress.status === 'ahead') {
    badges.push(
      <Badge
        key="ahead"
        variant="secondary"
        className="bg-blue-100 text-blue-700 gap-1"
      >
        <Zap className="h-3 w-3" />
        {progress.daysAhead}d Ahead
      </Badge>
    );
  }

  // Action needed with specific reason
  if (actionStatus.needed) {
    badges.push(
      <Badge
        key="action"
        variant="secondary"
        className="bg-yellow-100 text-yellow-700 gap-1 cursor-help"
        title={actionStatus.reason || 'Action needed'}
      >
        <Bell className="h-3 w-3" />
        Action Needed
      </Badge>
    );
  }

  // Completion badge
  if (progress.overallProgress === 100 || batch.currentStage === 'Complete') {
    badges.push(
      <Badge
        key="complete"
        variant="secondary"
        className="bg-green-100 text-green-700 gap-1"
      >
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </Badge>
    );
  }

  return <div className="flex gap-2 flex-wrap">{badges}</div>;
};

/**
 * BatchProgressMini - Minimal progress indicator for list view
 */
export const BatchProgressMini = ({ batch }: { batch: Batch }) => {
  const progress = calculateProgress(batch);

  return (
    <div className="cursor-help" title={`${batch.name} • ${batch.currentStage} • ${Math.round(progress.overallProgress)}%`}>
      <CircularProgress
        progress={progress.overallProgress}
        size={40}
        strokeWidth={4}
        showText={false}
      />
    </div>
  );
};

/**
 * BatchProgressCard - Medium progress indicator for grid view
 */
export const BatchProgressCard = ({ batch }: { batch: Batch }) => {
  const progress = calculateProgress(batch);

  return (
    <div className="space-y-3">
      {/* Status badges */}
      <ProgressBadge batch={batch} />

      {/* Linear progress bar */}
      <LinearProgress progress={progress.overallProgress} compact />
    </div>
  );
};

/**
 * MetricCard - Small metric display card
 */
const MetricCard = ({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-lg font-bold">{value}</div>
    {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
  </div>
);

/**
 * BatchProgressDetailed - Full progress view for details panel
 */
export const BatchProgressDetailed = ({ batch }: { batch: Batch }) => {
  const progress = calculateProgress(batch);
  const daysInStage = getDaysInStage(batch);
  const expectedDuration = EXPECTED_DURATIONS[batch.currentStage]?.typical || 1;
  const estimatedCompletion = getEstimatedCompletionDate(batch);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Current Stage"
            value={batch.currentStage}
            icon={<Activity className="w-4 h-4" />}
          />
          <MetricCard
            label="Days in Stage"
            value={daysInStage}
            subtitle={`Expected: ${expectedDuration}d`}
          />
          <MetricCard
            label="Overall Progress"
            value={`${Math.round(progress.overallProgress)}%`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            label="Est. Completion"
            value={format(estimatedCompletion, 'MMM dd')}
            subtitle={formatDistance(estimatedCompletion, new Date(), {
              addSuffix: true,
            })}
          />
        </div>

        {/* Timeline progress */}
        <div className="space-y-2">
          <Label>Stage Timeline</Label>
          <LinearProgress progress={progress.overallProgress} showLabels />
        </div>

        {/* Status alerts */}
        {progress.status === 'overdue' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Batch Overdue</AlertTitle>
            <AlertDescription>
              This batch is {-progress.daysAhead} days past expected completion.
              Consider reviewing the batch status.
            </AlertDescription>
          </Alert>
        )}

        {progress.status === 'ahead' && (
          <Alert className="border-blue-200 bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Ahead of Schedule</AlertTitle>
            <AlertDescription className="text-blue-700">
              This batch is {progress.daysAhead} days ahead of typical timeline.
              Great work!
            </AlertDescription>
          </Alert>
        )}

        {/* Next milestone */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Next Milestone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getNextMilestone(batch)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
