import { useState, startTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Search } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { TastingAnalysisCard } from '@/components/TastingAnalysisCard';
import { TastingAnalysisDialog } from '@/components/TastingAnalysisDialog';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errorHandler';

interface TastingTabProps {
  blendBatches: any[];
}

export const TastingTab = ({ blendBatches }: TastingTabProps) => {
  const queryClient = useQueryClient();
  const { tastingSearchQuery, setTastingSearchQuery } = useAppStore();
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const [editingTasting, setEditingTasting] = useState<any>(null);

  // Fetch tasting analyses
  const { data: tastingAnalyses = [], isLoading, error } = useQuery({
    queryKey: ['tasting-analyses'],
    queryFn: async () => {
      const { data: tastingData, error: tastingError } = await supabase
        .from('tasting_analysis')
        .select(`
          id,
          blend_batch_id,
          competitor_brand,
          user_id,
          taste,
          colour,
          palate,
          overall_score,
          notes,
          created_at,
          blend_batches:blend_batch_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (tastingError) throw tastingError;

      // Handle empty data
      if (!tastingData || tastingData.length === 0) return [];

      // Fetch all unique user profiles
      const userIds = [...new Set(tastingData.map((t: any) => t.user_id).filter(Boolean))];
      
      if (userIds.length === 0) {
        // If no user IDs, return data without user names
        return tastingData.map((analysis: any) => ({
          ...analysis,
          blend_name: analysis.competitor_brand 
            ? `${analysis.competitor_brand} (Competitor)` 
            : (analysis.blend_batches?.name || 'Unknown Blend'),
          user_name: 'Unknown User',
        }));
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue without user names rather than failing
      }

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(
        profilesData?.map((p: any) => [p.id, p.full_name]) || []
      );

      const formattedAnalyses = tastingData.map((analysis: any) => ({
        ...analysis,
        blend_name: analysis.competitor_brand 
          ? `${analysis.competitor_brand} (Competitor)` 
          : (analysis.blend_batches?.name || 'Unknown Blend'),
        user_name: profilesMap.get(analysis.user_id) || 'Unknown User',
      }));

      return formattedAnalyses;
    },
  });

  // Save tasting mutation
  const saveTastingMutation = useMutation({
    mutationFn: async ({ data, analysisId }: { data: any; analysisId?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again');

      if (analysisId) {
        // Update existing analysis
        const { error } = await supabase
          .from('tasting_analysis')
          .update({
            blend_batch_id: data.blend_batch_id || null,
            competitor_brand: data.competitor_brand || null,
            taste: data.taste || null,
            colour: data.colour || null,
            palate: data.palate || null,
            overall_score: data.overall_score || null,
            notes: data.notes || null,
            attachments: data.attachments || null,
          })
          .eq('id', analysisId);

        if (error) throw error;
      } else {
        // Create new analysis
        const { error } = await supabase
          .from('tasting_analysis')
          .insert([{
            user_id: session.user.id,
            blend_batch_id: data.blend_batch_id || null,
            competitor_brand: data.competitor_brand || null,
            taste: data.taste || null,
            colour: data.colour || null,
            palate: data.palate || null,
            overall_score: data.overall_score || null,
            notes: data.notes || null,
            attachments: data.attachments || null,
          }]);

        if (error) throw error;
      }

      // If tasting has attachments and a blend_batch_id, add them to the blend batch
      if (data.attachments && data.attachments.length > 0 && data.blend_batch_id) {
        const { data: blendData } = await supabase
          .from('blend_batches')
          .select('attachments')
          .eq('id', data.blend_batch_id)
          .single();

        if (blendData) {
          const existingAttachments = blendData.attachments || [];
          const newAttachments = data.attachments.filter(
            (att: string) => !existingAttachments.includes(att)
          );

          if (newAttachments.length > 0) {
            await supabase
              .from('blend_batches')
              .update({
                attachments: [...existingAttachments, ...newAttachments]
              })
              .eq('id', data.blend_batch_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasting-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['blend-batches'] }); // Also invalidate blends as they may have new attachments
      toast.success(editingTasting ? 'Tasting analysis updated' : 'Tasting analysis saved');
      setTastingDialogOpen(false);
      setEditingTasting(null);
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  // Delete tasting mutation
  const deleteTastingMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('tasting_analysis')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasting-analyses'] });
      toast.success('Tasting analysis deleted');
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyError(error));
    },
  });

  const handleSaveTasting = async (data: any, analysisId?: string) => {
    saveTastingMutation.mutate({ data, analysisId });
  };

  const handleDeleteTasting = async (analysisId: string) => {
    if (!confirm('Delete this tasting analysis?')) return;
    deleteTastingMutation.mutate(analysisId);
  };

  const handleEditTasting = (analysis: any) => {
    setEditingTasting(analysis);
    startTransition(() => setTastingDialogOpen(true));
  };

  // Filter analyses based on search query
  const filteredAnalyses = tastingAnalyses.filter((analysis) => {
    if (!tastingSearchQuery) return true;
    const query = tastingSearchQuery.toLowerCase();
    return (
      analysis.blend_name?.toLowerCase().includes(query) ||
      analysis.user_name?.toLowerCase().includes(query) ||
      analysis.notes?.toLowerCase().includes(query) ||
      analysis.taste?.toLowerCase().includes(query) ||
      analysis.colour?.toLowerCase().includes(query) ||
      analysis.palate?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative w-full sm:w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasting analyses..."
          value={tastingSearchQuery}
          onChange={(e) => setTastingSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Tasting Analyses Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAnalyses.length === 0 ? (
          <Card className="col-span-full p-12 text-center border-dashed">
            {tastingSearchQuery ? (
              <p className="text-muted-foreground">No tasting analyses match your search.</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Award className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-muted-foreground mb-1">
                    No tasting analyses yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create a tasting analysis to record your evaluations
                  </p>
                </div>
              </div>
            )}
          </Card>
        ) : (
          filteredAnalyses.map((analysis) => (
            <TastingAnalysisCard
              key={analysis.id}
              analysis={analysis}
              onEdit={() => handleEditTasting(analysis)}
              onDelete={() => handleDeleteTasting(analysis.id)}
            />
          ))
        )}
        </div>
      )}

      {/* Tasting Analysis Dialog */}
      <TastingAnalysisDialog
        open={tastingDialogOpen}
        onOpenChange={(open) => {
          setTastingDialogOpen(open);
          if (!open) setEditingTasting(null);
        }}
        onSave={handleSaveTasting}
        blendBatches={blendBatches}
        existingAnalysis={editingTasting}
      />
    </div>
  );
};
