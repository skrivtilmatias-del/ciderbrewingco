import {
  Activity,
  FileText,
  Camera,
  Printer,
  QrCode,
  Download,
  Archive,
  Trash2,
  RotateCcw,
  Edit,
  ArrowRight,
  Beaker,
  Package,
  LucideIcon,
} from 'lucide-react';
import type { ActivityType, Activity as ActivityData } from '@/types/activity.types';
import { format } from 'date-fns';

export const getActivityIcon = (type: ActivityType): LucideIcon => {
  switch (type) {
    case 'created':
      return Activity;
    case 'stage_changed':
      return ArrowRight;
    case 'measurement_added':
      return Beaker;
    case 'note_added':
      return FileText;
    case 'photo_uploaded':
      return Camera;
    case 'label_printed':
      return Printer;
    case 'qr_scanned':
      return QrCode;
    case 'exported':
      return Download;
    case 'archived':
      return Archive;
    case 'deleted':
      return Trash2;
    case 'restored':
      return RotateCcw;
    case 'updated':
      return Edit;
    case 'cloned':
      return Package;
    default:
      return Activity;
  }
};

export const getActivityColor = (type: ActivityType): string => {
  switch (type) {
    case 'created':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'stage_changed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'measurement_added':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'note_added':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'photo_uploaded':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    case 'label_printed':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'qr_scanned':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    case 'exported':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'archived':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    case 'deleted':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'restored':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'updated':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'cloned':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const getActivityTitle = (type: ActivityType): string => {
  switch (type) {
    case 'created':
      return 'created batch';
    case 'stage_changed':
      return 'changed stage';
    case 'measurement_added':
      return 'added measurement';
    case 'note_added':
      return 'added note';
    case 'photo_uploaded':
      return 'uploaded photo';
    case 'label_printed':
      return 'printed labels';
    case 'qr_scanned':
      return 'scanned QR code';
    case 'exported':
      return 'exported data';
    case 'archived':
      return 'archived batch';
    case 'deleted':
      return 'deleted batch';
    case 'restored':
      return 'restored batch';
    case 'updated':
      return 'updated batch';
    case 'cloned':
      return 'cloned batch';
    default:
      return 'performed action';
  }
};

export const getActivityDescription = (activity: ActivityData): string | null => {
  const { activity_type, activity_data } = activity;

  switch (activity_type) {
    case 'stage_changed':
      return `Moved from ${activity_data.fromStage} to ${activity_data.toStage}`;
    case 'measurement_added':
      return 'Recorded new measurements for this batch';
    case 'note_added':
      return null; // Note content shown separately
    case 'label_printed':
      return `Generated ${activity_data.count} QR code label${activity_data.count > 1 ? 's' : ''}`;
    case 'exported':
      return `Downloaded batch data in ${activity_data.format?.toUpperCase()} format`;
    case 'cloned':
      return activity_data.source_batch_name ? `Created copy from ${activity_data.source_batch_name}` : 'Created batch copy';
    default:
      return null;
  }
};

export const copyActivityLink = (activityId: string) => {
  const url = `${window.location.origin}/activity/${activityId}`;
  navigator.clipboard.writeText(url);
};

export const exportActivities = (activities: ActivityData[]) => {
  // Convert activities to CSV
  const headers = ['Date', 'User', 'Type', 'Description'];
  const rows = activities.map(activity => [
    format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss'),
    activity.user_id || 'Unknown',
    getActivityTitle(activity.activity_type),
    getActivityDescription(activity) || JSON.stringify(activity.activity_data),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
