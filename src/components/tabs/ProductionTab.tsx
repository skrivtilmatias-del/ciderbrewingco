import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FlaskConical, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBatchLogs } from '@/hooks/useBatchLogs';
import { BatchProductionHeader } from '@/components/BatchProductionHeader';
import { StageProgressionUI } from '@/components/StageProgressionUI';
import { SmartInsights } from '@/components/SmartInsights';
import { ParameterTrendChart } from '@/components/ParameterTrendChart';
import { QuickActionsPanel } from '@/components/QuickActionsPanel';
import { OrganizedLogsList } from '@/components/OrganizedLogsList';
import type { Batch } from '@/components/BatchCard';
import { useQueryClient } from '@tanstack/react-query';

interface ProductionTabProps {
  batches: Batch[];
  selectedBatch: Batch | null;
  onSelectBatch: (batch: Batch) => void;
  onUpdateStage: (batchId: string, newStage: string) => void;
  onAddLog?: (title?: string, role?: string) => void;
}

export const ProductionTab = ({ 
  batches, 
  selectedBatch, 
  onSelectBatch,
  onUpdateStage,
  onAddLog: onAddLogProp
}: ProductionTabProps) => {
  const { batchSearchQuery, setBatchSearchQuery } = useAppStore();
  const { logs, addLog, deleteLog, updateLog, isLoading, isAdding, isDeleting } = useBatchLogs(selectedBatch?.id || null);
  const queryClient = useQueryClient();

  // Handle adding a log - use hook's addLog or fallback to prop
  const handleAddLog = (title: string = '', role: string = 'General') => {
    if (selectedBatch) {
      addLog({
        batchId: selectedBatch.id,
        title,
        role,
        stage: selectedBatch.currentStage,
      });
    }
  };

  if (!selectedBatch) {
    return (
      <Card className="p-12 text-center border-dashed">
        <p className="text-muted-foreground">
          Select a batch from the "All Batches" tab to view production details.
        </p>
      </Card>
    );
  }

  // Show loading skeleton while logs are loading
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

  return (
    <div className="space-y-4">
      {/* Search Results */}
      {batchSearchQuery && (
        <Card className="p-2 max-h-[200px] overflow-y-auto">
          {batches
            .filter((batch) => {
              const query = batchSearchQuery.toLowerCase();
              return (
                batch.name.toLowerCase().includes(query) ||
                batch.variety.toLowerCase().includes(query) ||
                batch.currentStage.toLowerCase().includes(query)
              );
            })
            .map((batch) => (
              <button
                key={batch.id}
                onClick={() => {
                  onSelectBatch(batch);
                  setBatchSearchQuery('');
                }}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
              >
                <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium text-sm">{batch.name}</span>
                <span className="text-xs text-muted-foreground">• {batch.variety}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {batch.currentStage}
                </Badge>
              </button>
            ))}
          {batches.filter((batch) => {
            const query = batchSearchQuery.toLowerCase();
            return (
              batch.name.toLowerCase().includes(query) ||
              batch.variety.toLowerCase().includes(query) ||
              batch.currentStage.toLowerCase().includes(query)
            );
          }).length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No batches found
            </p>
          )}
        </Card>
      )}

      {/* Batch Production Header */}
      <BatchProductionHeader batch={selectedBatch} />

      {/* Stage Progression */}
      <StageProgressionUI
        currentStage={selectedBatch.currentStage}
        batchId={selectedBatch.id}
        batchName={selectedBatch.name}
        onAdvanceStage={onUpdateStage}
      />

      {/* Smart Insights */}
      <SmartInsights
        batch={selectedBatch}
        logs={logs}
      />

      {/* Parameter Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ParameterTrendChart
          title="OG"
          data={logs.map(l => ({
            date: l.created_at,
            value: l.og || null
          }))}
          color="hsl(var(--info))"
          unit="SG"
          targetValue={selectedBatch.target_og ? selectedBatch.target_og / 1000 : undefined}
        />
        <ParameterTrendChart
          title="pH"
          data={logs.map(l => ({
            date: l.created_at,
            value: l.ph || null
          }))}
          color="hsl(var(--warning))"
          unit=""
          targetValue={selectedBatch.target_ph}
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

      {/* Organized Logs List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : logs.length === 0 ? (
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
            console.log('Log updated, invalidating batch-logs query for batch:', selectedBatch?.id);
            // Invalidate the batch-logs query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['batch-logs', selectedBatch?.id] });
          }}
        />
      )}
    </div>
  );
};
