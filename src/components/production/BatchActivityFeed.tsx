import { useState, useMemo, useEffect, useRef } from 'react';
import { useBatchActivities } from '@/hooks/useBatchActivities';
import { useRealtimeActivities } from '@/hooks/useRealtimeActivities';
import { useActivityComments } from '@/hooks/useActivityComments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Filter,
  Download,
  Calendar,
  MoreVertical,
  MessageSquare,
  Copy,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  getActivityIcon,
  getActivityColor,
  getActivityTitle,
  getActivityDescription,
  copyActivityLink,
  exportActivities,
} from '@/lib/activityHelpers';
import type { Activity, ActivityComment } from '@/types/activity.types';

interface BatchActivityFeedProps {
  batchId?: string;
  className?: string;
  compact?: boolean;
}

export const BatchActivityFeed = ({ batchId, className, compact = false }: BatchActivityFeedProps) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch activities with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useBatchActivities(batchId);

  // Enable real-time updates
  useRealtimeActivities(batchId);

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Auto-load more when scrolled to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0 }
    );

    const target = loadMoreRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages of activities
  const allActivities = useMemo(() => {
    return data?.pages.flatMap((page) => page.activities) || [];
  }, [data]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.activity_type === typeFilter);
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((a) => {
        const activityDate = new Date(a.created_at);
        return activityDate.toDateString() === dateFilter.toDateString();
      });
    }

    return filtered;
  }, [allActivities, typeFilter, dateFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (dateFilter) count++;
    return count;
  }, [typeFilter, dateFilter]);

  const handleExport = () => {
    exportActivities(filteredActivities);
    toast({
      title: "Activity log exported",
      description: `Exported ${filteredActivities.length} activities`,
    });
  };

  if (isLoading) {
    return <ActivityFeedSkeleton compact={compact} />;
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load activities</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Activity Feed
          {filteredActivities.length > 0 && (
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({filteredActivities.length})
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2">
          {/* Export activities */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredActivities.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Activity Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stage_changed">Stage Changes</SelectItem>
                  <SelectItem value="measurement_added">Measurements</SelectItem>
                  <SelectItem value="note_added">Notes</SelectItem>
                  <SelectItem value="photo_uploaded">Photos</SelectItem>
                  <SelectItem value="label_printed">Labels</SelectItem>
                  <SelectItem value="exported">Exports</SelectItem>
                  <SelectItem value="cloned">Cloned</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'All Dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setDateFilter(undefined);
              }}
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </Card>
      )}

      {/* Activity timeline */}
      <ScrollArea className={cn(compact ? 'h-[400px]' : 'h-[600px]')}>
        <div className="space-y-4 pr-4">
          {filteredActivities.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {activeFilterCount > 0
                  ? 'No activities match your filters'
                  : batchId
                  ? 'No activities yet for this batch'
                  : 'No activities yet'}
              </p>
            </Card>
          ) : (
            filteredActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                compact={compact}
                isLast={index === filteredActivities.length - 1}
                user={user}
              />
            ))
          )}

          {/* Load more trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading more...</span>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Individual activity item
interface ActivityItemProps {
  activity: Activity;
  compact: boolean;
  isLast: boolean;
  user: any;
}

const ActivityItem = ({ activity, compact, isLast, user }: ActivityItemProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { addComment, isAddingComment } = useActivityComments();
  const { toast } = useToast();

  const Icon = getActivityIcon(activity.activity_type);
  const color = getActivityColor(activity.activity_type);
  const description = getActivityDescription(activity);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    addComment(
      { activityId: activity.id, comment: newComment },
      {
        onSuccess: () => {
          setNewComment('');
        },
      }
    );
  };

  const handleCopyLink = () => {
    copyActivityLink(activity.id);
    toast({
      title: "Link copied",
      description: "Activity link copied to clipboard",
    });
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-5 top-12 bottom-0 w-0.5 bg-border"
          aria-hidden="true"
        />
      )}

      <Card className="relative">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">User</span>
                    <span className="text-sm text-muted-foreground">
                      {getActivityTitle(activity.activity_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <time dateTime={activity.created_at}>
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </time>
                    <span>•</span>
                    <time dateTime={activity.created_at}>
                      {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                    </time>
                  </div>
                </div>

                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowComments(!showComments)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {showComments ? 'Hide' : 'Show'} Comments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {!compact && description && (
                <div className="text-sm text-muted-foreground mb-3">
                  {description}
                </div>
              )}

              {/* Activity-specific content */}
              <ActivityContent activity={activity} compact={compact} />

              {/* Comments section */}
              {showComments && (
                <div className="mt-4 space-y-4">
                  {/* Existing comments */}
                  {activity.comments && activity.comments.length > 0 && (
                    <div className="space-y-3">
                      {activity.comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewComment('');
                            setShowComments(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isAddingComment}
                        >
                          {isAddingComment ? 'Adding...' : 'Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Activity-specific content renderer
const ActivityContent = ({ activity, compact }: { activity: Activity; compact: boolean }) => {
  const { activity_type, activity_data } = activity;

  if (compact) return null;

  switch (activity_type) {
    case 'stage_changed':
      return (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{activity_data.fromStage}</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge>{activity_data.toStage}</Badge>
        </div>
      );

    case 'measurement_added':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {activity_data.ph && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">pH:</span>
              <span className="font-medium">{activity_data.ph}</span>
            </div>
          )}
          {activity_data.specific_gravity && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SG:</span>
              <span className="font-medium">{activity_data.specific_gravity}</span>
            </div>
          )}
          {activity_data.temperature && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Temp:</span>
              <span className="font-medium">{activity_data.temperature}°C</span>
            </div>
          )}
          {activity_data.abv && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">ABV:</span>
              <span className="font-medium">{activity_data.abv}%</span>
            </div>
          )}
        </div>
      );

    case 'note_added':
      return (
        <div className="bg-muted/50 rounded-md p-3 text-sm">
          <p className="whitespace-pre-wrap">{activity_data.note}</p>
        </div>
      );

    case 'photo_uploaded':
      return (
        <div className="mt-2">
          <img
            src={activity_data.photoUrl}
            alt="Uploaded photo"
            className="rounded-md max-w-sm w-full h-auto"
          />
        </div>
      );

    case 'label_printed':
      return (
        <div className="text-sm text-muted-foreground">
          Printed {activity_data.count} label{activity_data.count > 1 ? 's' : ''}
        </div>
      );

    case 'exported':
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{activity_data.format?.toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground">format</span>
        </div>
      );

    default:
      return null;
  }
};

// Comment item component
const CommentItem = ({ comment }: { comment: ActivityComment }) => {
  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-md p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">User</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const ActivityFeedSkeleton = ({ compact }: { compact: boolean }) => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                {!compact && <Skeleton className="h-16 w-full" />}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
