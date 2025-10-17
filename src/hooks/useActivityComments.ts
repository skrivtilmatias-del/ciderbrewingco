import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Activity } from '@/types/activity.types';

export const useActivityComments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addComment = useMutation({
    mutationFn: async ({ activityId, comment }: { activityId: string; comment: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_comments')
        .insert([
          {
            activity_id: activityId,
            user_id: user.id,
            comment: comment.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(['batch-activities'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            activities: page.activities.map((activity: Activity) =>
              activity.id === variables.activityId
                ? {
                    ...activity,
                    comments: [...(activity.comments || []), data],
                  }
                : activity
            ),
          })),
        };
      });

      toast({
        title: "Comment added",
      });
    },

    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return commentId;
    },

    onSuccess: (commentId) => {
      // Update cache
      queryClient.setQueryData(['batch-activities'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            activities: page.activities.map((activity: Activity) => ({
              ...activity,
              comments: activity.comments?.filter((c) => c.id !== commentId) || [],
            })),
          })),
        };
      });

      toast({
        title: "Comment deleted",
      });
    },
  });

  return {
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    isAddingComment: addComment.isPending,
    isDeletingComment: deleteComment.isPending,
  };
};
