import { useState, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, LayoutGrid, Clock, Layers, Activity } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBatchLogs } from '@/hooks/useBatchLogs';
import { useBatchSearch } from '@/hooks/production/useBatchSearch';
import { prefetchAdjacentBatches } from '@/lib/prefetchUtils';
import { QueryErrorBoundary } from '@/components/errors';
import { BatchProductionHeader } from '@/components/BatchProductionHeader';
import { StageProgressionUI } from '@/components/StageProgressionUI';
import { SmartInsights } from '@/components/SmartInsights';
import { ParameterTrendChart } from '@/components/ParameterTrendChart';
import { QuickActionsPanel } from '@/components/QuickActionsPanel';
import { OrganizedLogsList } from '@/components/OrganizedLogsList';
import { BatchTimeline } from '@/components/production/BatchTimeline';
import { GroupedBatchView } from '@/components/production/GroupedBatchView';
import { BatchActivityFeed } from '@/components/production/BatchActivityFeed';
import { ProductionMetricsWidget } from '@/components/production/ProductionMetricsWidget';
import { BatchContextMenuGuide } from '@/components/production/BatchContextMenuGuide';
import { ProgressOverview } from '@/components/production/ProgressOverview';

import type { Batch } from '@/types/batch.types';
import type { Batch as BatchType } from '@/types/batch.types';
import type { BatchLog } from '@/types/batchLog.types';

/**
 * ProductionTab Props
 */
interface ProductionTabProps {
  /** Array of all batches */
  batches: Batch[];
  /** Currently selected batch */
  selectedBatch: Batch | null;
  /** Callback when batch is selected - accepts nullable batch */
  onSelectBatch: (batch: Batch | null | undefined) => void;
  /** Callback when batch stage is updated - returns Promise */
  onUpdateStage: (batchId: string, newStage: Batch["currentStage"]) => Promise<void>;
}

/**
 * ProductionTab - Displays detailed production view for selected batch
 * 
 * Features:
 * - Batch search with debouncing
 * - Multiple view modes (grid, timeline, grouped)
 * - Stage progression tracking
 * - Smart insights and trends
 * - Quick actions panel
 * - Organized logs list
 * 
 * Business logic is extracted to custom hooks for better testability and reusability.
 */
