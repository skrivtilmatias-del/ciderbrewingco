import { useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Apple, Award, LogOut, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NewBatchDialog } from '@/components/NewBatchDialog';
import { TastingAnalysisDialog } from '@/components/TastingAnalysisDialog';
import { toast } from 'sonner';
import { useBatches } from '@/hooks/useBatches';
import { ActiveUsersIndicator } from '@/components/ActiveUsersIndicator';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface AppHeaderProps {
  user: any;
  userProfile: any;
  userRole: string;
  onBatchCreated?: () => void;
  onTastingSaved?: (data: any, analysisId?: string) => void;
  blendBatches?: any[];
  onShowShortcuts?: () => void;
}

export const AppHeader = ({ 
  user, 
  userProfile, 
  userRole,
  onBatchCreated,
  onTastingSaved,
  blendBatches = [],
  onShowShortcuts
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const [tastingDialogOpen, setTastingDialogOpen] = useState(false);
  const { createBatch } = useBatches();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      startTransition(() => navigate('/auth'));
    }
  };

  const handleTastingSave = async (data: any, analysisId?: string) => {
    if (onTastingSaved) {
      await onTastingSaved(data, analysisId);
    }
    setTastingDialogOpen(false);
  };

  const handleBatchCreated = async (batchData: any) => {
    // Create batch via mutation - invalidation is handled automatically by useBatches hook
    createBatch({
      name: batchData.name,
      variety: batchData.variety,
      apple_origin: batchData.apple_origin,
      volume: batchData.volume,
      current_stage: batchData.currentStage,
      yeast_type: batchData.yeast_type,
      notes: batchData.notes,
      target_og: batchData.target_og,
      target_fg: batchData.target_fg,
      target_ph: batchData.target_ph,
      target_end_ph: batchData.target_end_ph,
      initial_temp_c: batchData.initial_temp_c,
    });
    
    // Call parent handler if provided
    if (onBatchCreated) {
      onBatchCreated();
    }
  };

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-screen-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Apple className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">
              Cider Brewing Co
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ConnectionStatus />
            <ActiveUsersIndicator />
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
              {userProfile?.full_name || user?.email}
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-10"
              size="sm"
              onClick={() => startTransition(() => setTastingDialogOpen(true))}
            >
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">New </span>Tasting
            </Button>
              </TooltipTrigger>
              <TooltipContent>Create a new tasting analysis</TooltipContent>
            </Tooltip>
            
            {userRole !== "taster" && (
              <NewBatchDialog onBatchCreated={handleBatchCreated} />
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
                  onClick={onShowShortcuts}
                >
                  <Keyboard className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
            </Tooltip>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tasting Analysis Dialog */}
      <TastingAnalysisDialog
        open={tastingDialogOpen}
        onOpenChange={setTastingDialogOpen}
        onSave={handleTastingSave}
        blendBatches={blendBatches}
      />
    </header>
  );
};
