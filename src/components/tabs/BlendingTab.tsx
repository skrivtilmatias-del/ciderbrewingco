import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Wine, Apple, Search, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showAllBatches, setShowAllBatches] = useState(false);
  const { 
    blendSearchQuery,
    setBlendSearchQuery, 
    setSelectedBlendId,
    setBlendDetailsOpen 
  } = useAppStore();
  const { deleteBlend, createBlend, isLoading, isDeleting } = useBlends();

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
            const vol = typeof comp.volume_liters === 'number'
              ? comp.volume_liters
              : parseFloat(comp.volume_liters || '0') || 0;
            const perc = typeof comp.percentage === 'number'
              ? comp.percentage
              : parseFloat(comp.percentage || '0') || 0;
            const blendTotal = typeof blend.total_volume === 'number'
              ? blend.total_volume
              : parseFloat(blend.total_volume || '0') || 0;
            // Prefer explicit volume; if missing, derive from percentage of the blend total
            const derivedVol = vol > 0 ? vol : (perc > 0 ? (perc / 100) * blendTotal : 0);
            const spillage = typeof comp.spillage === 'number'
              ? comp.spillage
              : parseFloat(comp.spillage || '0') || 0;
            return sum + derivedVol + spillage; // Include spillage in total usage
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
    setSelectedBlendId(blend.id);
    setBlendDetailsOpen(true);
  };

  const handleDeleteBlend = async (blendId: string) => {
    if (!confirm("Delete this blend batch?")) return;
    deleteBlend(blendId);
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Usage Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Apple className="h-5 w-5 text-primary" />
          Available for Blending ({batchUsageInfo.filter(b => b.isAvailable).length} batches)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {batchUsageInfo
            .filter(b => b.isAvailable)
            .slice(0, showAllBatches ? undefined : 10)
            .map((batch) => (
              <div key={batch.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium truncate">{batch.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {batch.variety}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">
                    {batch.volumeRemaining.toFixed(1)}L / {batch.volume.toFixed(1)}L
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={batch.usagePercentage} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground min-w-[35px] text-right">
                    {batch.usagePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
        
        {batchUsageInfo.filter(b => b.isAvailable).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No batches available for blending
          </p>
        )}
        
        {batchUsageInfo.filter(b => b.isAvailable).length > 10 && (
          <div className="flex justify-center pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllBatches(!showAllBatches)}
              className="text-xs"
            >
              {showAllBatches ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  + {batchUsageInfo.filter(b => b.isAvailable).length - 10} more batches available
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Blends Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              Blend Batches
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blends..."
                value={blendSearchQuery}
                onChange={(e) => setBlendSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <NewBlendDialog 
              availableBatches={availableBatchesForBlending}
              onBlendCreated={(data) => {
                createBlend({
                  name: data.name,
                  total_volume: data.total_volume,
                  storage_location: data.storage_location || undefined,
                  bottles_75cl: data.bottles_75cl ?? 0,
                  bottles_150cl: data.bottles_150cl ?? 0,
                  notes: data.notes || undefined,
                  components: data.components.map((c: any) => ({
                    source_batch_id: c.source_batch_id,
                    percentage: c.percentage ?? undefined,
                    volume_liters: c.volume_liters ?? undefined,
                    spillage: c.spillage ?? 0,
                  })),
                });
              }}
            />
          </div>
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
