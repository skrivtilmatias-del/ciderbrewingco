import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Download, 
  ChevronDown,
  Activity,
  FlaskConical,
  StickyNote,
  Wine,
  QrCode,
  FileDown,
  UserPlus,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useBatchActivityFeed, type ActivityItem, type ActivityFilters } from '@/hooks/production/useBatchActivityFeed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Activity icon and color mapping
 */
const activityConfig = {
  stage_change: { icon: ArrowRight, color: 'text-blue-500 bg-blue-50', label: 'Stage Change' },
  measurement: { icon: FlaskConical, color: 'text-purple-500 bg-purple-50', label: 'Measurement' },
  note: { icon: StickyNote, color: 'text-amber-500 bg-amber-50', label: 'Note' },
  blend_created: { icon: Wine, color: 'text-rose-500 bg-rose-50', label: 'Blend Created' },
  label_printed: { icon: QrCode, color: 'text-green-500 bg-green-50', label: 'Label Printed' },
  qr_scanned: { icon: QrCode, color: 'text-cyan-500 bg-cyan-50', label: 'QR Scanned' },
  export: { icon: FileDown, color: 'text-indigo-500 bg-indigo-50', label: 'Export' },
  user_assigned: { icon: UserPlus, color: 'text-teal-500 bg-teal-50', label: 'User Assigned' },
  batch_created: { icon: Activity, color: 'text-green-500 bg-green-50', label: 'Batch Created' },
  batch_updated: { icon: Activity, color: 'text-blue-500 bg-blue-50', label: 'Batch Updated' },
};

/**
 * Props for BatchActivityFeed
 */
interface BatchActivityFeedProps {
  /** Batch ID to show activities for (null = all batches) */
  batchId: string | null;
  /** Compact view for sidebars/panels */
  compact?: boolean;
  /** Maximum height of feed */
  maxHeight?: string;
}

/**
 * ActivityCard - Individual activity item display
 */
const ActivityCard = ({ 
  activity, 
  compact = false 
}: { 
  activity: ActivityItem; 
  compact?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  
  // Get user initials
  const initials = activity.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${compact ? 'p-3' : ''}`}>
      <div className="flex gap-3">
        {/* Activity Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{activity.userName}</span>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
            
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </time>
          </div>

          {/* Title */}
          <h4 className="font-medium mt-2">{activity.title}</h4>

          {/* Description */}
          {activity.description && (
            <p className={`text-sm text-muted-foreground mt-1 ${
              !expanded && !compact ? 'line-clamp-2' : ''
            }`}>
              {activity.description}
            </p>
          )}

          {/* Metadata */}
          {!compact && activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className={`mt-2 space-y-1 ${!expanded ? 'hidden' : ''}`}>
              {activity.metadata.stage && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Stage:</span>
                  <Badge variant="secondary">{activity.metadata.stage}</Badge>
                </div>
              )}
              
              {(activity.metadata.og || activity.metadata.ph || activity.metadata.temp_c) && (
                <div className="flex flex-wrap gap-3 text-sm mt-2">
                  {activity.metadata.og && (
                    <div>
                      <span className="text-muted-foreground">OG:</span>
                      <span className="ml-1 font-medium">{activity.metadata.og}</span>
                    </div>
                  )}
                  {activity.metadata.ph && (
                    <div>
                      <span className="text-muted-foreground">pH:</span>
                      <span className="ml-1 font-medium">{activity.metadata.ph}</span>
                    </div>
                  )}
                  {activity.metadata.temp_c && (
                    <div>
                      <span className="text-muted-foreground">Temp:</span>
                      <span className="ml-1 font-medium">{activity.metadata.temp_c}°C</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {activity.attachments && activity.attachments.length > 0 && (
            <div className="mt-2 flex gap-2">
              {activity.attachments.slice(0, expanded ? undefined : 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              ))}
              {!expanded && activity.attachments.length > 3 && (
                <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-sm">
                  +{activity.attachments.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse Toggle */}
          {!compact && (activity.description.length > 100 || activity.attachments?.length || Object.keys(activity.metadata).length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 h-6 text-xs"
            >
              {expanded ? 'Show Less' : 'Show More'}
              <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * BatchActivityFeed - Main activity feed component
 * 
 * Displays a chronological feed of all batch activities with:
 * - Infinite scroll
 * - Real-time updates
 * - Advanced filtering
 * - Compact/full view modes
 */
export const BatchActivityFeed = ({
  batchId,
  compact = false,
  maxHeight = 'calc(100vh - 300px)',
}: BatchActivityFeedProps) => {
  const [filters, setFilters] = useState<ActivityFilters>({
    types: [],
    dateRange: {},
    searchQuery: '',
  });

  const {
    activities,
    totalCount,
    hasMore,
    loadMore,
    isLoading,
  } = useBatchActivityFeed(batchId, filters);

  // Refs for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Infinite scroll observer
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, loadMore, isLoading]);

  /**
   * Toggle activity type filter
   */
  const toggleActivityType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type as any)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type as any],
    }));
  };

  /**
   * Export feed as PDF
   */
  const handleExport = () => {
    // TODO: Implement PDF export
    console.log('Export activity feed as PDF');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Activity Feed</h3>
            <Badge variant="secondary">{totalCount} activities</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {filters.types.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.types.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Activity Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(activityConfig).map(([type, config]) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filters.types.includes(type as any)}
                    onCheckedChange={() => toggleActivityType(type)}
                  >
                    <config.icon className="mr-2 h-4 w-4" />
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div 
        ref={containerRef}
        className="space-y-3 overflow-y-auto pr-2"
        style={{ maxHeight }}
      >
        {activities.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {filters.types.length > 0 || filters.searchQuery
                ? 'No activities match your filters'
                : 'No activities yet'}
            </p>
          </Card>
        ) : (
          <>
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <ActivityCard activity={activity} compact={compact} />
                
                {/* Date separator */}
                {index < activities.length - 1 && (
                  (() => {
                    const currentDate = new Date(activity.timestamp).toDateString();
                    const nextDate = new Date(activities[index + 1].timestamp).toDateString();
                    
                    if (currentDate !== nextDate) {
                      return (
                        <div className="flex items-center gap-3 my-4">
                          <Separator className="flex-1" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {nextDate}
                          </span>
                          <Separator className="flex-1" />
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* End of feed */}
            {!hasMore && activities.length > 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  You've reached the end of the activity feed
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
