import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, X } from "lucide-react";
import { useBatchComparisonStore } from "@/stores/batchComparisonStore";
import { cn } from "@/lib/utils";

interface CompareSelectedButtonProps {
  onCompare: () => void;
  className?: string;
}

export const CompareSelectedButton = ({ onCompare, className }: CompareSelectedButtonProps) => {
  const { selectedBatchIds, clearSelection } = useBatchComparisonStore();

  if (selectedBatchIds.length < 2) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4", className)}>
      <div className="bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
        <Badge variant="default" className="rounded-full">
          {selectedBatchIds.length} selected
        </Badge>
        <Button
          onClick={onCompare}
          size="sm"
          className="gap-2 rounded-full"
        >
          <GitCompare className="w-4 h-4" />
          Compare Batches
        </Button>
        <Button
          onClick={clearSelection}
          size="sm"
          variant="ghost"
          className="rounded-full h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
