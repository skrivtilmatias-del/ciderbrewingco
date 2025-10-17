import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ActivityType } from '@/types/activity.types';

interface LogActivityParams {
  batchId: string;
  activityType: ActivityType;
  activityData: Record<string, any>;
  skipToast?: boolean;
}

export const useActivityLogger = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const logActivity = useMutation({
    mutationFn: async ({ batchId, activityType, activityData }: LogActivityParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batch_activities')
        .insert([
          {
            batch_id: batchId,
            user_id: user.id,
            activity_type: activityType,
            activity_data: activityData,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: (data, variables) => {
      // Invalidate activity queries
      queryClient.invalidateQueries({ queryKey: ['batch-activities', variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ['all-activities'] });

      // Show toast for important activities
      if (!variables.skipToast) {
        const message = getActivityMessage(variables.activityType, variables.activityData);
        if (message) {
          toast({
            title: "Activity logged",
            description: message,
          });
        }
      }
    },

    onError: (error) => {
      console.error('Failed to log activity:', error);
      // Silent fail - don't disrupt user experience
    },
  });

  // Convenience methods for common activities
  return {
    logActivity: logActivity.mutate,
    logStageChange: (batchId: string, fromStage: string, toStage: string) => {
      logActivity.mutate({
        batchId,
        activityType: 'stage_changed',
        activityData: { fromStage, toStage },
      });
    },
    logMeasurement: (batchId: string, measurement: any) => {
      logActivity.mutate({
        batchId,
        activityType: 'measurement_added',
        activityData: measurement,
      });
    },
    logNote: (batchId: string, note: string) => {
      logActivity.mutate({
        batchId,
        activityType: 'note_added',
        activityData: { note },
      });
    },
    logPhotoUpload: (batchId: string, photoUrl: string) => {
      logActivity.mutate({
        batchId,
        activityType: 'photo_uploaded',
        activityData: { photoUrl },
      });
    },
    logLabelPrint: (batchId: string, count: number) => {
      logActivity.mutate({
        batchId,
        activityType: 'label_printed',
        activityData: { count },
      });
    },
    logExport: (batchId: string, format: string) => {
      logActivity.mutate({
        batchId,
        activityType: 'exported',
        activityData: { format },
      });
    },
  };
};

const getActivityMessage = (type: ActivityType, data: Record<string, any>): string | null => {
  switch (type) {
    case 'stage_changed':
      return `Stage updated: ${data.fromStage} → ${data.toStage}`;
    case 'measurement_added':
      return 'Measurement recorded';
    case 'note_added':
      return 'Note added';
    case 'label_printed':
      return `${data.count} label${data.count > 1 ? 's' : ''} printed`;
    default:
      return null;
  }
};