export const ProductionTab = ({ 
  batches, 
  selectedBatch, 
  onSelectBatch,
  onUpdateStage,
}: ProductionTabProps) => {
  const queryClient = useQueryClient();
  const { batchSearchQuery, setBatchSearchQuery } = useAppStore();
  
  // Hooks - Business logic extracted
  const { logs, addLog, deleteLog, isLoading, isAdding } = useBatchLogs(selectedBatch?.id || null);
  const { results: searchResults } = useBatchSearch(batches as any, batchSearchQuery);
  
  // Local UI state
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'grouped' | 'activity'>('grid');

  /**
   * Handle adding a new log entry
   */
  const handleAddLog = (title: string = '', role: string = 'General') => {
    if (!selectedBatch) return;
    
    addLog({
      batchId: selectedBatch.id,
      title,
      role,
      stage: selectedBatch.currentStage,
    });
  };

  /**
   * Handle batch selection from search results (legacy batch format)
   */
  const handleSelectBatchFromSearch = (batch: any) => {
    onSelectBatch(batch);
    setBatchSearchQuery('');
    const currentIndex = (batches as any).findIndex((b: any) => b.id === batch.id);
    if (currentIndex >= 0) {
      prefetchAdjacentBatches(queryClient, batches as any, currentIndex, 3).catch(() => {});
    }
  };

  // ========== RENDER: Empty State ==========
  if (!selectedBatch) {
    return (
      <Card className="p-12 text-center border-dashed">
        <p className="text-muted-foreground">
          Select a batch from the "All Batches" tab to view production details.
        </p>
      </Card>
    );
  }

  // ========== RENDER: Loading State ==========
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ========== RENDER: Main Content ==========
  return (
    <QueryErrorBoundary>
      <div className="space-y-4">
        {/* Production Metrics Widget */}
        <ProductionMetricsWidget batches={batches as any} />
        
        {/* Progress Overview */}
        <ProgressOverview batches={batches as any} />
        

      {/* ========== Search Results Dropdown ========== */}
      {batchSearchQuery && (
        <Card className="p-2 max-h-[200px] overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map(({ batch }) => (
              <button
                key={batch.id}
                role="option"
                aria-selected={selectedBatch?.id === batch.id}
                onClick={() => handleSelectBatchFromSearch(batch)}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium text-sm">{batch.name}</span>
                <span className="text-xs text-muted-foreground">• {batch.variety}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {batch.currentStage}
                </Badge>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No batches found matching "{batchSearchQuery}"
            </p>
          )}
        </Card>
      )}

      {/* ========== Batch Header ========== */}
      <BatchProductionHeader batch={selectedBatch} allBatches={batches} />

      {/* ========== View Mode Toggle ========== */}
      <Tabs value={viewMode} onValueChange={(v) => startTransition(() => setViewMode(v as any))}>
        <TabsList role="tablist" aria-label="Production view modes">
          <TabsTrigger value="grid" className="gap-2" aria-label="Grid view">
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Grid
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2" aria-label="Timeline view">
            <Clock className="w-4 h-4" aria-hidden="true" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="grouped" className="gap-2" aria-label="Grouped view">
            <Layers className="w-4 h-4" aria-hidden="true" />
            Grouped
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2" aria-label="Activity view">
            <Activity className="w-4 h-4" aria-hidden="true" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ========== Content: View Mode Dependent ========== */}
        <TabsContent value="grouped" className="mt-4">
          <GroupedBatchView
            batches={batches as any}
            onSelectBatch={onSelectBatch as any}
            onDeleteBatch={(batchId: string) => {
              console.log('Delete batch:', batchId);
            }}
            onUpdateStage={onUpdateStage}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <BatchTimeline
            batch={{
              id: selectedBatch.id,
              name: selectedBatch.name,
              current_stage: selectedBatch.currentStage,
              started_at: selectedBatch.startDate,
              completed_at: selectedBatch.currentStage === 'Complete' ? new Date().toISOString() : null,
            }}
            variant="standard"
            onStageClick={(stage) => {
              console.log('Stage clicked:', stage);
            }}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <BatchActivityFeed batchId={selectedBatch.id} compact={false} />
        </TabsContent>

        <TabsContent value="grid" className="mt-4 space-y-4">;

          {/* Stage Progression UI */}
          <StageProgressionUI
            currentStage={selectedBatch.currentStage as any}
            batchId={selectedBatch.id}
            batchName={selectedBatch.name}
            onAdvanceStage={onUpdateStage}
          />

          {/* AI-Powered Smart Insights */}
          <SmartInsights
            batch={selectedBatch as any}
            logs={logs}
          />

          {/* Parameter Trend Charts - pH, OG, Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ParameterTrendChart
              title="OG"
              data={logs.map(l => ({
                date: l.created_at,
                value: l.og || null
              }))}
              color="hsl(var(--info))"
              unit="SG"
              targetValue={selectedBatch.targetOg ? selectedBatch.targetOg / 1000 : undefined}
            />
            <ParameterTrendChart
              title="pH"
              data={logs.map(l => ({
                date: l.created_at,
                value: l.ph || null
              }))}
              color="hsl(var(--warning))"
              unit=""
              targetValue={selectedBatch.targetPh}
            />
            <ParameterTrendChart
              title="Temperature"
              data={logs.map(l => ({
                date: l.created_at,
                value: l.temp_c || null
              }))}
              color="hsl(var(--destructive))"
              unit="°C"
            />
          </div>

          {/* Quick Actions Panel */}
          <QuickActionsPanel
            onAddMeasurement={() => handleAddLog('Measurement', 'Lab')}
            onAddObservation={() => handleAddLog('Observation', 'Observation')}
            onScheduleTask={() => handleAddLog('Task', 'Task')}
            onAddGeneral={() => handleAddLog('Note', 'General')}
          />
        </TabsContent>
      </Tabs>

      {/* ========== Organized Logs List ========== */}
      {logs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">
            No notes yet. Click "Add Note" above to get started.
          </p>
        </Card>
      ) : (
        <OrganizedLogsList
          logs={logs}
          onDeleteLog={deleteLog}
          onUpdateLog={() => {
            // Refresh logs after update
            queryClient.invalidateQueries({ queryKey: ['batch-logs', selectedBatch?.id] });
          }}
        />
      )}
      </div>
    </QueryErrorBoundary>
  );
};
