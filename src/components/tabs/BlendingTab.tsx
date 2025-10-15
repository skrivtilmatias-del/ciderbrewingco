import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wine, Apple } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBlends } from '@/hooks/useBlends';
import { BlendBatchCard } from '@/components/BlendBatchCard';
import { NewBlendDialog } from '@/components/NewBlendDialog';
import type { Batch } from '@/components/BatchCard';

interface BlendingTabProps {
  batches: Batch[];
  blendBatches: any[];
}

export const BlendingTab = ({ batches, blendBatches }: BlendingTabProps) => {
  const { 
    blendSearchQuery, 
    setSelectedBlend,
    setBlendDetailsOpen 
  } = useAppStore();
  const { deleteBlend } = useBlends();

  // Calculate batch usage and remaining volumes
  const batchUsageInfo = useMemo(() => {
    return batches.map(batch => {
      const volumeUsedInBlends = blendBatches.reduce((total, blend) => {
        // Ensure components array exists
        if (!blend.components || !Array.isArray(blend.components)) {
          return total;
        }
        
        const componentVolume = blend.components
          .filter((comp: any) => comp.source_batch_id === batch.id)
          .reduce((sum: number, comp: any) => {
            const volume = typeof comp.volume_liters === 'number' 
              ? comp.volume_liters 
              : parseFloat(comp.volume_liters || '0') || 0;
            const spillage = typeof comp.spillage === 'number'
              ? comp.spillage
              : parseFloat(comp.spillage || '0') || 0;
            return sum + volume + spillage; // Include spillage in total usage
          }, 0);
        return total + componentVolume;
      }, 0);
      
      const remainingVolume = Math.max(0, batch.volume - volumeUsedInBlends);
      const usagePercentage = batch.volume > 0 
        ? Math.min(100, (volumeUsedInBlends / batch.volume) * 100)
        : 0;
      
      return {
        ...batch,
        volumeUsed: volumeUsedInBlends,
        volumeRemaining: remainingVolume,
        usagePercentage,
        isAvailable: remainingVolume > 0.1
      };
    }).sort((a, b) => b.volumeRemaining - a.volumeRemaining);
  }, [batches, blendBatches]);

  // Calculate available batches (exclude those fully used in blends)
  const availableBatchesForBlending = useMemo(() => {
    return batchUsageInfo
      .filter(b => b.isAvailable)
      .map(b => ({ id: b.id, name: b.name, variety: b.variety }));
  }, [batchUsageInfo]);

  // Filter blends based on search query
  const filteredBlends = blendBatches.filter((blend) => {
    if (!blendSearchQuery) return true;
    const query = blendSearchQuery.toLowerCase();
    return (
      blend.name?.toLowerCase().includes(query) ||
      blend.notes?.toLowerCase().includes(query) ||
      blend.components?.some((c: any) => 
        c.batch_name?.toLowerCase().includes(query) ||
        c.batch_variety?.toLowerCase().includes(query)
      )
    );
  });

  const handleBlendClick = (blend: any) => {
    setSelectedBlend(blend);
    setBlendDetailsOpen(true);
  };

  const handleDeleteBlend = async (blendId: string) => {
    if (!confirm("Delete this blend batch?")) return;
    deleteBlend(blendId);
  };

  return (
    <div className="space-y-6">
      {/* Available for Blending Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Apple className="h-5 w-5 text-primary" />
          Available for Blending
        </h3>
        <div className="space-y-3">
          {batchUsageInfo
            .filter(b => b.isAvailable)
            .slice(0, 5)
            .map((batch) => (
              <div key={batch.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{batch.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {batch.variety}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {batch.volumeRemaining.toFixed(1)}L / {batch.volume.toFixed(1)}L
                  </span>
                </div>
                <Progress value={batch.usagePercentage} className="h-2" />
              </div>
            ))}
          {batchUsageInfo.filter(b => b.isAvailable).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No batches available for blending
            </p>
          )}
        </div>
      </Card>

      {/* Blends Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            Blend Batches
          </h3>
          <NewBlendDialog 
            availableBatches={availableBatchesForBlending}
            onBlendCreated={() => {
              // Refresh handled by React Query
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBlends.length === 0 ? (
            <Card className="col-span-full p-12 text-center border-dashed">
              {blendSearchQuery ? (
                <p className="text-muted-foreground">No blends match your search.</p>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Wine className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">
                      No blend batches yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create a blend batch to combine your cider batches
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            filteredBlends.map((blend) => (
              <BlendBatchCard
                key={blend.id}
                blend={blend}
                onClick={() => handleBlendClick(blend)}
                onDelete={() => handleDeleteBlend(blend.id)}
                onAddTastingNote={(blendId) => {
                  // Handle tasting note - could be integrated if needed
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
